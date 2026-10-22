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
