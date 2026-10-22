# board-camera Specification

## Purpose

Cadrer le plateau dans une vue du haut inclinée et permettre au joueur de zoomer et de se déplacer
sur la carte, à la souris comme au tactile, sans jamais la perdre de vue.

## Requirements

### Requirement: Cadrage initial

Au chargement, la caméra SHALL regarder la carte depuis le haut avec une inclinaison fixe comprise
entre 45° et 60° par rapport à l'horizontale, et SHALL cadrer la carte entière dans la zone
d'affichage, pour toute fenêtre en paysage d'au moins 1024 pixels CSS de large.

#### Scenario: Carte entière visible en paysage

- **WHEN** le plateau s'affiche dans une fenêtre 1920 × 1080
- **THEN** les 42 territoires sont visibles

#### Scenario: Carte entière visible sur tablette

- **WHEN** le plateau s'affiche dans une fenêtre 1024 × 768
- **THEN** les 42 territoires sont visibles

#### Scenario: Redimensionnement

- **WHEN** la fenêtre est redimensionnée
- **THEN** le rendu s'adapte à la nouvelle taille sans déformation

### Requirement: Zoom

Le joueur SHALL pouvoir zoomer à la molette et par pincement, entre le cadrage de la carte entière
(zoom minimal) et un niveau où un territoire de taille moyenne occupe environ un tiers de la zone
d'affichage (zoom maximal). Le zoom SHALL se faire vers le point visé par le pointeur ou par le centre
du pincement.

#### Scenario: Zoom borné

- **WHEN** le joueur continue de zoomer au-delà du zoom maximal
- **THEN** le zoom reste au maximal

#### Scenario: Zoom vers le pointeur

- **WHEN** le joueur zoome à la molette avec le pointeur sur l'Afrique
- **THEN** l'Afrique reste sous le pointeur pendant le zoom

### Requirement: Déplacement

Le joueur SHALL pouvoir déplacer la vue en glissant (bouton de souris ou un doigt). Le centre de la
vue SHALL rester dans les limites de la carte. L'inclinaison et l'orientation de la caméra SHALL NOT
pouvoir être modifiées.

#### Scenario: Déplacement borné

- **WHEN** le joueur glisse loin au-delà du bord de la carte
- **THEN** la vue s'arrête au bord de la carte

#### Scenario: Pas de rotation

- **WHEN** le joueur fait un clic droit glissé ou une rotation à deux doigts
- **THEN** l'orientation et l'inclinaison de la caméra restent inchangées

### Requirement: Recentrage

Le plateau SHALL offrir une commande de recentrage qui ramène la caméra au cadrage initial.

#### Scenario: Recentrer après un zoom

- **WHEN** le joueur a zoomé et déplacé la vue puis déclenche le recentrage
- **THEN** la caméra revient au cadrage de la carte entière
