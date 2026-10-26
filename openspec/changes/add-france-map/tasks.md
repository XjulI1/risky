# Tasks

## 1. Outillage

- [ ] 1.1 Vérifier que `support-multiple-maps` est archivé ; demander à l'utilisateur de lancer `pnpm add -D mapshaper` et attendre sa confirmation ; vérifier que `mapshaper` figure dans les `devDependencies`.
- [ ] 1.2 Ajouter un projet `scripts` à `vitest.config.ts`, `scripts/**/*.ts` à `tsconfig.json`, le script `build:map:france` et `test:balance:france` à `package.json` ; vérifier que `pnpm type-check` et `pnpm test` passent.
- [ ] 1.3 Télécharger `departements-version-simplifiee.geojson` (commit `5d34ee6` de `gregoiredavid/france-geojson`) dans `data/maps/france/source/` et écrire `grouping.json` d'après la spec ; vérifier que le fichier source compte 96 départements.

## 2. Fonctions du script (TDD)

- [ ] 2.1 Écrire les tests de validation du regroupement : un regroupement complet passe, un département manquant, en double ou inconnu est signalé par son code, une région vide est signalée.
- [ ] 2.2 Écrire les tests des adjacences depuis une topologie de test : arcs partagés de 3 km donnent deux voisins, un contact de 200 m n'en donne pas, la somme de plusieurs arcs courts est prise en compte, les liaisons maritimes ajoutées sont symétriques.
- [ ] 2.3 Écrire les tests de conversion en chemin SVG : mise à l'échelle sur 1000 unités, axe Y inversé, un sous-chemin fermé par anneau, arrondi au dixième, erreur explicite sur un anneau intérieur (trou) ; le chemin produit est relu par `parsePathData` du plateau.
- [ ] 2.4 Écrire les tests du point d'étiquette et des points les plus proches entre deux contours sur des polygones simples.
- [ ] 2.5 Implémenter les fonctions de `scripts/map-builder/` ; vérifier que les tests 2.1 à 2.4 passent.

## 3. Production des données

- [ ] 3.1 Écrire `scripts/build-france-map.ts` (lecture, rattachement, projection Lambert-93, fusion, adjacences, simplification, suppression des îles de moins de 40 km², conversion, contours de région, liaisons maritimes) ; lancer `pnpm build:map:france` et vérifier que les quatre fichiers sont produits dans `data/maps/france/`, que `territories.json` fait moins de 250 Ko et qu'aucun territoire n'a de trou.
- [ ] 3.2 Relire les 10 frontières partagées les plus courtes affichées par le script et ajuster le seuil si une adjacence est contestable ; vérifier que les paires adjacentes et non adjacentes de la spec `world-map` sont respectées dans `board.json`.
- [ ] 3.3 Écrire `data/maps/france/SOURCE.md` (source IGN, millésime, dépôt intermédiaire et commit, licence, commande de régénération, vérifications faites) sur le modèle de celui de la carte classique.

## 4. Moteur

- [ ] 4.1 Écrire les tests de la carte de France : 42 territoires et 7 régions, invariants respectés, tailles, noms avec article et bonus des régions conformes à la spec, 96 départements couverts une fois (via `grouping.json`), adjacences et non-adjacences de la spec, Corse reliée seulement à Côte d'Azur et Provence, `continentTerm` « région » au féminin.
- [ ] 4.2 Écrire les tests des missions : paquet de 12 missions à 4 joueurs sur la France, textes des six missions de régions, « une troisième région au choix », et une partie complète du moteur avec missions et une avec capitales sur la France menées jusqu'à la victoire.
- [ ] 4.3 Ajouter `'france'` à `MapId`, écrire `src/engine/maps/france.ts` en n'important que `board.json` et l'ajouter au catalogue ; vérifier que les tests 4.1 et 4.2 passent et que le worker de l'IA produit par `pnpm build` n'a pas grossi de plus de quelques Ko.

## 5. Plateau

- [ ] 5.1 Placer à la main les étiquettes de région dans `continent-labels.json` ; écrire les tests : une étiquette par région, étiquettes de l'Ouest, du Nord, du Sud-Ouest, du Sud-Est et de l'Est hors de tout territoire, aucune étiquette à moins de la distance de sécurité d'un pion, un contour par région dans `region-outlines.json`.
- [ ] 5.2 Vérifier que les tests de géométrie paramétrés par carte passent sur la France (une forme par territoire, pion à l'intérieur de chaque territoire, marqueur de capitale et pion à l'intérieur sans se chevaucher, y compris pour Paris) ; si Paris échoue, revoir le regroupement de l'Île-de-France avec l'utilisateur avant de continuer.
- [ ] 5.3 Ajouter l'entrée `france` au catalogue de rendu et `regionOutlines` à `BoardMap` ; tracer les limites de région avec `Line2`/`LineMaterial` ; vérifier que les tests du plateau passent, puis vérifier visuellement avec `pnpm dev` sur une fenêtre 1024 × 768 et 1920 × 1080 : France entière cadrée, limites de région lisibles au zoom minimal, Corse et ses deux liaisons, étiquettes sans masquer de pion, plateau classique inchangé.

## 6. Interface

- [ ] 6.1 Écrire les tests du formulaire : « Monde » sélectionné par défaut, choix « France » transmis à la création, missions secrètes, mode capitales et niveau expert disponibles avec « France », relance depuis l'écran de fin sur la même carte.
- [ ] 6.2 Ajouter le choix de carte à `CreateGameScreen` ; vérifier que les tests 6.1 et les tests existants de l'écran passent.

## 7. IA et équilibrage

- [ ] 7.1 Ajouter la carte de France au test de robustesse (100 parties, niveaux mélangés, 2 à 6 joueurs, variantes comprises) ; vérifier qu'aucune action n'est rejetée et que toutes les parties se terminent sous le plafond de tours.
- [ ] 7.2 Écrire le test d'équilibrage à la demande (`pnpm test:balance:france`, 120 parties entre trois IA difficiles) qui affiche les indicateurs par région décrits dans le design ; le lancer et ajuster les bonus jusqu'à atteindre les objectifs du design, puis reporter les bonus définitifs dans `france.ts` et dans la spec `world-map` du change.
- [ ] 7.3 Ajouter le tournoi de progression sur la carte de France (60 parties, ordres équilibrés) ; vérifier des victoires strictement croissantes de facile à difficile et au moins 40 % pour le difficile.
- [ ] 7.4 Lancer à titre indicatif le tournoi expert sur la carte de France et noter le résultat dans `TODO.md`.

## 8. Documentation et vérification

- [ ] 8.1 Mettre à jour `README.md` (section « Données de la carte » : provenance des contours IGN et lien vers `data/maps/france/SOURCE.md` ; mention de la carte de France dans les fonctionnalités) et `LICENSE.md` (exception pour `data/maps/france/`, Licence Ouverte) ; vérifier que les liens sont valides.
- [ ] 8.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` (en vérifiant que le bundle principal reste sous la limite de précache) ; vérifier que tout passe.
- [ ] 8.3 Jouer une partie complète sur la carte de France sur ordinateur et une sur iPad en paysage, dont une avec missions secrètes ; vérifier la lisibilité des régions, des étiquettes et de Paris.
