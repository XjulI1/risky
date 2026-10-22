# Tasks

## 1. Numéro de tour et journal

- [ ] 1.1 Écrire les tests de `turnCounter` : incrément à chaque début de tour, aucun incrément pendant la mise en place.
- [ ] 1.2 Implémenter `src/game/history/turnCounter.ts` ; vérifier que les tests 1.1 passent.
- [ ] 1.3 Écrire les tests de `journal.ts` : une formulation par type d'événement du tableau de la spec, accord singulier et pluriel, en-tête de tour, attaque regroupée en une entrée dépliable avec nombre de lancers et pertes totales, détail de chaque lancer, carte piochée sans détail.
- [ ] 1.4 Implémenter `src/game/history/journal.ts` ; vérifier que les tests 1.3 passent.

## 2. Statistiques

- [ ] 2.1 Écrire les tests de `statistics.ts` : relevé de territoires et d'armées au début de chaque tour, neutre sans relevé, compteurs après un lancer (armées perdues et détruites, meilleur dé), conquêtes, échanges et armées obtenues, tour d'élimination.
- [ ] 2.2 Implémenter `src/game/history/statistics.ts` ; vérifier que les tests 2.1 passent.

## 3. Persistance

- [ ] 3.1 Écrire les tests de `persistence.ts` : aller-retour écriture/lecture identique, JSON invalide → illisible et supprimé, version inconnue → illisible, champs manquants → illisible, exception d'écriture (quota) signalée sans propagation, exception d'accès au stockage traitée comme « indisponible ».
- [ ] 3.2 Implémenter `src/game/persistence.ts` (clé `risk.savedGame`, gardes de type, `formatVersion: 1`) ; vérifier que les tests 3.1 passent.

## 4. Session de jeu

- [ ] 4.1 Écrire les tests de `useGameSession` : journal et statistiques mis à jour à chaque action, entrées visibles seulement après leur étape de présentation, index avancé au bout quand on passe l'animation, sauvegarde écrite après chaque action humaine et IA, avertissement de stockage affiché une seule fois, restauration d'une sauvegarde sans animation avec reprise du tour d'une IA.
- [ ] 4.2 Brancher journal, statistiques, numéro de tour et sauvegarde dans `useGameSession`, et ajouter la création d'une session depuis une sauvegarde ; vérifier que les tests 4.1 passent.

## 5. Écrans

- [ ] 5.1 Écrire les tests de composant de `HomeScreen` : « Reprendre la partie » avec résumé si une partie en cours est sauvegardée, « Voir la dernière partie » si elle est terminée, rien sinon, message d'erreur affiché une fois après une sauvegarde illisible.
- [ ] 5.2 Mettre à jour `HomeScreen`, la confirmation de remplacement avant une nouvelle partie, et « Quitter la partie » qui conserve la sauvegarde sans confirmation ; vérifier que les tests 5.1 passent puis vérifier à la main un rechargement en pleine partie, pendant un déplacement après conquête et pendant le tour d'une IA.
- [ ] 5.3 Supprimer la sauvegarde en quittant l'écran de fin et la marquer terminée à la victoire ; vérifier à la main le rechargement sur l'écran de fin puis le retour à l'accueil.

## 6. Journal dans le HUD

- [ ] 6.1 Implémenter `JournalPanel` (repliable, groupé par tour, couleurs des joueurs, attaques dépliables, défilement automatique sauf lecture en cours, indicateur « Nouvelles actions », 200 dernières entrées puis chargement en remontant) ; vérifier à la main pendant une partie contre deux IA, en 1024 × 768 et en 1920 × 1080.

## 7. Statistiques de fin

- [ ] 7.1 Écrire les tests des fonctions de graphique : bornes des axes, graduations entières, coordonnées des points, ordre de la légende.
- [ ] 7.2 Implémenter `LineChart` et `StatisticsTab` (deux courbes, tableau ordonné vainqueur puis éliminations inverses) dans l'écran de fin ; vérifier que les tests 7.1 passent et vérifier à la main en 1024 × 768 qu'il n'y a aucun défilement horizontal.

## 8. Vérification d'ensemble

- [ ] 8.1 Jouer une partie complète contre deux IA en la rechargeant plusieurs fois, dont une fois en navigation privée avec stockage bloqué ; vérifier la reprise exacte, le journal et les statistiques finales.
- [ ] 8.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; tout doit passer.
