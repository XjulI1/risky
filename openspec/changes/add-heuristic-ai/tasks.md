# Tasks

## 1. Moteur et isolement

- [ ] 1.1 Étendre le type de joueur du moteur avec `{ kind: 'ai'; level: 'easy' | 'normal' | 'hard' }` et ajouter un test de création refusant un niveau inconnu ; vérifier que les tests du moteur passent.
- [ ] 1.2 Étendre la règle ESLint d'isolement à `src/ai/**` ; vérifier qu'un import de `vue` ajouté temporairement dans `src/ai/` est signalé.

## 2. Vue joueur et aléa

- [ ] 2.1 Écrire les tests de `playerView` : mains adverses réduites à leur taille, propre main conservée, pioche, défausse et état du générateur absents, sérialisation JSON stable.
- [ ] 2.2 Implémenter `src/ai/playerView.ts` et adapter le typage des requêtes du moteur pour accepter une `PlayerView` ; vérifier que les tests 2.1 passent et que `pnpm type-check` passe.
- [ ] 2.3 Écrire les tests de `aiRandom` : même vue et même niveau → même suite de tirages ; vue différente → suite différente.
- [ ] 2.4 Implémenter `src/ai/aiRandom.ts` (hachage FNV-1a + générateur du moteur) ; vérifier que les tests 2.3 passent.

## 3. Probabilités de combat

- [ ] 3.1 Écrire les tests de `combatOdds` : distribution 3 contre 2 (2890, 2611, 2275 sur 7776), conquête 2 contre 1 à 15/36, probabilités croissantes avec les armées attaquantes, prise en compte d'un réglage à 3 dés en défense.
- [ ] 3.2 Implémenter `src/ai/combatOdds.ts` (énumération des lancers, programmation dynamique, mémorisation par réglages) ; vérifier que les tests 3.1 passent.

## 4. Évaluation

- [ ] 4.1 Écrire les tests de `evaluation.ts` : territoires frontaliers et intérieurs, score de continent favorisant un continent presque complet, menace sur une frontière croissante avec les armées adverses voisines.
- [ ] 4.2 Implémenter `src/ai/evaluation.ts` ; vérifier que les tests 4.1 passent.

## 5. Niveaux

- [ ] 5.1 Écrire les tests du niveau facile : renforts uniquement sur des frontières, pas d'attaque à 5 contre 3, arrêt après 3 conquêtes, échange seulement quand il est obligatoire.
- [ ] 5.2 Implémenter `src/ai/levels/easy.ts` (toutes les phases, revendication et placement initial compris) ; vérifier que les tests 5.1 passent.
- [ ] 5.3 Écrire les tests du niveau normal : renforts et attaque vers le dernier territoire d'Océanie, aucun renfort intérieur, attaque à partir de 0,6, échange dès que possible, fortification de 5 armées depuis un intérieur de 6.
- [ ] 5.4 Implémenter `src/ai/levels/normal.ts` ; vérifier que les tests 5.3 passent.
- [ ] 5.5 Écrire les tests du niveau difficile : attaque d'une Amérique du Sud adverse complète, priorité à l'élimination d'un adversaire à un territoire détenant des cartes, conservation des cartes en barème progressif sans attaque prioritaire, renforts proportionnels à la menace.
- [ ] 5.6 Implémenter `src/ai/levels/hard.ts` ; vérifier que les tests 5.5 passent.

## 6. Décision et boucle automatique

- [ ] 6.1 Écrire les tests de `chooseAction` : même action pour des mains adverses ou des pioches différentes, même action pour la même vue, plafond de 60 attaques par tour respecté.
- [ ] 6.2 Implémenter `chooseAction` et `playUntilHumanOrEnd` dans `src/ai/index.ts` ; vérifier que les tests 6.1 passent.
- [ ] 6.3 Écrire le test de robustesse : 100 parties entre IA, 2 à 6 joueurs, niveaux, graines et réglages variés, aucune action rejetée, toutes terminées en moins de 500 tours, deux exécutions d'une même graine identiques ; mesurer le temps maximal d'une décision (moins de 50 ms).
- [ ] 6.4 Corriger les heuristiques jusqu'à ce que le test 6.3 passe.

## 7. Tournoi

- [ ] 7.1 Écrire `src/ai/tournament.test.ts` : 60 parties à trois joueurs facile / normal / difficile sur graines fixées, six ordres de jeu à parts égales ; victoires strictement croissantes par niveau et au moins 45 % pour le difficile.
- [ ] 7.2 Ajuster les constantes des niveaux jusqu'à ce que le tournoi passe ; si sa durée dépasse 20 s, le déplacer dans un script `pnpm test:ai`.

## 8. Intégration dans l'application

- [ ] 8.1 Écrire les tests de composant du formulaire de création : choix Humain / IA et niveau par joueur, joueur 1 humain et autres IA normales par défaut, partie sans humain autorisée.
- [ ] 8.2 Mettre à jour `CreateGameScreen` ; vérifier que les tests 8.1 passent.
- [ ] 8.3 Écrire les tests de `useGameSession` pour les tours IA : actions soumises automatiquement, délai selon la vitesse, aucun délai en « instantanée », arrêt au tour d'un humain, annulation en quittant la partie.
- [ ] 8.4 Brancher la boucle IA dans `useGameSession`, la mise en avant origine/cible avant chaque attaque et le message « <nom> réfléchit… » sans commandes dans le HUD ; vérifier que les tests 8.3 passent.
- [ ] 8.5 Jouer à la main une partie humain contre deux IA normales, puis regarder une partie entre trois IA difficiles en vitesse rapide ; vérifier lisibilité et absence de blocage.

## 9. Vérification d'ensemble

- [ ] 9.1 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` (et `pnpm test:ai` s'il existe) et `pnpm build` ; tout doit passer.
