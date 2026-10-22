# Tasks

## 1. Réglage et phase de choix (moteur)

- [ ] 1.1 Écrire les tests de création : réglage désactivé par défaut, refus conjoint avec les missions secrètes, phase `capitalChoice` après un placement aléatoire et après un placement manuel, aucune phase de choix sans le réglage.
- [ ] 1.2 Écrire les tests de l'action `chooseCapital` : choix valide et passage au joueur suivant, refus d'un territoire adverse, refus hors phase, neutre sans capitale à 2 joueurs, passage en renforts du premier joueur après le dernier choix, événement `capitalChosen`.
- [ ] 1.3 Implémenter `settings.capitals`, le champ `capitals`, la phase `capitalChoice`, la fonction unique de fin de mise en place et l'action `chooseCapital` ; vérifier que les tests 1.1, 1.2 et les tests existants du moteur passent.

## 2. Capitales prises et victoire (moteur)

- [ ] 2.1 Écrire les tests : événement `capitalCaptured` après la conquête d'une capitale, pas d'élimination à la perte de sa capitale, reconquête de sa capitale, victoire en prenant la dernière capitale avec déplacement minimal automatique, pas de victoire sans sa propre capitale, victoire à 2 joueurs avec neutre, `winReason: 'capitals'`, domination toujours victorieuse.
- [ ] 2.2 Implémenter l'événement de prise et la condition de victoire par les capitales ; vérifier que les tests 2.1 passent.

## 3. IA

- [ ] 3.1 Écrire les tests de choix de capitale : facile sur le territoire le plus garni, normal et difficile sur un territoire intérieur.
- [ ] 3.2 Écrire les tests de stratégie : 5 armées de réserve toutes sur une capitale de 3 menacée par 6, reconquête prioritaire à 0,6, attaque d'une capitale adverse à partir de 0,5, mode « dernière capitale » de l'IA difficile vers un territoire voisin ou le plus proche.
- [ ] 3.3 Implémenter la phase `capitalChoice` et les primes de capitale dans les niveaux ; vérifier que les tests 3.1 et 3.2 passent.
- [ ] 3.4 Ajouter le mode capitales au test de robustesse et au tournoi (60 parties, ordres équilibrés) ; ajuster les primes jusqu'à des victoires strictement croissantes par niveau.

## 4. Plateau

- [ ] 4.1 Écrire le test du décalage du marqueur : pour chacun des 42 territoires, marqueur et pion restent à l'intérieur de la forme et ne se chevauchent pas.
- [ ] 4.2 Implémenter le calcul du décalage et `CapitalMarker.vue` (tour low-poly aux couleurs du joueur d'origine), branché sur le prop `capitals` de `GameBoard` ; vérifier que le test 4.1 passe et vérifier visuellement une capitale prise (territoire rouge, marqueur bleu) au zoom minimal et maximal.

## 5. Interface

- [ ] 5.1 Écrire les tests du formulaire : « Mode capitales » décochée par défaut, disponible à 2 joueurs, exclusivité avec « Missions secrètes » et mention affichée.
- [ ] 5.2 Mettre à jour `CreateGameScreen` ; vérifier que les tests 5.1 passent.
- [ ] 5.3 Écrire les tests du contrôleur d'interaction pour `capitalChoice` : territoires du joueur sélectionnables, confirmation qui émet `chooseCapital`, annulation sans action.
- [ ] 5.4 Implémenter le parcours de choix, la confirmation et le libellé de phase dans le HUD ; vérifier que les tests 5.3 passent.
- [ ] 5.5 Écrire les tests du journal et du HUD : formulations de choix et de prise, décompte « Capitales : n/total », alerte de perte pour un humain seulement, motif de victoire.
- [ ] 5.6 Mettre à jour `journal.ts`, `PlayersPanel`, l'alerte et l'écran de fin ; vérifier que les tests 5.5 passent.

## 6. Sauvegarde

- [ ] 6.1 Passer `formatVersion` à 3 et ajouter un test : une sauvegarde de version 2 est rejetée proprement ; une partie en mode capitales sauvegardée pendant la phase de choix puis reprise reprend au bon joueur.

## 7. Vérification d'ensemble

- [ ] 7.1 Jouer une partie en mode capitales contre deux IA difficiles et une partie à 2 joueurs avec neutre ; vérifier le choix guidé, le marqueur, l'alerte de perte et la fin de partie.
- [ ] 7.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` (et `pnpm test:ai` s'il existe) et `pnpm build` ; tout doit passer.
