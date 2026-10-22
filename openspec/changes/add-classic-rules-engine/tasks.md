# Tasks

## 1. Socle du projet

- [ ] 1.1 Initialiser le dépôt git avec un `.gitignore` (node_modules, dist, coverage, .DS_Store) ; vérifier avec `git status`.
- [ ] 1.2 Écrire `package.json` (scripts `dev`, `build`, `test`, `test:watch`, `lint`, `type-check`, champ `packageManager`) avec les dernières versions stables de vue, vite, @vitejs/plugin-vue, typescript, vue-tsc, vitest, eslint, typescript-eslint, eslint-plugin-vue. **Demander à l'utilisateur de lancer `pnpm install`** et attendre sa confirmation.
- [ ] 1.3 Ajouter `vite.config.ts`, `tsconfig*.json` (strict, `noUncheckedIndexedAccess`), `vitest.config.ts` (environnement node), `index.html`, `src/main.ts` et `src/App.vue` (écran d'accueil provisoire) ; vérifier que `pnpm build` et `pnpm type-check` passent.
- [ ] 1.4 Configurer ESLint (flat config, typescript-eslint, eslint-plugin-vue) avec la règle `no-restricted-imports` interdisant `vue`, `three` et `@tresjs/*` dans `src/engine/**` ; vérifier que `pnpm lint` passe et qu'un import de `vue` ajouté temporairement dans `src/engine/` est signalé.

## 2. Types et générateur aléatoire

- [ ] 2.1 Définir dans `src/engine/types.ts` les types `GameState`, `Phase`, `Action`, `ActionResult`, `GameEvent`, `RuleError`, `GameSettings`, `Card`, `Player` selon le design ; vérifier avec `pnpm type-check`.
- [ ] 2.2 Écrire les tests du générateur : même graine → même suite, valeurs entières dans les bornes demandées, mélange déterministe qui conserve tous les éléments.
- [ ] 2.3 Implémenter `src/engine/rng.ts` (mulberry32 avec état explicite, tirage d'entier, Fisher-Yates) ; vérifier que les tests 2.2 passent.

## 3. Carte classique (`world-map`)

- [ ] 3.1 Écrire les tests d'invariants de la carte : 42 territoires, 6 continents, tailles et bonus, identifiants uniques et identiques entre `board.json` et `territories.json`, symétrie, absence de boucle, connexité, 83 liaisons, liaisons maritimes Alaska–Kamtchatka, Brésil–Afrique du Nord, Siam–Indonésie, nom français pour chaque territoire et chaque continent.
- [ ] 3.2 Implémenter `src/engine/maps/classic.ts` à partir de `data/maps/classic/board.json` et `territories.json` (champs `id` et `continent` seulement), avec la table des noms français, et activer `resolveJsonModule` ; vérifier que les tests 3.1 passent et que les fichiers de `data/maps/classic/` sont inchangés.

## 4. Création et mise en place (`game-setup`)

- [ ] 4.1 Écrire les tests de création : 2 à 6 joueurs, refus à 1 et à 7, refus des identifiants ou couleurs en double, réglages par défaut, réglage partiel, réglage hors bornes, neutre ajouté seulement à 2 joueurs, premier joueur déterministe pour une graine donnée.
- [ ] 4.2 Écrire les tests du paquet de cartes à la création : 44 cartes, 14 par symbole, 2 jokers, un territoire par carte.
- [ ] 4.3 Écrire les tests du placement aléatoire : tous les territoires occupés avec au moins une armée, 10 ou 11 territoires par joueur à 4, armées initiales exactes (25 à 5 joueurs, 40 pour chacun à 2 joueurs neutre compris), partie en renforts du premier joueur.
- [ ] 4.4 Implémenter `createGame` et le placement aléatoire dans `src/engine/setup.ts` ; vérifier que les tests 4.1 à 4.3 passent.
- [ ] 4.5 Écrire les tests du placement manuel : revendication d'un territoire libre, refus d'un territoire pris, 14 territoires neutres tirés au hasard à 2 joueurs, passage au placement, refus d'un placement sur territoire adverse, joueur sans armée restante sauté, passage en renforts du premier joueur.
- [ ] 4.6 Implémenter les actions `claimTerritory` et `placeInitialArmy` ; vérifier que les tests 4.5 passent.

## 5. Point d'entrée, validation et phases (`turn-flow`)

- [ ] 5.1 Écrire les tests de `applyAction` : refus hors tour (`NOT_YOUR_TURN`), refus hors phase (`WRONG_PHASE`), état d'entrée jamais modifié, état sérialisé puis désérialisé qui se poursuit à l'identique.
- [ ] 5.2 Implémenter `applyAction` dans `src/engine/index.ts` (copie `structuredClone`, aiguillage par type d'action et par phase, contrôle du joueur courant) ; vérifier que les tests 5.1 passent.

## 6. Renforts (`reinforcement`)

- [ ] 6.1 Écrire les tests de calcul des renforts : minimum de 3, division par 3 arrondie à l'inférieur, cumul des bonus de continent.
- [ ] 6.2 Écrire les tests de l'action `deploy` : déploiement partiel, refus sur territoire adverse, refus de 0 ou de plus que la réserve, passage automatique en attaque quand la réserve est vide.
- [ ] 6.3 Implémenter `src/engine/reinforcement.ts` et le calcul de la réserve au début de chaque tour ; vérifier que les tests 6.1 et 6.2 passent.

## 7. Combat (`combat`)

- [ ] 7.1 Écrire les tests de la résolution pure d'un lancer avec des dés fixés : 6-5-1 contre 4-4, égalité en faveur du défenseur, une seule paire comparée à 3 contre 1.
- [ ] 7.2 Écrire les tests de l'action `attack` : origine à une armée, cible non adjacente, cible alliée, trop de dés en attaque, défense limitée par les armées, réglage à 3 dés en défense, événement de lancer produit.
- [ ] 7.3 Écrire les tests de la conquête : changement de propriétaire, phase de déplacement avec bornes min et max, refus d'un déplacement insuffisant, refus d'une autre action avant le déplacement, événements lancer puis conquête dans l'ordre.
- [ ] 7.4 Écrire les tests de l'action `blitz` : blitz victorieux suivi du déplacement, blitz épuisé à une armée, un événement par lancer.
- [ ] 7.5 Implémenter `src/engine/combat.ts` (`attack`, `blitz`, `moveAfterConquest`, `endAttack`) ; vérifier que les tests 7.1 à 7.4 passent.

## 8. Fortification (`fortification`)

- [ ] 8.1 Écrire les tests : fortification valide qui termine le tour, refus de vider l'origine, refus vers un territoire adverse, refus d'une destination non adjacente en mode adjacent, chemin connexe accepté, chemin coupé par un adversaire refusé, renoncement qui termine le tour.
- [ ] 8.2 Implémenter `src/engine/fortification.ts` (`fortify`, `skipFortify`, parcours en largeur pour le mode connexe) ; vérifier que les tests 8.1 passent.

## 9. Cartes territoire (`territory-cards`)

- [ ] 9.1 Écrire les tests de validité des séries : trois identiques, trois différents, deux cartes et un joker acceptés ; deux fantassins et un cavalier refusés.
- [ ] 9.2 Écrire les tests des barèmes : progressif (4, 6, 8, 10, 12, 15, puis 20 au septième échange), fixe (4, 6, 8, 10, joker valorisé au mieux).
- [ ] 9.3 Écrire les tests de l'action `tradeCards` : armées ajoutées à la réserve, cartes en défausse, bonus de 2 armées une seule fois sur le premier territoire éligible, échange forcé à 5 cartes qui bloque le passage en attaque, refus hors phase de renforts.
- [ ] 9.4 Écrire les tests de la pioche : une seule carte en fin de tour après plusieurs conquêtes, aucune sans conquête, défausse remélangée quand la pioche est vide.
- [ ] 9.5 Implémenter `src/engine/cards.ts` et brancher la pioche de fin de tour ; vérifier que les tests 9.1 à 9.4 passent.

## 10. Élimination et victoire (`turn-flow`, `territory-cards`)

- [ ] 10.1 Écrire les tests d'élimination : joueur sans territoire marqué éliminé, événement produit, cartes transférées à l'attaquant, joueur éliminé sauté dans l'ordre de jeu.
- [ ] 10.2 Écrire les tests de l'échange forcé après élimination : 3 + 4 cartes déclenchent l'échange jusqu'à 4 cartes ou moins puis le déploiement avant le retour en attaque ; 1 + 2 cartes ne déclenchent rien.
- [ ] 10.3 Écrire les tests de victoire : dernier adversaire éliminé à 3 joueurs, victoire à 2 joueurs malgré le neutre, refus de toute action sur une partie terminée (`GAME_OVER`).
- [ ] 10.4 Implémenter l'élimination, la phase `eliminationTrade` et l'évaluation de victoire dans `src/engine/turn.ts` ; vérifier que les tests 10.1 à 10.3 passent.

## 11. Requêtes et API publique

- [ ] 11.1 Écrire les tests des requêtes en lecture : renforts attendus, cibles attaquables depuis un territoire, destinations de fortification selon le mode, séries échangeables d'une main.
- [ ] 11.2 Implémenter `src/engine/queries.ts` et exporter l'API publique depuis `src/engine/index.ts` avec une JSDoc sur chaque fonction exportée ; vérifier que les tests 11.1 passent.

## 12. Vérification d'ensemble

- [ ] 12.1 Écrire un test de partie complète simulée à 3 joueurs avec une graine fixe et un joueur scripté qui attaque systématiquement, jusqu'à la victoire ; vérifier qu'elle se termine, que le total d'armées reste cohérent à chaque étape et que deux exécutions donnent le même état final.
- [ ] 12.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; tout doit passer sans erreur ni avertissement.
