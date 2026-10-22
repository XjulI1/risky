# Design

## Context

Le moteur (`add-classic-rules-engine`) expose un `GameState` sérialisable et la carte classique
(identifiants, continents, adjacences), construite depuis `data/maps/classic/`. Ce même dossier
contient déjà toute la géométrie nécessaire au plateau (provenance et licences dans `SOURCE.md`) :

- `territories.json` : `viewBox` `[23, 18, 709, 466]` et, pour chaque territoire, son contour en
  données de chemin SVG (`d`) et un point d'ancrage d'étiquette (`cx`, `cy`) ;
- `sea-routes.json` : 21 liaisons maritimes avec le point le plus proche sur chaque côte (`pa`,
  `pb`), et deux amorces de bord de carte (`wrap`) pour Alaska–Kamtchatka ;
- `continent-labels.json` : position en mer de l'étiquette de chaque continent.

Constats faits sur ces données : les contours n'utilisent que les commandes `M`, `L`, `C` et `z` en
coordonnées absolues ; l'Indonésie compte 4 sous-chemins et la Grande-Bretagne 2, tous des îles
pleines (aucun trou) ; le point d'ancrage de la Grande-Bretagne tombe en mer, tous les autres sont
à l'intérieur de leur territoire.

Motivation : voir proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Un composant `GameBoard` sans état de jeu propre : `props` en entrée, événements en sortie.
- Utiliser les données récupérées telles quelles, sans les modifier ni les recalculer.
- Toute la logique calculable (conversion des contours, ancrages, liaisons, modèle de vue,
  distinction clic/glisser, cadrage) en fonctions pures testées avec Vitest.

**Non-Goals :**

- Tests automatisés du rendu WebGL : vérification visuelle manuelle selon une check-list.
- Animations déclenchées par les événements du moteur : `add-game-ui`.

## Decisions

### Arborescence

```
src/
  board/
    geometry/pathData.ts       données de chemin SVG → contours (pur)
    geometry/mapGeometry.ts    territories.json → formes en coordonnées monde (pur)
    geometry/anchors.ts        point d'ancrage du pion (pur)
    geometry/seaRoutes.ts      sea-routes.json → segments en coordonnées monde (pur)
    boardViewModel.ts          GameState + surbrillances → données d'affichage (pur)
    tapDetector.ts             distinction toucher bref / glisser (pur)
    GameBoard.vue              TresCanvas, caméra, lumières, océan
    TerritoryMesh.vue
    ArmyPawn.vue
    SeaLink.vue
    ContinentLabel.vue
    useBoardCamera.ts
```

### Contours : petit lecteur de chemins plutôt que `SVGLoader`

`pathData.ts` lit les données de chemin et produit, pour chaque sous-chemin, une suite d'opérations
`moveTo`, `lineTo` et `bezierCurveTo` appliquées à une `THREE.Shape`. Il ne gère que les commandes
présentes dans les données (`M`, `L`, `C`, `z`) et lève une erreur explicite sur toute autre, ce qui
rend visible une future donnée inattendue.

Alternative écartée : `SVGLoader` des addons de Three.js. Il attend un document SVG et s'appuie sur
`DOMParser`, absent de l'environnement de test `node` ; il faudrait reconstruire un document à partir
du JSON pour n'en utiliser qu'une petite partie.

Chaque sous-chemin devient une forme pleine distincte, rattachée au même territoire (pas de gestion
des trous, absents des données ; un test le vérifie en contrôlant qu'aucun sous-chemin n'est contenu
dans un autre).

### Repère monde

`mapGeometry.ts` convertit les coordonnées du `viewBox` vers le plan XZ : la carte est ramenée à
100 unités de large, centrée sur l'origine, l'axe Y du SVG (vers le bas) devenant l'axe Z. La même
fonction de conversion sert aux contours, aux ancrages, aux liaisons maritimes et aux étiquettes de
continent. Chaque forme est extrudée en `ExtrudeGeometry` peu profonde avec un léger biseau.

### Ancrage des pions : données + corrections

Le point d'ancrage d'un pion est le couple `cx`, `cy` de `territories.json`, sauf correction déclarée
dans `anchorOverrides` (constante de `anchors.ts`). La Grande-Bretagne, dont l'ancrage tombe en mer,
y reçoit un point à l'intérieur de sa plus grande île. Un test vérifie que chacun des 42 ancrages
retenus est à l'intérieur de la forme de son territoire (sur son plus grand morceau pour les
territoires en plusieurs îles).

Alternative écartée : recalculer tous les ancrages avec `polylabel` (pôle d'inaccessibilité). Une
dépendance de plus pour corriger un seul territoire.

### Liaisons maritimes : données telles quelles

`seaRoutes.ts` convertit chaque route de `sea-routes.json` en segment pointillé de `pa` à `pb`, et
chaque amorce `wrap` en segment partant de `from` jusqu'au bord `toX` de la carte. Un test vérifie
que chaque route correspond à une adjacence du moteur et que l'adjacence Alaska–Kamtchatka est
représentée par les deux amorces.

### Étiquettes de continent

`ContinentLabel` affiche en mer, aux positions de `continent-labels.json`, le nom français du
continent (fourni par la carte du moteur) et son bonus, en texte DOM via le composant `Html` de
cientos, comme les compteurs.

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
  2048, réduite à 1024 sur tablette).
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

- [Carte peu détaillée une fois en relief et zoomée] → contours d'une carte de plateau, pas d'une
  carte géographique : c'est le style recherché ; le biseau et l'éclairage donnent le relief.
- [Licence CC BY-SA 3.0 de la géométrie] → sans effet pour un projet personnel ; à respecter
  (attribution, même licence) si le projet est un jour diffusé. `SOURCE.md` porte l'attribution.
- [Ombres et shader d'océan trop coûteux sur tablette] → réglage de qualité automatique selon
  `devicePixelRatio` et le type de pointeur ; ombres coupées si besoin.
- [Éléments `Html` en DOM (42 compteurs + 6 étiquettes) qui ralentissent le déplacement de caméra] →
  si mesuré, basculer vers des sprites à texture canvas, sans changer l'API du composant.
- [Petits territoires difficiles à toucher au zoom minimal] → rayon de tolérance tactile et zoom
  maximal assez fort.

## Open Questions

- Teinte exacte de l'océan et de la palette par défaut des joueurs : à ajuster visuellement pendant
  l'implémentation, sans impact sur les specs.
