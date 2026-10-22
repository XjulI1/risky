# Tasks

## 1. Dépendances

- [ ] 1.1 Ajouter à `package.json` `three`, `@tresjs/core`, `@tresjs/cientos`, `polylabel` et, en dev, `@types/three` et les types de `polylabel` (dernières versions stables compatibles entre elles). **Demander à l'utilisateur de lancer `pnpm install`** et attendre sa confirmation ; vérifier ensuite que `pnpm type-check` passe.

## 2. Carte SVG

- [ ] 2.1 Écrire le test d'adéquation : le SVG contient exactement un chemin par identifiant de territoire du moteur, sans identifiant inconnu.
- [ ] 2.2 Produire `src/assets/maps/classic.svg` (carte libre redécoupée ou tracé manuel), avec les identifiants du moteur ; vérifier que le test 2.1 passe.

## 3. Géométrie pure

- [ ] 3.1 Écrire les tests de `svgMap.ts` : une entrée par territoire, l'Indonésie en plusieurs formes, axe Y inversé, carte ramenée à 100 unités de large et centrée.
- [ ] 3.2 Implémenter `src/board/geometry/svgMap.ts` avec `SVGLoader` ; vérifier que les tests 3.1 passent.
- [ ] 3.3 Écrire les tests de `anchors.ts` : point d'ancrage à l'intérieur de la forme pour chaque territoire (y compris les formes concaves), choix du plus grand morceau, priorité aux corrections manuelles.
- [ ] 3.4 Implémenter `src/board/geometry/anchors.ts` avec `polylabel` ; vérifier que les tests 3.3 passent.
- [ ] 3.5 Écrire les tests de `seaLinks.ts` : liaisons Brésil–Afrique du Nord et Siam–Indonésie détectées, aucune liaison entre territoires frontaliers (Europe de l'Ouest–Europe du Sud par exemple), Alaska–Kamtchatka produite en deux demi-segments vers les bords.
- [ ] 3.6 Implémenter `src/board/geometry/seaLinks.ts` ; vérifier que les tests 3.5 passent.

## 4. Modèle de vue et gestes

- [ ] 4.1 Écrire les tests de `boardViewModel` : couleur du propriétaire, gris du neutre, nombre d'armées, états aucun/sélectionnable/sélectionné/cible, atténuation des non-sélectionnables seulement quand il existe des sélectionnables.
- [ ] 4.2 Implémenter `src/board/boardViewModel.ts` ; vérifier que les tests 4.1 passent.
- [ ] 4.3 Écrire les tests de `tapDetector` : toucher bref accepté, déplacement au-delà de 6 px refusé, appui de plus de 500 ms refusé, territoire le plus proche retenu dans le rayon de tolérance tactile et rien au-delà.
- [ ] 4.4 Implémenter `src/board/tapDetector.ts` ; vérifier que les tests 4.3 passent.
- [ ] 4.5 Écrire les tests du cadrage initial : distance de caméra qui fait tenir la boîte de la carte en 16/9 et en portrait 390 × 844, centre visé contraint dans la boîte.
- [ ] 4.6 Implémenter les fonctions pures de cadrage dans `src/board/useBoardCamera.ts` ; vérifier que les tests 4.5 passent.

## 5. Composants 3D

- [ ] 5.1 Créer `GameBoard.vue` (TresCanvas, `dpr` borné à 2, lumières, ombres, océan animé) et `TerritoryMesh.vue` (extrusion, matériau piloté par le modèle de vue) ; vérifier visuellement que les 42 territoires apparaissent dans les couleurs de leur propriétaire.
- [ ] 5.2 Créer `ArmyPawn.vue` (pion low-poly + compteur `Html`) positionné sur le point d'ancrage ; vérifier visuellement que chaque pion est dans son territoire et que le compteur reste lisible au zoom minimal et maximal.
- [ ] 5.3 Créer `SeaLink.vue` (pointillés) ; vérifier visuellement les liaisons maritimes, dont Alaska–Kamtchatka aux bords.
- [ ] 5.4 Brancher `MapControls` (rotation désactivée, zoom vers le curseur, bornes) et la commande de recentrage dans `useBoardCamera.ts` ; vérifier à la souris et au tactile (outils de développement en émulation mobile) le zoom borné, le déplacement borné et l'absence de rotation.
- [ ] 5.5 Brancher la sélection (`tapDetector`, désélection sur l'océan, tolérance tactile) et le survol avec nom du territoire ; vérifier que glisser ne sélectionne pas et que l'Indonésie se sélectionne depuis n'importe laquelle de ses îles.

## 6. Écran de démonstration

- [ ] 6.1 Remplacer le contenu de `src/App.vue` par une partie aléatoire à 4 joueurs affichée dans `GameBoard`, où un clic sélectionne un territoire et marque ses voisins comme cibles ; vérifier visuellement les adjacences et les surbrillances.

## 7. Vérification d'ensemble

- [ ] 7.1 Dérouler la check-list visuelle sur desktop (1920 × 1080) et en émulation mobile (390 × 844, densité 3) : carte entière au chargement, redimensionnement sans déformation, fluidité du zoom et du déplacement, densité de rendu plafonnée à 2.
- [ ] 7.2 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; tout doit passer, et la règle d'isolement du moteur ne doit signaler aucun import de Three.js dans `src/engine/`.
