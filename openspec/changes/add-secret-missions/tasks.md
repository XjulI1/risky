# Tasks

## 1. Modèle des missions (moteur)

- [ ] 1.1 Écrire les tests de `missions.ts` : 8 missions générales, texte français de chaque mission, `missionProgress` pour chaque type (continents avec et sans continent au choix, 24 territoires, 18 à 2 armées, élimination).
- [ ] 1.2 Implémenter `src/engine/missions.ts` (type `Mission`, constantes, formatage, `missionProgress`) ; vérifier que les tests 1.1 passent.

## 2. Création et attribution (moteur)

- [ ] 2.1 Écrire les tests de création : réglage désactivé par défaut, refus à 2 joueurs, paquet de 12 missions à 4 joueurs, une mission par joueur sans carte tirée deux fois, attribution déterministe, propre élimination remplacée par 24 territoires.
- [ ] 2.2 Ajouter `settings.secretMissions`, le champ `missions` de l'état et l'attribution dans `createGame` ; vérifier que les tests 2.1 et les tests existants du moteur passent.

## 3. Conversion et victoire (moteur)

- [ ] 3.1 Écrire les tests de conversion : cible éliminée par un tiers → 24 territoires et événement `missionConverted` pour le seul détenteur ; cible éliminée par le détenteur → victoire.
- [ ] 3.2 Écrire les tests de victoire par mission : conquête du dernier territoire d'Océanie avec déplacement minimal automatique, continent au choix manquant, 18 territoires à 2 armées atteints par un déploiement, mission d'un autre joueur non vérifiée hors de son tour, domination toujours victorieuse, `winReason` renseigné.
- [ ] 3.3 Implémenter la conversion dans la gestion de l'élimination et étendre la fonction de victoire (appel après chaque action, déplacement minimal automatique en `conquestMove`) ; vérifier que les tests 3.1 et 3.2 passent.

## 4. Information visible et IA

- [ ] 4.1 Écrire les tests de `PlayerView` : `ownMission` présent, aucune mission adverse ; l'IA facile choisit la même action quelle que soit sa mission.
- [ ] 4.2 Ajouter `ownMission` à `PlayerView` ; vérifier que les tests 4.1 passent.
- [ ] 4.3 Écrire les tests des IA normale et difficile : renforts sur une frontière d'Asie ou d'Afrique pour la mission « Asie et Afrique », 2 armées laissées de part et d'autre pour « 18 à 2 armées », territoire de la cible attaqué à 0,7 plutôt qu'un autre à 0,9.
- [ ] 4.4 Implémenter l'objectif dérivé de la mission dans `normal.ts` et `hard.ts` ; vérifier que les tests 4.3 passent.
- [ ] 4.5 Ajouter au tournoi le cas avec missions (60 parties, ordres équilibrés) et ajuster les primes jusqu'à obtenir des victoires strictement croissantes par niveau ; vérifier aussi que le test de robustesse passe avec missions activées.

## 5. Interface

- [ ] 5.1 Écrire les tests de composant de la création : option décochée par défaut, désactivée avec « 3 joueurs minimum » à 2 joueurs, décochée automatiquement en passant à 2 joueurs.
- [ ] 5.2 Ajouter l'option dans `CreateGameScreen` ; vérifier que les tests 5.1 passent.
- [ ] 5.3 Écrire les tests de composant de `MissionPanel` : texte et progression pour chaque type de mission, bouton masqué pendant le tour d'une IA quand il y a plusieurs humains, visible avec un seul humain.
- [ ] 5.4 Implémenter `MissionPanel` et le bouton « Ma mission » dans le HUD ; vérifier que les tests 5.3 passent.
- [ ] 5.5 Afficher le message privé de conversion au début du tour suivant du joueur concerné (après l'écran de passage de main) ; vérifier à la main en forçant la situation via une graine ou un état de test.
- [ ] 5.6 Écrire les tests de `journal.ts` : entrée « accomplit sa mission », aucune entrée de conversion.
- [ ] 5.7 Mettre à jour `journal.ts` et l'écran de fin (motif de victoire, révélation de toutes les missions) ; vérifier que les tests 5.6 passent et vérifier l'écran de fin à la main.

## 6. Sauvegarde

- [ ] 6.1 Passer `formatVersion` à 2 et ajouter un test : une sauvegarde de version 1 est rejetée avec le message « La sauvegarde précédente n'a pas pu être chargée » ; une partie avec missions sauvegardée puis reprise conserve les missions.

## 7. Vérification d'ensemble

- [ ] 7.1 Jouer une partie avec missions contre deux IA difficiles et une partie à deux humains et une IA ; vérifier qu'aucune mission adverse n'est visible et que l'écran de fin révèle tout.
- [ ] 7.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` (et `pnpm test:ai` s'il existe) et `pnpm build` ; tout doit passer.
