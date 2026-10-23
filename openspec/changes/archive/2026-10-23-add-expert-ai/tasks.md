# Tasks

Le prototype de la branche `feat/monte-carlo-ai-prototype` (`src/ai/expert/`, `applyActionInPlace`,
export de `buildDeck`) sert de point de départ : les tâches le reprennent en le mettant aux exigences
des specs et du design.

## 1. Moteur

- [x] 1.1 Écrire les tests d'`applyActionInPlace` : même état et mêmes événements qu'`applyAction`, état donné modifié et renvoyé, vérifications du tour et de la phase identiques ; vérifier qu'ils échouent sans l'implémentation.
- [x] 1.2 Implémenter `applyActionInPlace` en partageant le code d'`applyAction`, et exporter `buildDeck` depuis `src/engine/index.ts` ; vérifier que les tests 1.1 et toute la suite du moteur passent.
- [x] 1.3 Écrire un test de création de partie acceptant une IA de niveau `expert` ; étendre `AiLevel` et `AI_LEVELS` du moteur avec `expert`, ajouter `HeuristicLevel = Exclude<AiLevel, 'expert'>` ; vérifier que le test passe et que le test refusant un niveau inconnu passe toujours.

## 2. Réorganisation de l'IA heuristique

- [x] 2.1 Déplacer `chooseAction` (renommé `chooseHeuristicAction`, typé `HeuristicLevel`), `NEW_TURN`, `MAX_ATTACKS_PER_TURN` et `progressAfter` de `src/ai/index.ts` vers `src/ai/heuristic.ts`, `index.ts` les réexportant ; vérifier que `pnpm type-check` passe et que les tests de `src/ai/` passent sans modification, tournoi de référence et test de robustesse compris.

## 3. Niveau expert

- [x] 3.1 Écrire les tests de `determinize` : vue du monde tiré identique à la vue d'origine, chaque carte distribuée une seule fois (44 au total), main de l'Expert conservée, tailles des mains adverses respectées, territoires non partagés avec la vue ; implémenter `src/ai/expert/determinization.ts` et vérifier que les tests passent.
- [x] 3.2 Écrire les tests de `positionValue` (scénario « Victoire simulée » : 1 pour le vainqueur, 0 pour les autres ; 0 pour un éliminé ; somme de 1 entre les joueurs en jeu, neutre exclu ; valeur croissante avec les armées) ; implémenter `src/ai/expert/positionValue.ts` et vérifier que les tests passent.
- [x] 3.3 Écrire un test de `rollout` : la simulation s'arrête au début du tour suivant de l'Expert ou à la fin de la partie, et renvoie une valeur entre 0 et 1 ; implémenter `src/ai/expert/rollout.ts` sur `chooseHeuristicAction` et `applyActionInPlace`, avec un plafond de 1500 actions, et vérifier que le test passe.
- [x] 3.4 Écrire les tests des candidats : scénarios « Fin d'attaque envisagée » et « Attaque peu probable écartée », choix du difficile en premier et sans doublon, au plus 6 candidats, un seul candidat (celui du difficile) pour la fortification, le déplacement après conquête et l'échange, plafond de 60 attaques respecté ; implémenter `expertCandidates` et vérifier que les tests passent.
- [x] 3.5 Écrire les tests d'`expertAction` sur des situations de milieu de partie : actions légales, même action pour la même vue, même action quand seuls les mains adverses, la pioche et l'état du générateur diffèrent (scénario « Cartes adverses inconnues »), choix du difficile quand il est seul candidat ; implémenter `expertAction` avec `aiRandom(view, 'expert')`, des mondes communs à tous les candidats et le choix du difficile en cas d'égalité, puis vérifier que les tests passent.
- [x] 3.6 Écrire les tests de `chooseAction` pour le niveau expert : en mode classique, même action qu'`expertAction` ; avec missions secrètes ou capitales, même action que le difficile (scénario « Partie avec missions ») ; brancher l'expert dans `src/ai/index.ts` sans import de `index.ts` depuis `expert/` et vérifier que les tests passent.

## 4. Tournoi expert

- [x] 4.1 Écrire `src/ai/expert/expertTournament.test.ts` : 60 parties à trois joueurs, l'Expert à la place `partie % 3` contre deux difficiles, graines fixes ; vérifier au moins 30 victoires, aucune action refusée, toutes les parties terminées, temps moyen sous 250 ms, 95e centile sous 500 ms et maximum sous 1,5 s. Exécuter le fichier seulement si `EXPERT_TOURNAMENT` est définie, et ajouter le script `test:expert` à `package.json`. Vérifier que `pnpm test` le saute.
- [x] 4.2 Lancer `pnpm test:expert` sans autre calcul en parallèle ; ajuster le nombre de mondes ou le plafond d'actions jusqu'à ce qu'il passe, puis noter dans le message de commit le taux de victoire et les temps obtenus.

## 5. Décisions hors du fil principal

- [x] 5.1 Écrire `src/ai/worker.ts` : il reçoit `{ id, view, level, turn }`, répond `{ id, action }` ou `{ id, error }` ; vérifier que `pnpm lint` et `pnpm type-check` passent.
- [x] 5.2 Écrire les tests des deciders dans `src/game/aiDecider.test.ts` : le decider inline renvoie l'action de `chooseAction` ; le decider worker, branché sur un faux `Worker`, associe chaque réponse à sa requête même dans le désordre, rejette les requêtes en attente et termine le worker à `dispose`. Implémenter `src/game/aiDecider.ts` (`createWorkerDecider`, `createInlineDecider`, choix par défaut selon la présence de `Worker`) et vérifier que les tests passent.
- [x] 5.3 Écrire les tests de rythme de `useGameSession` avec un faux decider à durée réglable et des minuteurs simulés : décision de 300 ms en vitesse normale jouée à la fin de l'espacement ; déploiement décidé en 1 s en vitesse rapide joué dès la décision ; attaque décidée en 1 s en vitesse normale mise en avant dès la décision, puis jouée la moitié de l'espacement plus tard ; vitesse instantanée sans autre pause que le calcul. Vérifier qu'ils échouent avant l'étape 5.4.
- [x] 5.4 Rendre `scheduleAiAction` asynchrone avec le decider injecté (option de `createGameSession`, decider par défaut sinon), le numéro de passage et la mise en avant après la décision ; adapter les tests existants de la session au decider inline ; vérifier que les tests 5.3 et toute la suite `ui` passent.
- [x] 5.5 Écrire les tests de l'indicateur et de l'abandon : `aiThinking` vrai 0,5 s après le début d'une décision de 2 s puis faux à l'action jouée, jamais vrai pour une décision de 100 ms ; quitter pendant la réflexion n'applique aucune action et laisse la sauvegarde inchangée. Exposer `aiThinking` dans la session et libérer le decider à la fermeture ; vérifier que les tests passent.

## 6. Interface

- [x] 6.1 Écrire le test de `StatusBar` : points animés après « <nom> réfléchit… » quand `aiThinking` est vrai, absents sinon ; implémenter l'indicateur (points fixes sous `prefers-reduced-motion`) et vérifier que le test passe.
- [x] 6.2 Écrire les tests de `gameForm.ts` : `AI_LEVELS` reprend la liste du moteur avec l'étiquette « Expert » ; `isLevelAvailable` refuse l'expert avec missions ou capitales ; `levelForSettings` ramène l'expert au difficile avec une variante et laisse les autres niveaux inchangés. Implémenter ces fonctions et vérifier que les tests passent.
- [x] 6.3 Écrire les tests de `CreateGameScreen` : quatre niveaux dans l'ordre (scénario « Quatre niveaux proposés ») ; expert puis missions activées → toutes les IA difficiles, bouton Expert désactivé avec « Mode classique uniquement » ; capitales désactivées → Expert de nouveau disponible, niveau inchangé. Adapter l'écran et vérifier que les tests passent.

## 7. Documentation et intégration

- [x] 7.1 Mettre à jour `docs/ia.md` (section sur le niveau Expert : décisions cherchées, simulation d'un tour de table, mode classique uniquement), `README.md` (quatre niveaux, ligne du change dans le tableau) et `TODO.md` (retirer « IA par simulation (Monte-Carlo) » des pistes, ajouter l'étape du change) ; vérifier que les commandes citées existent dans `package.json`.
- [x] 7.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; vérifier que tout passe et que le fichier JS du worker figure dans le manifeste de précache de `dist/sw.js`.
- [ ] 7.3 Vérification manuelle sur ordinateur : une partie Expert en vitesse normale, plateau déplaçable et zoomable pendant une réflexion, indicateur visible sur les décisions longues, Expert grisé dès qu'une variante est cochée.
- [ ] 7.4 Vérification manuelle sur iPad en paysage, application installée : une partie Expert complète, la plupart des décisions sous la seconde et des pics rares de 2 à 3 s au plus, puis une partie Expert hors ligne. Si les décisions dépassent régulièrement 1 s, passer à 16 mondes et relancer `pnpm test:expert`.
