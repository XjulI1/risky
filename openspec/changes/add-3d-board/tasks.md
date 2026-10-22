# Tasks

## 1. Dépendances

- [ ] 1.1 Ajouter à `package.json` `three`, `@tresjs/core`, `@tresjs/cientos` et, en dev, `@types/three` (dernières versions stables compatibles entre elles). **Demander à l'utilisateur de lancer `pnpm install`** et attendre sa confirmation ; vérifier ensuite que `pnpm type-check` passe.

## 2. Géométrie pure

- [ ] 2.1 Écrire les tests de `pathData.ts` : chemin `M`/`L`/`z`, courbe `C`, plusieurs sous-chemins, erreur explicite sur une commande non gérée ; lecture sans erreur des 42 contours de `territories.json`.
- [ ] 2.2 Implémenter `src/board/geometry/pathData.ts` ; vérifier que les tests 2.1 passent.
- [ ] 2.3 Écrire les tests de `mapGeometry.ts` : une entrée par identifiant de territoire du moteur et aucune autre, 4 formes pour l'Indonésie et 2 pour la Grande-Bretagne, aucun sous-chemin contenu dans un autre, carte ramenée à 100 unités de large et centrée, axe Y du SVG converti en axe Z.
- [ ] 2.4 Implémenter `src/board/geometry/mapGeometry.ts` ; vérifier que les tests 2.3 passent.
- [ ] 2.5 Écrire les tests de `anchors.ts` : ancrage repris de `cx`, `cy`, correction prioritaire, chacun des 42 ancrages retenus à l'intérieur de sa forme (plus grand morceau pour la Grande-Bretagne et l'Indonésie).
- [ ] 2.6 Implémenter `src/board/geometry/anchors.ts` avec la correction de la Grande-Bretagne dans `anchorOverrides` ; vérifier que les tests 2.5 passent.
- [ ] 2.7 Écrire les tests de `seaRoutes.ts` : 21 segments, chaque route correspondant à une adjacence du moteur, Brésil–Afrique du Nord et Siam–Indonésie présentes, Alaska–Kamtchatka représentée par deux amorces vers les bords gauche et droit, coordonnées converties dans le repère monde.
- [ ] 2.8 Implémenter `src/board/geometry/seaRoutes.ts` ; vérifier que les tests 2.7 passent.

## 3. Modèle de vue et gestes

- [ ] 3.1 Écrire les tests de `boardViewModel` : couleur du propriétaire, gris du neutre, nombre d'armées, états aucun/sélectionnable/sélectionné/cible, atténuation des non-sélectionnables seulement quand il existe des sélectionnables.
- [ ] 3.2 Implémenter `src/board/boardViewModel.ts` ; vérifier que les tests 3.1 passent.
- [ ] 3.3 Écrire les tests de `tapDetector` : toucher bref accepté, déplacement au-delà de 6 px refusé, appui de plus de 500 ms refusé, territoire le plus proche retenu dans le rayon de tolérance tactile et rien au-delà.
- [ ] 3.4 Implémenter `src/board/tapDetector.ts` ; vérifier que les tests 3.3 passent.
- [ ] 3.5 Écrire les tests du cadrage initial : distance de caméra qui fait tenir la boîte de la carte en 16/9 et en portrait 390 × 844, centre visé contraint dans la boîte.
- [ ] 3.6 Implémenter les fonctions pures de cadrage dans `src/board/useBoardCamera.ts` ; vérifier que les tests 3.5 passent.

## 4. Composants 3D

- [ ] 4.1 Créer `GameBoard.vue` (TresCanvas, `dpr` borné à 2, lumières, ombres, océan animé) et `TerritoryMesh.vue` (extrusion, matériau piloté par le modèle de vue) ; vérifier visuellement que les 42 territoires apparaissent dans les couleurs de leur propriétaire.
- [ ] 4.2 Créer `ArmyPawn.vue` (pion low-poly + compteur `Html`) positionné sur le point d'ancrage ; vérifier visuellement que chaque pion est dans son territoire et que le compteur reste lisible au zoom minimal et maximal.
- [ ] 4.3 Créer `SeaLink.vue` (pointillés) et `ContinentLabel.vue` (nom français et bonus) ; vérifier visuellement les liaisons maritimes, dont Alaska–Kamtchatka aux bords, et les 6 étiquettes en mer sans recouvrement de territoire.
- [ ] 4.4 Brancher `MapControls` (rotation désactivée, zoom vers le curseur, bornes) et la commande de recentrage dans `useBoardCamera.ts` ; vérifier à la souris et au tactile (outils de développement en émulation mobile) le zoom borné, le déplacement borné et l'absence de rotation.
- [ ] 4.5 Brancher la sélection (`tapDetector`, désélection sur l'océan, tolérance tactile) et le survol avec nom du territoire ; vérifier que glisser ne sélectionne pas et que l'Indonésie se sélectionne depuis n'importe laquelle de ses îles.

## 5. Écran de démonstration

- [ ] 5.1 Remplacer le contenu de `src/App.vue` par une partie aléatoire à 4 joueurs affichée dans `GameBoard`, où un clic sélectionne un territoire et marque ses voisins comme cibles ; vérifier visuellement les adjacences et les surbrillances.

## 6. Vérification d'ensemble

- [ ] 6.1 Dérouler la check-list visuelle sur desktop (1920 × 1080) et en émulation mobile (390 × 844, densité 3) : carte entière au chargement, redimensionnement sans déformation, fluidité du zoom et du déplacement, densité de rendu plafonnée à 2.
- [ ] 6.2 Vérifier que les fichiers de `data/maps/classic/` sont inchangés (`git diff --exit-code data/`) puis lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; tout doit passer, et la règle d'isolement du moteur ne doit signaler aucun import de Three.js dans `src/engine/`.
