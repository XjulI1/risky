# Tasks

## 1. Réglage et choix secret (moteur)

- [x] 1.1 Écrire les tests de création : réglage désactivé par défaut, refus conjoint avec les missions secrètes, phase `capitalChoice` à la fin du placement (après une répartition aléatoire comme au choix), aucune phase de choix sans le réglage.
- [x] 1.2 Écrire les tests de l'action `chooseCapital` : choix valide et passage au joueur suivant, refus d'un territoire adverse, refus hors phase, neutre sans capitale à 2 joueurs, événement `capitalChosen` sans territoire, `capitals` vide avant le dernier choix, révélation de toutes les capitales et passage en renforts du premier joueur après le dernier choix.
- [x] 1.3 Implémenter `settings.capitals`, la phase `capitalChoice` avec `pending`, le champ `capitals`, la fonction unique de fin de mise en place et l'action `chooseCapital` ; vérifier que les tests 1.1, 1.2 et les tests existants du moteur passent.

## 2. Bonus de défense (moteur)

- [x] 2.1 Écrire les tests de la résolution d'un lancer avec bonus : 6-2 contre 5-1 sur une capitale donne une perte de chaque côté, bonus appliqué au seul dé le plus haut, aucun bonus sur un territoire ordinaire, bonus pour le détenteur actuel d'une capitale prise, événement de lancer portant les valeurs tirées et le bonus.
- [x] 2.2 Ajouter `defenderBonus` à la résolution d'un lancer et le brancher dans l'attaque ; vérifier que les tests 2.1 et tous les tests de combat existants passent.

## 3. Capitales prises et victoire (moteur)

- [x] 3.1 Écrire les tests : événement `capitalCaptured` après la conquête d'une capitale, pas d'élimination à la perte de sa capitale, reconquête de sa capitale, victoire en prenant la dernière capitale avec déplacement minimal automatique, pas de victoire sans sa propre capitale, victoire à 2 joueurs avec neutre, `winReason: 'capitals'`, domination toujours victorieuse.
- [x] 3.2 Implémenter l'événement de prise et la condition de victoire par les capitales ; vérifier que les tests 3.1 passent.

## 4. IA

- [x] 4.1 Écrire les tests de `PlayerView` et de `combatOdds` : seul son propre choix en attente est visible, conquête d'une capitale à 2 contre 1 à 10/36, table distincte selon le bonus.
- [x] 4.2 Adapter `PlayerView` et indexer `combatOdds` par bonus de défense ; vérifier que les tests 4.1 passent.
- [x] 4.3 Écrire les tests de choix de capitale : facile sur le territoire le plus garni, normal et difficile sur un territoire intérieur, même choix quelles que soient les capitales déjà choisies par les autres.
- [x] 4.4 Écrire les tests de stratégie : 5 armées de réserve toutes sur une capitale de 3 menacée par 6, reconquête prioritaire à 0,6, attaque d'une capitale adverse à partir de 0,5 (probabilité bonifiée), mode « dernière capitale » de l'IA difficile vers un territoire voisin ou le plus proche.
- [x] 4.5 Implémenter la phase `capitalChoice` et les primes de capitale dans les niveaux ; vérifier que les tests 4.3 et 4.4 passent.
- [x] 4.6 Ajouter le mode capitales au test de robustesse et au tournoi (60 parties, ordres équilibrés) ; ajuster les primes jusqu'à des victoires strictement croissantes par niveau, et vérifier que les parties restent sous le plafond de 500 tours.

## 5. Plateau

- [x] 5.1 Écrire le test du décalage du marqueur : pour chacun des 42 territoires, marqueur et pion restent à l'intérieur de la forme et ne se chevauchent pas.
- [x] 5.2 Implémenter le calcul du décalage et `CapitalMarker.vue` (tour low-poly aux couleurs du joueur d'origine), branché sur le prop `capitals` de `GameBoard` ; vérifier que le test 5.1 passe et vérifier visuellement une capitale prise (territoire rouge, marqueur bleu) au zoom minimal et maximal.

## 6. Interface

- [x] 6.1 Écrire les tests du formulaire : « Mode capitales » décochée par défaut, disponible à 2 joueurs, exclusivité avec « Missions secrètes » et mention affichée.
- [x] 6.2 Mettre à jour `CreateGameScreen` ; vérifier que les tests 6.1 passent.
- [x] 6.3 Écrire les tests du contrôleur d'interaction pour `capitalChoice` : territoires du joueur sélectionnables, confirmation qui émet `chooseCapital`, annulation sans action, aucune capitale d'un autre joueur affichée avant la révélation, passage de main entre deux humains.
- [x] 6.4 Implémenter le parcours de choix, la confirmation, le libellé de phase et l'annonce de révélation ; vérifier que les tests 6.3 passent.
- [x] 6.5 Écrire les tests du journal, des dés et du HUD : aucune entrée avant la révélation, entrée unique de révélation, formulation de prise, détail « 5+1 », badge « +1 » sur le dé bonifié, décompte « Capitales : n/total », alerte de perte pour un humain seulement, motif de victoire.
- [x] 6.6 Mettre à jour `journal.ts`, `DiceTray`, `PlayersPanel`, l'alerte et l'écran de fin ; vérifier que les tests 6.5 passent.

## 7. Sauvegarde

- [x] 7.1 Passer `formatVersion` à 3 et ajouter un test : une sauvegarde de version 2 est rejetée proprement ; une partie en mode capitales sauvegardée pendant la phase de choix puis reprise reprend au bon joueur sans révéler les choix déjà faits.

## 8. Vérification d'ensemble

- [x] 8.1 Jouer une partie en mode capitales contre deux IA difficiles et une partie à 2 humains avec neutre ; vérifier le choix secret, la révélation, le marqueur, le bonus affiché, l'alerte de perte et la fin de partie.
- [x] 8.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` (et `pnpm test:ai` s'il existe) et `pnpm build` ; tout doit passer.
