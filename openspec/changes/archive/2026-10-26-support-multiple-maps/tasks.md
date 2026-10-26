# Tasks

## 1. Catalogue de cartes (moteur)

- [x] 1.1 Écrire les tests de `mapInvariants` : la carte classique ne présente aucune violation ; des cartes de test construites à la main signalent chacune leur violation (identifiant en double, territoire sans continent, continent vide, bonus nul, adjacence asymétrique, boucle, graphe non connexe, mission citant un continent absent, en nommant ce continent).
- [x] 1.2 Écrire les tests du catalogue : `mapById('classic')` renvoie la carte classique, `isMapId` refuse « atlantide », le continent Amérique du Nord a pour nom avec article « l'Amérique du Nord », `continentTerm` vaut « continent » au masculin, les six missions de continents sont celles de la règle.
- [x] 1.3 Ajouter `MapId`, `MAPS`, `isMapId`, `mapById`, les champs `id`, `continentTerm`, `continentMissions` de `GameMap` et `nameWithArticle` de `Continent` ; écrire `mapInvariants.ts` ; réécrire `mapOf` sur `MAPS` ; retirer de `classic.test.ts` les vérifications reprises par les invariants ; vérifier que les tests 1.1, 1.2 et les tests existants du moteur passent.

## 2. Règles sur la carte de la partie (moteur)

- [x] 2.1 Écrire les tests de création : sans `mapId` la partie porte `mapId: 'classic'`, `mapId: 'atlantide'` est refusé avec le code `unknownMap` et le message « Carte inconnue : atlantide ».
- [x] 2.2 Écrire les tests des missions : `generalMissions(classicMap)` donne les 8 missions de la règle dans l'ordre, `missionDeck` reçoit la carte, une carte de test à continent féminin produit « une troisième région au choix » et une mission de continents avec article tiré de `nameWithArticle`.
- [x] 2.3 Ajouter `GameConfig.mapId`, l'erreur `unknownMap`, `generalMissions(map)` ; remplacer `classicMap` par `mapOf(state)` dans `setup`, `missions`, `combat`, `fortification` et partout ailleurs dans `src/engine/` hors catalogue et utilitaires de test ; vérifier que les tests 2.1, 2.2 et toute la suite du moteur (dont la partie complète) passent sans changer leurs attentes.

## 3. IA

- [x] 3.1 Remplacer `classicMap` par `mapOf(view)` ou `mapOf(state)` dans `evaluation`, `strategy`, `normal`, `hard`, `missionObjective`, `capitalObjective`, `playerView` et `expert/determinization` ; vérifier que tous les tests de l'IA passent, que le test de robustesse ne rejette aucune action et que le tournoi de référence donne exactement les mêmes victoires qu'avant le change (mêmes graines, mêmes décisions).

## 4. Plateau

- [x] 4.1 Réécrire `mapGeometry`, `anchors`, `capitalLayout` et `seaRoutes` en fonctions pures des données brutes d'une carte, et adapter leurs tests pour qu'ils s'exécutent sur chaque carte du catalogue de rendu ; vérifier que les tests de géométrie existants passent avec les mêmes valeurs sur la carte classique.
- [x] 4.2 Écrire le test de `boardMapFor` : pour chaque carte du catalogue, exactement une forme par territoire du moteur et aucune autre, une position d'étiquette par continent, profondeur du monde conforme au rapport du `viewBox` ; même objet renvoyé à deux appels successifs.
- [x] 4.3 Créer `src/board/maps/index.ts` et `boardMapFor` ; paramétrer `cameraFraming` et `OceanPlane` par les dimensions de la carte et adapter `useBoardCamera` ; brancher `GameBoard` et `boardViewModel` sur `state.mapId` ; vérifier que les tests 4.2 et `cameraFraming.test.ts` passent, puis vérifier visuellement avec `pnpm dev` que le plateau classique est identique (cadrage initial, zoom, liaisons maritimes, Alaska–Kamtchatka, étiquettes, capitales).

## 5. Interface et sauvegarde

- [x] 5.1 Remplacer `classicMap` par la carte de la partie dans `GameScreen`, `CardHand`, `DrawnCardNotice`, `CapitalsRevealedNotice`, `CapitalLostAlert`, `interaction.ts`, `journal.ts` et `missionDisplay.ts` (libellé « Continent au choix » construit depuis `continentTerm`) ; vérifier que les tests existants de ces modules passent sans changer leurs attentes.
- [x] 5.2 Ajouter `mapId` à `GameSetup` (`'classic'` dans `defaultSetup`) et le transmettre à `createGame` ; vérifier que `gameForm.test.ts` et `useGameSession.test.ts` passent.
- [x] 5.3 Écrire les tests de persistance : une sauvegarde au format 3 sans `mapId` dans sa configuration est reprise sur la carte classique, une sauvegarde dont l'état porte un `mapId` inconnu ou des territoires d'une autre carte est traitée comme illisible.
- [x] 5.4 Adapter `isCreation` et `isEngineState` ; vérifier que les tests 5.3 et les tests de persistance existants passent.

## 6. Garde-fou et vérification

- [x] 6.1 Ajouter dans `eslint.config.js` une règle `no-restricted-imports` qui interdit d'importer `classicMap` dans `src/**` hors de `src/engine/maps/`, des fichiers de test, de `testUtils.ts` et de `testScenarios.ts` ; vérifier que `pnpm lint` passe et qu'un import ajouté temporairement dans `src/game/labels.ts` est signalé.
- [x] 6.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build`, puis jouer une partie sur ordinateur et reprendre une sauvegarde écrite avant le change ; vérifier que tout passe et qu'aucune différence n'est visible.
