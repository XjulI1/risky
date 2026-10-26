# board-rendering Specification

## Purpose

Afficher en 3D, dans le style d'un plateau low-poly, la carte classique et l'état d'une partie :
propriétaire de chaque territoire, nombre d'armées et liaisons maritimes.

## Requirements

### Requirement: Géométrie complète de la carte

Chaque territoire de la carte de la partie SHALL avoir exactement une forme dans la géométrie de
cette carte, identifiée par l'identifiant de territoire du moteur, et aucune forme ne SHALL désigner
un territoire inconnu de cette carte. Chaque territoire SHALL être rendu comme un volume en relief
au-dessus de l'océan. Le plateau SHALL afficher la géométrie, les liaisons maritimes et les
étiquettes de continent de la carte de la partie qu'il reçoit, et cadrer la caméra sur cette carte.

#### Scenario: Correspondance avec le moteur

- **WHEN** on charge la géométrie de chaque carte du catalogue
- **THEN** elle contient exactement une forme pour chacun des territoires de cette carte dans le moteur et aucune autre

#### Scenario: Territoire en plusieurs morceaux

- **WHEN** un territoire est composé de plusieurs îles (par exemple l'Indonésie)
- **THEN** tous ses morceaux sont rendus et réagissent comme un seul territoire

### Requirement: Couleur du propriétaire

Chaque territoire SHALL être affiché dans la couleur de son propriétaire telle que définie dans la
partie, le neutre dans un gris dédié. Un changement de propriétaire dans l'état fourni SHALL être
reflété sans recharger le plateau.

#### Scenario: Couleur initiale

- **WHEN** le plateau reçoit un état où le territoire Brésil appartient à un joueur rouge
- **THEN** le Brésil est affiché en rouge

#### Scenario: Changement de propriétaire

- **WHEN** l'état fourni au plateau est remplacé par un état où le Brésil appartient désormais à un joueur bleu
- **THEN** le Brésil est affiché en bleu sans rechargement de la scène

### Requirement: Pion et compteur d'armées

Chaque territoire SHALL porter un pion 3D aux couleurs de son propriétaire et un compteur indiquant
son nombre d'armées, placés à l'intérieur de la forme du territoire (sur son plus grand morceau pour
un territoire en plusieurs îles). Le compteur SHALL rester lisible quel que soit le niveau de zoom
autorisé.

#### Scenario: Compteur à jour

- **WHEN** l'état fourni passe de 3 à 12 armées sur un territoire
- **THEN** son compteur affiche 12

#### Scenario: Pion à l'intérieur du territoire

- **WHEN** on calcule la position du pion de chacun des 42 territoires
- **THEN** chaque position est à l'intérieur de la forme de son territoire

#### Scenario: Territoire en plusieurs îles

- **WHEN** on calcule la position du pion de la Grande-Bretagne, formée de deux îles
- **THEN** la position est à l'intérieur de la plus grande des deux îles

### Requirement: Liaisons maritimes

Chaque adjacence du moteur entre deux territoires qui ne partagent pas de frontière sur la carte
SHALL être représentée par une liaison visible en pointillés au-dessus de l'océan. La liaison
Alaska–Kamtchatka SHALL être représentée de part et d'autre des bords de la carte plutôt qu'à
travers toute la carte.

#### Scenario: Liaisons tracées

- **WHEN** le plateau est affiché
- **THEN** une liaison est visible entre Brésil et Afrique du Nord, et entre Siam et Indonésie

#### Scenario: Liaison qui traverse le bord

- **WHEN** le plateau est affiché
- **THEN** la liaison Alaska–Kamtchatka part de chaque territoire vers le bord de carte le plus proche

### Requirement: Noms des continents

Le nom français de chaque continent et son bonus SHALL être affichés près du continent. Sur la carte
classique, chaque étiquette SHALL être placée en pleine mer, sans recouvrir de territoire. Sur la
carte de France, chaque étiquette SHALL aussi être placée en mer, sans recouvrir de territoire ni
aucun pion ou compteur au zoom minimal : près de sa région quand celle-ci touche la mer, à l'est de
la carte pour les régions qui ne la touchent pas (Île-de-France en haut, Centre à mi-hauteur).

#### Scenario: Étiquette de l'Océanie

- **WHEN** le plateau classique est affiché
- **THEN** l'étiquette « Océanie +2 » est visible en mer près de l'Océanie

#### Scenario: Étiquette d'une région côtière

- **WHEN** le plateau de la carte de France est affiché
- **THEN** l'étiquette « Ouest +3 » est visible en mer, au large de l'Ouest

#### Scenario: Étiquette d'une région intérieure

- **WHEN** on calcule la position des étiquettes du Centre et de l'Île-de-France sur la carte de France
- **THEN** elles sont en mer, à l'est de la carte, et aucune n'est à moins d'une distance de sécurité de la position d'un pion

### Requirement: Fluidité

Le plateau SHALL rester fluide sur un ordinateur portable récent comme sur une tablette récente, et
SHALL adapter sa résolution à la densité d'écran sans dépasser un rendu au double de la résolution
CSS.

#### Scenario: Écran haute densité

- **WHEN** le plateau est affiché sur un écran de densité 3
- **THEN** le rendu se fait à une densité de 2 au maximum

### Requirement: Limites de régions

Sur la carte de France, la limite entre deux régions SHALL être tracée au-dessus des territoires d'un
trait nettement plus épais et plus contrasté que les frontières entre territoires d'une même région,
lisible sur toutes les couleurs de joueur, pour que les régions se lisent d'un coup d'œil au zoom
minimal. Les côtes ne sont pas tracées de ce trait.

#### Scenario: Limite entre deux régions

- **WHEN** le plateau de la carte de France est affiché
- **THEN** la frontière entre Paris et Picardie est tracée en trait épais, celle entre Paris et Brie et Hurepoix en trait fin

#### Scenario: Contour par région

- **WHEN** on charge les données de rendu de la carte de France
- **THEN** elles contiennent un contour pour chacune des 7 régions et aucun autre
