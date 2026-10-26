## MODIFIED Requirements

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

## ADDED Requirements

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
