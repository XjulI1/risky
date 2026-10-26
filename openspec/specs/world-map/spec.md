# world-map Specification

## Purpose

Fournir la carte du monde du Risk classique sous forme de données : territoires, continents, bonus
de continent et adjacences. Toutes les règles et le rendu s'appuient sur ces données.

## Requirements

### Requirement: Composition de la carte classique

La carte classique SHALL comporter exactement 42 territoires répartis en 6 continents. Chaque
territoire SHALL avoir un identifiant stable, un nom affichable en français et appartenir à un seul
continent. La répartition et les bonus SHALL être :

| Continent | Territoires | Bonus |
|---|---|---|
| Amérique du Nord | 9 | 5 |
| Amérique du Sud | 4 | 2 |
| Europe | 7 | 5 |
| Afrique | 6 | 3 |
| Asie | 12 | 7 |
| Océanie | 4 | 2 |

#### Scenario: Nombre de territoires et de continents

- **WHEN** on charge la carte classique
- **THEN** elle contient 42 territoires et 6 continents
- **AND** chaque territoire appartient à exactement un continent existant

#### Scenario: Bonus et taille des continents

- **WHEN** on lit chaque continent de la carte classique
- **THEN** son nombre de territoires et son bonus correspondent au tableau ci-dessus

#### Scenario: Identifiants uniques

- **WHEN** on liste les identifiants des territoires et des continents
- **THEN** aucun identifiant n'apparaît deux fois

### Requirement: Graphe d'adjacence

Les adjacences SHALL reproduire celles du plateau classique, liaisons maritimes comprises (par exemple
Alaska–Kamtchatka, Brésil–Afrique du Nord, Siam–Indonésie). L'adjacence SHALL être symétrique, aucun
territoire ne SHALL être adjacent à lui-même, et le graphe SHALL être connexe.

#### Scenario: Symétrie

- **WHEN** un territoire A est déclaré adjacent à un territoire B
- **THEN** B est aussi adjacent à A

#### Scenario: Pas de boucle

- **WHEN** on lit les voisins de chaque territoire
- **THEN** aucun territoire ne figure parmi ses propres voisins

#### Scenario: Connexité

- **WHEN** on parcourt le graphe depuis n'importe quel territoire
- **THEN** les 42 territoires sont atteignables

#### Scenario: Liaisons maritimes classiques

- **WHEN** on interroge l'adjacence entre Alaska et Kamtchatka, Brésil et Afrique du Nord, Siam et Indonésie
- **THEN** chacune de ces paires est adjacente

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
