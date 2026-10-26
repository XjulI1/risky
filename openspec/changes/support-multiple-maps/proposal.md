## Why

Une deuxième carte, la France métropolitaine, est prévue (change `add-france-map`). Aujourd'hui la
carte classique est importée en dur dans près de 25 fichiers du moteur, de l'IA, du plateau et de
l'interface, et ses missions comme ses textes (« un troisième continent au choix ») sont écrits pour
elle seule. Ce change rend le jeu indépendant de la carte, sans rien changer à ce que voit le joueur,
pour que l'ajout de la France se limite ensuite à des données et à quelques écrans.

## What Changes

- **Carte de la partie** : la configuration de création accepte un identifiant de carte facultatif
  (« classique » par défaut) ; une carte inconnue est refusée. Toutes les règles (adjacence, bonus,
  renforts, cartes, missions, capitales) lisent la carte de la partie au lieu de la carte classique.
- **Catalogue de cartes** dans le moteur : chaque carte fournit ses territoires, ses continents
  (avec leur nom précédé de l'article), ses bonus, ses adjacences, ses missions de continents et le
  mot qui désigne ses continents dans les textes (« continent » pour la carte classique).
- **Missions de continents propres à la carte** : le paquet de missions prend les missions de
  continents de la carte de la partie ; pour la carte classique, ce sont les six missions actuelles.
- **IA** : toutes les heuristiques et l'IA experte lisent la carte de la partie à travers leur vue.
- **Plateau** : géométrie, liaisons maritimes, étiquettes de continent et cadrage de la caméra sont
  calculés pour la carte de la partie au lieu d'être figés au chargement du module.
- **Sauvegarde** : la configuration enregistrée retient la carte ; une sauvegarde existante, qui
  n'en porte pas, reprend sur la carte classique. Pas de changement de version de format.
- Aucun changement visible : une seule carte reste proposée, et le formulaire de création ne change
  pas.

## Capabilities

### New Capabilities

(aucune)

### Modified Capabilities

- `world-map` : ajout d'un catalogue de cartes et des invariants communs à toute carte.
- `game-setup` : la création d'une partie accepte un identifiant de carte, classique par défaut.
- `secret-missions` : les missions de continents du paquet viennent de la carte de la partie.
- `board-rendering` : la géométrie rendue est celle de la carte de la partie.
- `game-persistence` : la reprise restaure la carte de la partie, classique pour une sauvegarde qui
  n'en précise pas.

## Hors périmètre

- La carte de France elle-même, son choix dans le formulaire et son équilibrage : change
  `add-france-map`.
- Le trait épaissi entre deux territoires de continents différents : change `add-france-map`.
- Le chargement de cartes définies par l'utilisateur ou téléchargées.

## Impact

- Moteur : type `MapId`, catalogue `src/engine/maps/`, `mapOf(state)` partout à la place de
  `classicMap`, `GameConfig.mapId`, champs `nameWithArticle` sur `Continent` et vocabulaire de
  continent sur `GameMap`, missions générales déplacées dans la définition de la carte.
- IA : `evaluation`, `strategy`, niveaux normal et difficile, objectifs de mission et de capitale,
  `playerView`, déterminisation de l'expert.
- Plateau : `mapGeometry`, `seaRoutes`, `cameraFraming`, `GameBoard`, `boardViewModel` paramétrés
  par la carte.
- Interface : noms de territoires et de continents lus dans la carte de la partie (HUD, journal,
  cartes, alertes, mission), `GameSetup.mapId`.
- Sauvegarde : validation des territoires selon la carte de la sauvegarde.
- Aucune nouvelle dépendance, aucune installation.
