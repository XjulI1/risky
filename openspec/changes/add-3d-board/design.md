# Design

## Context

Le moteur (`add-classic-rules-engine`) expose un `GameState` sérialisable et la carte classique
(identifiants, continents, adjacences), mais aucune géométrie. Ce change ajoute la représentation
visuelle. Motivation : voir proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Un composant `GameBoard` sans état de jeu propre : `props` en entrée, événements en sortie.
- La géométrie de la carte comme donnée éditable (SVG), pas comme code.
- Toute la logique calculable (parsing, position des pions, modèle de vue, surbrillances,
  distinction clic/glisser) en fonctions pures testées avec Vitest.

**Non-Goals :**

- Tests automatisés du rendu WebGL : vérification visuelle manuelle selon une check-list.
- Animations déclenchées par les événements du moteur : `add-game-ui`.

## Decisions

### Arborescence

```
src/
  assets/maps/classic.svg
  board/
    geometry/svgMap.ts         SVG → formes par territoire (pur)
    geometry/anchors.ts        point d'ancrage du pion (pur)
    geometry/seaLinks.ts       liaisons maritimes à tracer (pur)
    boardViewModel.ts          GameState + surbrillances → données d'affichage (pur)
    tapDetector.ts             distinction toucher bref / glisser (pur)
    GameBoard.vue              TresCanvas, caméra, lumières, océan
    TerritoryMesh.vue
    ArmyPawn.vue
    SeaLink.vue
    useBoardCamera.ts
```

### Source de la carte : SVG extrudé

Le SVG contient un `<path id="<territoryId>">` par territoire (plusieurs sous-chemins pour les
territoires en plusieurs îles) et rien d'autre. Point de départ : une carte classique de Risk sous
licence libre (Wikimedia Commons), redécoupée et renommée dans Inkscape ; à défaut, tracé manuel en
s'appuyant sur une carte du plateau. Le projet n'étant pas publié, la licence n'est pas bloquante.

Au chargement, `SVGLoader` (addons de Three.js) convertit chaque chemin en `Shape`, puis en
`ExtrudeGeometry` peu profonde avec un léger biseau. Le SVG étant en coordonnées écran (Y vers le bas),
la conversion inverse l'axe Y et ramène la carte à une taille monde fixe (largeur 100 unités) centrée
sur l'origine, dans le plan XZ.

Alternatives écartées : GeoJSON réel (projection et fusion de pays, trop de prétraitement pour un
plateau stylisé) ; modèle glTF (demande de modéliser dans Blender, moins facile à corriger).

Le SVG est importé avec le suffixe `?raw` de Vite, ce qui permet de tester le parsing sous Vitest à
partir du même fichier.

### Position des pions : pôle d'inaccessibilité

Le centroïde d'une forme concave peut tomber hors de la forme (Amérique centrale, Indonésie). La
bibliothèque `polylabel` calcule le point intérieur le plus éloigné des bords, sur le plus grand
morceau du territoire. Un fichier `anchorOverrides` permet de corriger à la main un territoire dont
le point calculé est mal placé visuellement.

### Liaisons maritimes : calculées, pas saisies

`seaLinks.ts` parcourt les adjacences du moteur et retient celles dont les deux formes ne se touchent
pas (distance minimale entre contours au-delà d'un seuil). Une liaison est tracée entre les points de
contour les plus proches. Les adjacences qui traversent le bord de carte (Alaska–Kamtchatka) sont
déclarées dans une courte liste et tracées en deux demi-segments vers les bords.

### Modèle de vue

`boardViewModel(state, highlights)` renvoie, pour chaque territoire, sa couleur, son nombre
d'armées, son état de surbrillance et l'indicateur « atténué ». `GameBoard` ne fait qu'appliquer ces
valeurs aux matériaux. La couleur du neutre et les variations de luminosité par état de surbrillance
sont des constantes de ce module.

`GameBoard` reçoit l'état dans une `shallowRef` côté appelant : seuls les territoires dont le modèle
de vue change sont mis à jour.

### Rendu

- TresJS (`<TresCanvas>`), `dpr` borné à `[1, 2]`, antialiasing actif.
- Matériaux `MeshStandardMaterial` mats, une instance par territoire pour colorer individuellement
  (42 objets : pas besoin d'instanciation).
- Éclairage : lumière hémisphérique + une lumière directionnelle avec ombres douces (carte d'ombre
  2048, réduite à 1024 sur mobile).
- Océan : plan avec un shader simple de vaguelettes animées (déplacement de normales), sans
  réflexion.
- Pions : géométrie low-poly générée en code (socle cylindrique + tête), aucun asset externe.
- Compteurs : composant `Html` de cientos (DOM positionné en 3D), pour un texte net à toutes les
  densités d'écran et stylable en CSS. Alternative écartée : texte 3D en géométrie, flou ou coûteux
  pour 42 étiquettes changeantes.

### Caméra

`PerspectiveCamera` à 50° de champ, inclinée à 55°. Contrôle par `MapControls` (addons de Three.js),
rotation désactivée, zoom vers le curseur activé, distance bornée. Le centre visé est contraint dans
la boîte de la carte à chaque changement. Le cadrage initial calcule la distance nécessaire pour faire
entrer la boîte englobante de la carte dans le cône de vue selon le ratio de l'écran ; ce calcul est
une fonction pure testée.

### Sélection

Les événements de pointeur TresJS sur les maillages donnent le territoire touché. `tapDetector`
compare position et durée entre appui et relâchement : au-delà de 6 px ou de 500 ms, c'est un geste
de caméra, pas une sélection. Quand le contact tombe sur l'océan avec un pointeur tactile, le
territoire dont le contour est le plus proche du point projeté au sol, dans un rayon de 1,5 unité
monde, est retenu.

### Écran de démonstration

`App.vue` crée une partie aléatoire à 4 joueurs avec le moteur et l'affiche dans `GameBoard`. Un clic
sur un territoire le marque sélectionné et ses voisins comme cibles, ce qui permet de vérifier les
surbrillances et les adjacences visuellement. Cet écran sera remplacé par `add-game-ui`.

## Risks / Trade-offs

- [Le SVG trouvé ne correspond pas exactement au découpage classique] → test d'adéquation
  SVG ↔ moteur, et retouche dans Inkscape.
- [Ombres et shader d'océan trop coûteux sur téléphone] → réglage de qualité automatique selon
  `devicePixelRatio` et le type de pointeur ; ombres coupées si besoin.
- [42 éléments `Html` en DOM ralentissent le déplacement de caméra] → si mesuré, basculer vers des
  sprites à texture canvas, sans changer l'API du composant.
- [Petits territoires difficiles à toucher au zoom minimal] → rayon de tolérance tactile et zoom
  maximal assez fort.

## Open Questions

- Teinte exacte de l'océan et de la palette par défaut des joueurs : à ajuster visuellement pendant
  l'implémentation, sans impact sur les specs.
