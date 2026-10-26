## ADDED Requirements

### Requirement: Catalogue de cartes

Le moteur SHALL proposer un catalogue de cartes, chacune désignée par un identifiant stable ; la
carte classique a l'identifiant `classic`. Chaque carte SHALL fournir ses territoires, ses
continents avec leur nom affichable et leur nom précédé de l'article (« l'Amérique du Nord »), leurs
bonus, ses adjacences, ses missions de continents et le mot qui désigne ses continents dans les
textes, avec son genre. Pour la carte classique, ce mot SHALL être « continent », au masculin.

#### Scenario: Carte classique au catalogue

- **WHEN** on demande au catalogue la carte `classic`
- **THEN** on obtient la carte classique de 42 territoires et 6 continents

#### Scenario: Nom avec article

- **WHEN** on lit le continent Amérique du Nord de la carte classique
- **THEN** son nom avec article est « l'Amérique du Nord »

### Requirement: Invariants de toute carte

Toute carte du catalogue SHALL respecter ces invariants : identifiants de territoires et de
continents uniques, chaque territoire dans exactement un continent existant, chaque continent non
vide avec un bonus positif, adjacence symétrique sans boucle, graphe connexe, missions de continents
ne citant que des continents de la carte.

#### Scenario: Vérification de chaque carte

- **WHEN** on vérifie les invariants sur chaque carte du catalogue
- **THEN** toutes les respectent

#### Scenario: Mission invalide détectée

- **WHEN** on vérifie une carte de test dont une mission cite un continent absent de la carte
- **THEN** la vérification échoue en nommant ce continent
