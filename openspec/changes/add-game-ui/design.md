# Design

## Context

Disponibles à ce stade : le moteur (`createGame`, `applyAction` qui renvoie état + événements, requêtes
en lecture) et le composant `GameBoard` (props état + surbrillances, événement de sélection). Ce change
les relie et ajoute toute l'interface 2D. Motivation : proposal.md ; exigences : `specs/`.

La difficulté principale n'est pas l'affichage mais la **coordination dans le temps** : le moteur
calcule instantanément l'état final d'un blitz de 6 lancers, alors que l'écran doit montrer chaque
lancer, puis la conquête, puis le déplacement, dans l'ordre.

## Goals / Non-Goals

**Goals :**

- Toute la logique d'interface décisionnelle en fonctions pures testées (quelle surbrillance, quel
  panneau, quelle action moteur), les composants ne faisant qu'afficher et relayer.
- Un point d'entrée unique pour agir sur la partie, que l'IA réutilisera dans `add-heuristic-ai`.

**Non-Goals :**

- Pas de vue-router : 4 écrans sans URL partageable ni historique utile.
- Pas de Pinia : un composable et `provide`/`inject` suffisent pour une seule session de jeu.

## Decisions

### Arborescence

```
src/
  game/
    useGameSession.ts        session : état moteur, état affiché, dispatch, file de présentation
    interaction.ts           contrôleur d'interaction pur
    presentation.ts          événements moteur → étapes d'animation, projection sur l'état affiché
    animationSpeed.ts        vitesses, durées, préférence mémorisée
    cardAdvice.ts            meilleure série d'une main, valeur affichée
  ui/
    screens/HomeScreen.vue, CreateGameScreen.vue, GameScreen.vue, GameOverOverlay.vue
    hud/StatusBar.vue, PlayersPanel.vue, AmountPicker.vue, AttackPanel.vue,
        CardHand.vue, DiceTray.vue, HandoffScreen.vue, Toast.vue
  App.vue                    bascule d'écran
```

### Session de jeu : deux états

`useGameSession` détient :

- `engineState` : la vérité, mise à jour dès que le moteur accepte une action ;
- `displayedState` : ce que montrent le plateau et le HUD, qui rattrape `engineState` au rythme des
  animations ;
- une file d'étapes de présentation et un indicateur `isPresenting`.

`dispatch(action)` appelle le moteur ; en cas de succès, il remplace `engineState`, convertit les
événements en étapes (`presentation.ts`) et les joue une à une. Chaque étape applique sa projection
sur `displayedState` (par exemple : pertes d'un lancer retirées des deux territoires). À la fin de la
file, `displayedState` reçoit `engineState` tel quel ; en développement, un contrôle signale toute
divergence entre la projection et l'état réel. Les entrées utilisateur sont ignorées tant que
`isPresenting` est vrai, sauf le toucher qui passe l'animation (la file est alors vidée et
`displayedState` reçoit directement `engineState`).

Alternative écartée : faire produire par le moteur un état intermédiaire par lancer. Cela alourdit
l'API du moteur pour un besoin purement visuel ; les événements contiennent déjà toutes les données.

La session est fournie par `provide` dans `GameScreen` et lue par `inject` dans les composants du HUD.
Les états sont des `shallowRef` : on remplace l'objet entier, jamais de mutation en profondeur.

### Contrôleur d'interaction pur

```ts
type Interaction =
  | { kind: 'idle' }
  | { kind: 'deployAmount'; territory: TerritoryId }
  | { kind: 'attackFrom'; from: TerritoryId }
  | { kind: 'attackPanel'; from: TerritoryId; to: TerritoryId }
  | { kind: 'fortifyFrom'; from: TerritoryId }
  | { kind: 'fortifyAmount'; from: TerritoryId; to: TerritoryId }

reduceInteraction(game, interaction, input) → { interaction; action?: Action }
viewOf(game, interaction) → { highlights; panel; enabledButtons }
```

`input` vaut un toucher de territoire, un toucher d'océan ou un bouton du HUD. La phase du moteur
détermine les parcours possibles ; les phases sans choix de territoire (déplacement après conquête,
échange obligatoire) sont pilotées par `viewOf` seul. Ce module concentre toute la logique des specs
`turn-controls` et se teste sans DOM ni WebGL.

### Dés : cubes CSS 3D

`DiceTray` affiche des cubes en transformations CSS 3D au-dessus du plateau : animation de roulement,
arrêt forcé sur la face donnée par l'événement, puis tri et alignement par paires. Alternative
écartée : dés dans la scène TresJS, qui dépendraient de la position de caméra et mobiliseraient le
rendu WebGL pour un élément d'interface.

### Vitesses d'animation

Une table unique dans `animationSpeed.ts` donne, par vitesse, la durée d'un lancer, d'un lancer de
blitz, d'une transition de conquête et d'un déplacement d'armées ; « instantanée » vaut 0 partout.
La préférence est mémorisée dans `localStorage` (lecture et écriture protégées par `try/catch`,
valeur par défaut si indisponible), avec repli sur `prefers-reduced-motion`.

### Passage de main

La session sait qui est humain. Quand `currentPlayer` change vers un humain différent du précédent
humain et que la partie compte au moins deux humains, `GameScreen` affiche `HandoffScreen` par-dessus
tout. La carte piochée est montrée avant ce passage pour rester privée.

### Style

Tailwind CSS v4 via `@tailwindcss/vite`. Les couleurs d'interface sont des variables CSS de thème ;
les couleurs des joueurs viennent de la partie et sont appliquées en style en ligne. Mise en page :
plateau en plein écran, HUD en position fixe, en volet bas sous 768 px de large en portrait.

### Tests

Vitest est découpé en deux projets : `engine` en environnement `node` (inchangé) et `ui` en
environnement `happy-dom` pour `src/game` et `src/ui`. Les modules purs (`interaction`,
`presentation`, `cardAdvice`, `animationSpeed`) sont testés en premier ; quelques tests de composants
avec `@vue/test-utils` couvrent le formulaire de création et la main de cartes. Le rendu 3D et les
animations restent vérifiés visuellement.

## Risks / Trade-offs

- [Divergence entre l'état projeté et l'état réel] → la fin de file réaligne toujours sur
  `engineState`, et le contrôle de développement rend toute divergence visible tout de suite.
- [Interactions pendant une animation] → entrées ignorées pendant `isPresenting`, sauf passer
  l'animation.
- [Volet bas trop haut sur petits téléphones] → volet repliable, plateau toujours manipulable
  au-dessus.
- [Hot-seat : informations privées visibles à l'autre joueur] → écran de passage de main ; c'est un
  confort plus qu'une garantie, acceptable pour un jeu local.
