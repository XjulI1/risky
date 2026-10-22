# Design

## Context

Dépôt vierge (voir proposal.md, section Why). Ce change pose le socle technique et le moteur de
règles sur lequel les changes suivants (plateau 3D, UI, IA, sauvegarde, variantes) viendront se
brancher. Les exigences fonctionnelles sont dans `specs/` ; ce document ne décrit que la manière de
les implémenter.

Contraintes structurantes :

- le moteur ne dépend ni de Vue ni de Three.js, pour être testé seul et réutilisé tel quel par l'IA ;
- l'état doit être du JSON pur pour la sauvegarde en localStorage prévue dans `add-save-and-journal` ;
- l'IA (`add-heuristic-ai`) simulera des milliers de coups : le moteur doit rester rapide et sans
  effet de bord.

## Goals / Non-Goals

**Goals :**

- Une API unique et étroite : créer une partie, appliquer une action, interroger l'état.
- Des erreurs de règle typées que l'UI pourra afficher et que l'IA pourra ignorer.
- Des événements assez riches pour piloter les animations (dés, conquêtes) et le journal.
- Des points d'extension prévus pour les variantes missions secrètes et capitales, sans les
  implémenter.

**Non-Goals :**

- Aucune réactivité Vue ni store (Pinia ou autre) : l'intégration à Vue viendra avec `add-game-ui`.
- Aucun usage de la géométrie de carte (contours, coordonnées) : elle sera exploitée par
  `add-3d-board`.
- Pas d'annulation de coup (undo) ; l'immutabilité la rendra triviale plus tard si besoin.

## Decisions

### Arborescence

```
src/
  engine/
    index.ts            API publique (createGame, applyAction, requêtes)
    types.ts            GameState, Action, GameEvent, RuleError, GameSettings
    rng.ts              générateur à graine
    maps/classic.ts     carte classique construite depuis data/maps/classic/, noms français
    setup.ts            création, répartition des territoires, placement initial
    reinforcement.ts
    combat.ts
    fortification.ts
    cards.ts
    turn.ts             transitions de phase, élimination, victoire
    queries.ts          requêtes en lecture pour l'UI et l'IA
    *.test.ts           tests colocalisés
  App.vue
  main.ts
```

Tests colocalisés plutôt qu'un dossier `tests/` : chaque règle et son test restent côte à côte, ce
qui facilite le TDD.

### Modèle « réducteur » : `applyAction(state, action) → ActionResult`

```ts
type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: RuleError }
```

Les actions sont une union discriminée (`claimTerritory`, `placeInitialArmy`, `tradeCards`,
`deploy`, `attack`, `moveAfterConquest`, `endAttack`, `fortify`, `skipFortify`), chacune portant le
`playerId` de son auteur. Un seul point d'entrée qui aiguille sur `action.type` puis sur la phase
courante.

`attack` ne porte que l'origine et la cible : le moteur enchaîne lui-même les lancers, avec le nombre
maximal de dés à chaque fois, jusqu'à la conquête ou à l'épuisement de l'attaquant, et renvoie un
événement par lancer. Il n'y a donc ni action de lancer unique ni choix du nombre de dés.

Alternatives écartées :

- **Classe `Game` avec méthodes mutables** : plus naturelle à écrire, mais incompatible avec la
  sérialisation directe et dangereuse pour l'IA qui explore des branches.
- **Machine à états XState** : dépendance lourde pour une machine à 7 phases ; un champ `phase` en
  union discriminée suffit et reste du JSON.

`RuleError` porte un `code` littéral (`NOT_YOUR_TURN`, `WRONG_PHASE`, `NOT_OWNER`,
`NOT_ADJACENT`, `INVALID_ARMY_COUNT`, `INVALID_CARD_SET`, `GAME_OVER`, …) et
un message en français affichable tel quel.

### Immutabilité par copie à l'entrée

`applyAction` fait un `structuredClone` de l'état puis les fonctions de règles modifient cette copie.
L'état fait quelques kilo-octets (42 territoires, 44 cartes) : le coût est négligeable, et cela évite
à la fois une bibliothèque (Immer) et la lourdeur de mises à jour immuables imbriquées écrites à la
main. Un test vérifie que l'état d'entrée n'est jamais modifié.

### Forme de l'état

```ts
type GameState = {
  settings: GameSettings
  mapId: 'classic'
  players: Player[]
  territories: Record<TerritoryId, { owner: PlayerId; armies: number }>
  currentPlayerIndex: number
  phase: Phase
  deck: Card[]
  discard: Card[]
  hands: Record<PlayerId, Card[]>
  tradeCount: number
  conqueredThisTurn: boolean
  rngState: number
  winner: PlayerId | null
}
```

`Phase` est une union discriminée qui porte ses propres données :
`{ kind: 'claim' }`, `{ kind: 'placement'; remaining: Record<PlayerId, number> }`,
`{ kind: 'reinforce'; reserve: number }`, `{ kind: 'attack' }`,
`{ kind: 'conquestMove'; from; to; minArmies; maxArmies }`,
`{ kind: 'eliminationTrade'; reserve: number }`, `{ kind: 'fortify' }`, `{ kind: 'gameOver' }`.
Ainsi une donnée n'existe que dans la phase où elle a un sens (la réserve n'existe pas en attaque).

La carte n'est pas copiée dans l'état : `mapId` la référence et les données statiques sont lues
depuis `maps/`. Cela garde l'état léger et laisse la place à d'autres cartes.

Pas de `Map` ni de `Set` dans l'état : uniquement des objets et tableaux, pour que
`JSON.parse(JSON.stringify(state))` soit l'identité.

### Données de la carte

La carte n'est pas saisie à la main : elle est construite à partir des fichiers récupérés dans
`data/maps/classic/` (provenance et licences dans `SOURCE.md`), importés comme modules JSON
(`resolveJsonModule`) :

- `board.json` fournit les bonus de continent et les adjacences ;
- `territories.json` fournit la liste des territoires et leur continent. Le moteur ne lit que les
  champs `id` et `continent` ; les contours et points d'ancrage qu'il contient sont réservés au
  plateau 3D.

Les identifiants des données sont repris tels quels comme identifiants du moteur : `snake_case`
anglais pour les territoires (`north_africa`, `eastern_australia`…) et `camelCase` pour les
continents (`northAmerica`, `australia`…). Le plateau 3D et le moteur partagent ainsi les mêmes
identifiants sans table de correspondance. Les noms anglais de `board.json` ne sont pas utilisés :
`maps/classic.ts` déclare les noms français des 42 territoires et des 6 continents (le continent
`australia` s'affiche « Océanie »), et un test vérifie qu'il n'en manque aucun.

Les fichiers de `data/maps/classic/` ne sont jamais modifiés, pour rester identiques à leur source ;
tout complément vit dans `maps/classic.ts`.

### Générateur aléatoire

Un générateur mulberry32 (32 bits, quelques lignes, sans dépendance) dont l'état entier est stocké
dans `rngState`. Chaque tirage lit `rngState`, renvoie la valeur et écrit le nouvel état. Mélanges par
Fisher-Yates sur ce générateur. `Math.random` n'est utilisé nulle part dans le moteur ; seul l'appelant
choisit la graine (par exemple `Date.now()` dans l'UI).

Pour tester la résolution des dés sur des valeurs précises (scénarios de la spec combat), la fonction
de comparaison des dés est pure et testée directement avec des lancers fixés ; les tests de bout en
bout passent par une graine connue.

### Points d'extension pour les variantes

- La victoire est évaluée par une fonction dédiée de `turn.ts`, appelée après chaque action qui
  change un propriétaire ; les variantes missions et capitales y ajouteront leurs conditions.
- `GameSettings` est un objet plat ; les variantes y ajouteront leurs champs avec valeurs par défaut,
  sans changer les parties existantes.

### Garde-fou d'architecture

Une règle ESLint `no-restricted-imports` interdit d'importer `vue`, `three` ou `@tresjs/*` depuis
`src/engine/**`. La pureté du moteur est ainsi vérifiée par le lint plutôt que par convention.

### Outillage

- Vite + `@vitejs/plugin-vue`, TypeScript `strict` avec `noUncheckedIndexedAccess` (les accès par
  identifiant de territoire sont fréquents et ce réglage force à traiter l'absence).
- Vitest en environnement `node` pour le moteur (aucun DOM nécessaire).
- `vue-tsc --noEmit` pour la vérification de types.
- ESLint en configuration « flat » avec `typescript-eslint` et `eslint-plugin-vue`.
- Scripts : `dev`, `build`, `test`, `test:watch`, `lint`, `type-check`.
- Champ `packageManager` dans `package.json` pour figer la version de pnpm.

Tailwind et TresJS ne sont pas installés ici : ils arrivent avec les changes qui les utilisent.

## Risks / Trade-offs

- [Données de carte récupérées erronées ou incomplètes] → tests d'invariants (symétrie, connexité,
  pas de boucle, liaisons maritimes connues, 83 liaisons au total) et cohérence des identifiants entre
  `board.json` et `territories.json`.
- [Le modèle de phases ne couvre pas un cas de règle découvert plus tard] → phases en union
  discriminée : ajouter un cas fait échouer le typage partout où il faut le traiter.
- [`structuredClone` à chaque action trop coûteux pour l'IA] → acceptable pour l'heuristique prévue ;
  si une IA par simulation arrivait, mesurer avant d'optimiser.
- [Simplification des règles à deux joueurs : territoires et armées du neutre tirés au hasard au lieu
  d'être placés par les joueurs] → choix validé pour un jeu solo ; documenté dans la spec
  `game-setup`.
- [Bonus de territoire placé automatiquement au lieu d'un choix du joueur] → priorité au premier
  territoire éligible voisin d'un adversaire, là où les armées servent ; simplification validée.
- [Attaques toujours menées jusqu'au bout : le joueur ne peut plus s'arrêter après un lancer
  défavorable] → choix validé ; il évite toute interruption et les probabilités de conquête restent
  celles de l'attaque complète, que l'IA calcule exactement.

## Migration Plan

Sans objet (projet vierge).
