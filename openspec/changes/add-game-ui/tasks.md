# Tasks

## 1. Dépendances et outillage

- [ ] 1.1 Ajouter à `package.json` `tailwindcss` et `@tailwindcss/vite`, et en dev `@vue/test-utils` et `happy-dom`. **Demander à l'utilisateur de lancer `pnpm install`** et attendre sa confirmation.
- [ ] 1.2 Brancher Tailwind dans `vite.config.ts` et `src/style.css` (variables de thème) ; découper la configuration Vitest en projets `engine` (node) et `ui` (happy-dom) ; vérifier que `pnpm test` exécute les deux projets et que `pnpm build` passe.

## 2. Vitesse d'animation et conseils de cartes (modules purs)

- [ ] 2.1 Écrire les tests de `animationSpeed.ts` : table des durées par vitesse, « instantanée » à 0, préférence lue et écrite dans `localStorage`, valeur par défaut si `localStorage` lève une exception, « instantanée » par défaut avec `prefers-reduced-motion`.
- [ ] 2.2 Implémenter `src/game/animationSpeed.ts` ; vérifier que les tests 2.1 passent.
- [ ] 2.3 Écrire les tests de `cardAdvice.ts` : valeur d'une série selon le barème et le nombre d'échanges déjà faits, bonus de territoire inclus, série la plus avantageuse d'une main, aucune suggestion sans série valide.
- [ ] 2.4 Implémenter `src/game/cardAdvice.ts` en réutilisant les fonctions du moteur ; vérifier que les tests 2.3 passent.

## 3. Présentation des événements

- [ ] 3.1 Écrire les tests de `presentation.ts` : un lancer devient une étape « dés » dont la projection retire les pertes des deux territoires ; une conquête devient une étape de changement de couleur ; un blitz de 4 lancers donne 4 étapes dans l'ordre ; la projection de toutes les étapes d'une action donne les mêmes territoires que l'état réel du moteur.
- [ ] 3.2 Implémenter `src/game/presentation.ts` ; vérifier que les tests 3.1 passent.

## 4. Contrôleur d'interaction

- [ ] 4.1 Écrire les tests de `reduceInteraction` et `viewOf` pour la mise en place manuelle : territoires libres sélectionnables pendant la revendication, territoires du joueur pendant le placement, action moteur émise au toucher.
- [ ] 4.2 Écrire les tests pour les renforts : territoires du joueur sélectionnables, sélecteur borné par la réserve, action `deploy` à la validation, aucun déploiement proposé tant qu'un échange est obligatoire.
- [ ] 4.3 Écrire les tests pour l'attaque : origines légales seules, cibles adverses voisines, panneau avec maximum légal de dés, annulation par l'océan ou l'origine, sélection conservée après une attaque sans conquête, bouton « Terminer les attaques ».
- [ ] 4.4 Écrire les tests pour le déplacement après conquête et la fortification : sélecteur borné et réglé au maximum, destinations selon le mode adjacent ou connexe, bouton « Passer ».
- [ ] 4.5 Implémenter `src/game/interaction.ts` ; vérifier que les tests 4.1 à 4.4 passent.

## 5. Session de jeu

- [ ] 5.1 Écrire les tests de `useGameSession` : `dispatch` met à jour `engineState` immédiatement et `displayedState` à la fin de la file ; entrées ignorées pendant la présentation ; passer l'animation réaligne aussitôt ; message d'erreur exposé quand le moteur rejette une action ; détection du passage de main entre deux humains et pas avec un seul.
- [ ] 5.2 Implémenter `src/game/useGameSession.ts` ; vérifier que les tests 5.1 passent.

## 6. Écrans

- [ ] 6.1 Écrire les tests de composant de `CreateGameScreen` : 3 joueurs par défaut, bornes 2 et 6, échange de couleurs, messages « Nom obligatoire » et doublon, bouton désactivé, mention du neutre à 2 joueurs, réglages par défaut transmis au moteur.
- [ ] 6.2 Implémenter `HomeScreen`, `CreateGameScreen` et la bascule d'écrans dans `App.vue` ; vérifier que les tests 6.1 passent.
- [ ] 6.3 Implémenter `GameScreen` (plateau + HUD, session fournie par `provide`), « Quitter la partie » avec confirmation et `GameOverOverlay` (vainqueur, rejouer, accueil) ; vérifier à la main un aller-retour accueil → partie → accueil et l'affichage de fin en forçant une partie à 2 joueurs presque finie via une graine.

## 7. HUD

- [ ] 7.1 Implémenter `StatusBar` et `PlayersPanel` (joueur, phase en français, réserve, territoires, armées, cartes, éliminés barrés) ; vérifier visuellement pendant une partie.
- [ ] 7.2 Implémenter `AmountPicker` et `AttackPanel` reliés au contrôleur ; vérifier à la main un tour complet renforts → attaque → conquête → fortification.
- [ ] 7.3 Écrire les tests de composant de `CardHand` : symboles et territoires, marque de bonus, bouton « Échanger (+n) » actif seulement sur série valide, suggestion présélectionnée, ouverture forcée avec message.
- [ ] 7.4 Implémenter `CardHand` et l'affichage de la carte piochée ; vérifier que les tests 7.3 passent.
- [ ] 7.5 Implémenter `HandoffScreen` et `Toast` ; vérifier à la main une partie à deux humains (écran de passage, main cachée) et l'affichage d'une erreur moteur.
- [ ] 7.6 Rendre le HUD adaptatif (panneau latéral en paysage, volet bas repliable en portrait, zones tactiles de 44 px minimum) ; vérifier en émulation 390 × 844 et 1920 × 1080.

## 8. Combat

- [ ] 8.1 Implémenter `DiceTray` (cubes CSS 3D, arrêt sur les valeurs de l'événement, tri et alignement par paires, pertes marquées) ; vérifier visuellement un lancer 3 contre 2 et 1 contre 1.
- [ ] 8.2 Brancher le blitz (cadence accélérée, toucher pour passer), la transition de couleur de conquête et l'animation de déplacement des armées ; vérifier à la main un blitz de plusieurs lancers puis le passage d'animation.
- [ ] 8.3 Ajouter le sélecteur de vitesse dans le HUD ; vérifier à la main les quatre vitesses, la mémorisation après rechargement et le texte de résultat en « instantanée ».

## 9. Vérification d'ensemble

- [ ] 9.1 Jouer une partie complète à 3 humains en placement manuel et barème fixe, puis une partie à 2 humains avec neutre en placement aléatoire, jusqu'à la victoire ; noter et corriger tout écart avec les specs.
- [ ] 9.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; tout doit passer.
