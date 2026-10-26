# Design

## Context

`GameState.mapId` existe déjà (type `'classic'`) et `mapOf(state)` (`src/engine/state.ts`) sait déjà
renvoyer la carte d'une partie, mais presque personne ne l'appelle : le moteur (`setup`, `combat`,
`fortification`, `missions`), l'IA (`evaluation`, `strategy`, niveaux, `playerView`, déterminisation
de l'expert), le plateau et l'interface importent `classicMap` directement. Côté plateau, la
géométrie (`mapGeometry.ts`), les liaisons maritimes (`seaRoutes.ts`), les étiquettes de continent
et les dimensions du monde (`MAP_WORLD_DEPTH`, coins de cadrage dans `cameraFraming.ts`) sont des
constantes calculées à l'import du module, à partir des JSON de `data/maps/classic/`. Motivation :
proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Qu'aucun module hors du catalogue ne connaisse la carte classique : tout passe par la carte de la
  partie.
- Comportement strictement identique sur la carte classique : tous les tests existants passent sans
  modification de leurs attentes, le tournoi de référence donne les mêmes résultats.

**Non-Goals :**

- Pas de chargement paresseux des cartes : elles sont toutes dans le bundle (quelques centaines de
  Ko au plus), ce qui garde le jeu hors ligne simple.
- Pas de choix de carte dans l'interface tant qu'il n'y a qu'une carte.

## Decisions

### Catalogue côté moteur

- `type MapId = 'classic'` (union élargie par `add-france-map`), `GameState.mapId: MapId`.
- `src/engine/maps/index.ts` expose `MAPS: Record<MapId, GameMap>`, `isMapId(value)` et `mapById(id)`.
  `mapOf(state)` devient `MAPS[state.mapId]`. Un `Record` plutôt que le `switch` actuel : ajouter une
  carte revient à ajouter une entrée, et `isMapId` sert à la validation de la création et de la
  sauvegarde.
- `GameMap` gagne `id: MapId`, `continentTerm: { singular: string; feminine: boolean }` et
  `continentMissions: Mission[]` ; `Continent` gagne `nameWithArticle`. Pour la carte classique :
  `{ singular: 'continent', feminine: false }`, les six missions actuelles, et des noms avec article
  écrits en dur à côté des noms français.
- `GENERAL_MISSIONS` disparaît au profit de `generalMissions(map)` = missions de continents de la
  carte + les deux missions chiffrées communes. `missionDeck` reçoit la carte.
- Les textes « un troisième continent au choix » et « Continent au choix 1/1 » sont construits à
  partir de `continentTerm` (« un troisième … », « une troisième … » selon le genre). L'article
  disparaît de `missions.ts` : `continentLabel` lit `nameWithArticle`.
- `areAdjacent(map, a, b)` garde sa signature ; `combat` et `fortification` lui passent `mapOf(state)`
  au lieu de `classicMap`.
- `GameConfig.mapId?: MapId` ; `createGame` refuse une valeur absente du catalogue avec un nouveau
  code d'erreur `unknownMap` (message « Carte inconnue : <id> »).
- Un module `mapInvariants.ts` vérifie les invariants de la spec `world-map` sur une `GameMap` et
  renvoie la liste des violations ; un test l'applique à toutes les cartes du catalogue. Il remplace
  les vérifications équivalentes de `classic.test.ts` qui ne sont pas propres à la carte classique.
- `classicMap` reste exporté pour les tests (`testUtils`, scénarios d'IA) mais n'est plus importé par
  le code de production hors du catalogue. Une règle de lint `no-restricted-imports` l'interdit dans
  `src/**` sauf dans `src/engine/maps/` et les fichiers `*.test.ts` / `testUtils.ts` /
  `testScenarios.ts`, pour que la dérive ne revienne pas.

### IA

`PlayerView` étend `PublicState`, qui porte déjà `mapId`. Chaque fonction qui lisait `classicMap`
appelle `mapOf(view)` ; aucune signature ne change. La déterminisation de l'expert reconstruit le
paquet avec `buildDeck(mapOf(state))`. `mapOf` est une lecture de `Record` : aucun coût mesurable,
y compris dans les simulations de l'expert.

### Plateau

- `src/board/maps/index.ts` associe à chaque `MapId` ses données de rendu (`territories.json`,
  `sea-routes.json`, `continent-labels.json`) et expose `boardMapFor(mapId): BoardMap`, mémoïsé par
  identifiant. `BoardMap` regroupe ce que les modules calculent aujourd'hui à l'import : dimensions
  du monde, `svgToWorld`, géométrie par territoire, ancres de pion, disposition des capitales,
  segments maritimes, amorces de bord, positions d'étiquettes.
- `mapGeometry.ts`, `anchors.ts`, `capitalLayout.ts`, `seaRoutes.ts` deviennent des fonctions pures
  qui prennent les données brutes d'une carte ; `boardMapFor` les assemble.
- `cameraFraming.ts` reçoit les dimensions du monde (`fitDistance(aspect, size)`, `clampTarget(target,
  size)`, taille moyenne d'un territoire calculée depuis `BoardMap`). La largeur du monde reste fixée
  à 100 unités ; la profondeur suit le rapport du `viewBox` de la carte.
- `OceanPlane.vue` reçoit ces mêmes dimensions au lieu d'importer `MAP_WORLD_WIDTH` et
  `MAP_WORLD_DEPTH`.
- `GameBoard.vue` calcule `boardMapFor(state.mapId)` et passe les données à ses enfants ;
  `boardViewModel` reçoit la carte du moteur. La lumière et les ombres gardent leur étendue fixe
  (`SHADOW_EXTENT = 60`), suffisante pour un monde de 100 unités de large et jusqu'à 120 de profondeur.

Alternative écartée : un `provide/inject` de la carte dans tout l'arbre Vue. Le plateau a peu de
niveaux et les composants enfants reçoivent déjà leurs données par props ; un `inject` cacherait la
dépendance sans rien simplifier.

### Interface

Les composants qui affichent un nom (`GameScreen`, `CardHand`, `DrawnCardNotice`,
`CapitalsRevealedNotice`, `CapitalLostAlert`, `journal.ts`, `missionDisplay.ts`, `interaction.ts`)
lisent `mapOf(state)`. Ceux qui ne reçoivent pas l'état reçoivent le nom déjà résolu ou l'identifiant
de carte en prop, selon ce qui modifie le moins leur interface actuelle.

`GameSetup` gagne `mapId: MapId`, valeur `'classic'` dans `defaultSetup`, transmis à `createGame`.

### Sauvegarde

- Pas de changement de `formatVersion` : l'état du moteur porte déjà `mapId: 'classic'` dans les
  sauvegardes existantes. Le format 3 est étendu de façon compatible.
- `isEngineState` vérifie que `mapId` est au catalogue puis compare les territoires à ceux de
  `MAPS[mapId]` au lieu de `classicMap`.
- `isCreation` accepte une configuration sans `mapId` ; la lecture la complète avec `'classic'`.
  Alternative écartée : passer en format 4, qui aurait effacé la partie en cours de l'utilisateur
  pour une information déductible.

## Risks / Trade-offs

- [Un import de `classicMap` oublié laisse la future carte de France jouer sur la mauvaise
  topologie sans erreur visible] → règle de lint qui interdit l'import hors du catalogue et des
  tests ; `add-france-map` ajoute ensuite la carte de France au test de robustesse de l'IA et à la
  partie complète du moteur, qui échoueraient sur une topologie erronée.
- [Le plateau recalcule sa géométrie à chaque changement d'état] → `boardMapFor` est mémoïsé par
  identifiant, et `GameBoard` ne le recalcule que si `state.mapId` change, ce qui n'arrive pas en
  cours de partie.
- [Les tests de géométrie écrits « pour chacun des 42 territoires » deviennent paramétrés par carte
  et s'allongent avec la seconde carte] → coût marginal, ce sont des calculs de polygones.

## Migration Plan

Aucune migration de données : les sauvegardes existantes restent lisibles. Retour arrière possible
en revenant au commit précédent, les sauvegardes écrites entre-temps portant toujours `mapId:
'classic'`.
