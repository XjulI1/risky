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

### Requirement: Composition de la carte de France

Le catalogue SHALL proposer la carte de France métropolitaine, d'identifiant `france`, formée de 42
territoires répartis en 7 régions qui tiennent le rôle de continents. Chaque territoire SHALL
regrouper les départements indiqués ci-dessous, chaque département métropolitain figurant dans
exactement un territoire. Les bonus SHALL être :

| Région | Nom avec article | Territoires | Bonus |
|---|---|---|---|
| Île-de-France | l'Île-de-France | 2 | 3 |
| Nord | le Nord | 5 | 3 |
| Ouest | l'Ouest | 5 | 3 |
| Centre | le Centre | 6 | 4 |
| Sud-Ouest | le Sud-Ouest | 7 | 4 |
| Est | l'Est | 7 | 4 |
| Sud-Est | le Sud-Est | 10 | 5 |

Territoires et départements :

| Région | Territoire | Départements |
|---|---|---|
| Île-de-France | Paris | 75, 78, 92, 95 |
| Île-de-France | Brie et Hurepoix | 77, 91, 93, 94 |
| Nord | Flandre | 59 |
| Nord | Artois | 62 |
| Nord | Picardie | 02, 60, 80 |
| Nord | Haute-Normandie | 27, 76 |
| Nord | Basse-Normandie | 14, 50, 61 |
| Ouest | Bretagne occidentale | 22, 29 |
| Ouest | Bretagne orientale | 35, 56 |
| Ouest | Pays nantais | 44, 85 |
| Ouest | Maine | 53, 72 |
| Ouest | Anjou | 49 |
| Centre | Beauce | 28, 45 |
| Centre | Touraine | 37, 41 |
| Centre | Berry | 18, 36 |
| Centre | Limousin | 19, 23, 87 |
| Centre | Bourbonnais | 03, 63 |
| Centre | Haute-Auvergne | 15, 43 |
| Sud-Ouest | Poitou | 79, 86 |
| Sud-Ouest | Charentes | 16, 17 |
| Sud-Ouest | Guyenne | 24, 33 |
| Sud-Ouest | Landes et Béarn | 40, 47, 64 |
| Sud-Ouest | Gascogne | 32, 65 |
| Sud-Ouest | Toulousain | 09, 31, 82 |
| Sud-Ouest | Quercy et Rouergue | 12, 46, 81 |
| Est | Champagne | 08, 51 |
| Est | Aube et Haute-Marne | 10, 52 |
| Est | Lorraine | 54, 55, 57, 88 |
| Est | Alsace | 67, 68 |
| Est | Bourgogne du Nord | 21, 89 |
| Est | Bourgogne du Sud | 58, 71 |
| Est | Franche-Comté | 25, 39, 70, 90 |
| Sud-Est | Lyonnais | 01, 42, 69 |
| Sud-Est | Savoie | 73, 74 |
| Sud-Est | Dauphiné | 07, 26, 38 |
| Sud-Est | Alpes du Sud | 04, 05 |
| Sud-Est | Provence | 13, 84 |
| Sud-Est | Côte d'Azur | 06, 83 |
| Sud-Est | Languedoc | 30, 34, 48 |
| Sud-Est | Roussillon | 11, 66 |
| Sud-Est | Haute-Corse | 2B |
| Sud-Est | Corse-du-Sud | 2A |

Le mot qui désigne les continents de cette carte SHALL être « région », au féminin.

#### Scenario: Nombre de territoires et de régions

- **WHEN** on charge la carte de France
- **THEN** elle contient 42 territoires et 7 régions, et respecte les invariants de toute carte

#### Scenario: Bonus et taille des régions

- **WHEN** on lit chaque région de la carte de France
- **THEN** son nombre de territoires, son nom avec article et son bonus correspondent au tableau des régions

#### Scenario: Départements tous couverts

- **WHEN** on réunit les départements de tous les territoires
- **THEN** on obtient les 96 départements métropolitains, chacun une seule fois

### Requirement: Adjacences de la carte de France

Deux territoires de la carte de France SHALL être adjacents si et seulement si leurs départements
partagent une frontière terrestre d'au moins 1 km, ou s'ils sont reliés par l'une des deux liaisons
maritimes : Haute-Corse–Côte d'Azur et Corse-du-Sud–Provence.

#### Scenario: Frontières terrestres

- **WHEN** on interroge l'adjacence entre Paris et Brie et Hurepoix, Paris et Picardie, Alsace et Franche-Comté, Haute-Corse et Corse-du-Sud
- **THEN** chacune de ces paires est adjacente

#### Scenario: Liaisons maritimes de la Corse

- **WHEN** on interroge l'adjacence entre Haute-Corse et Côte d'Azur, puis entre Corse-du-Sud et Provence
- **THEN** les deux paires sont adjacentes, et la Corse n'a aucun autre voisin hors d'elle-même

#### Scenario: Territoires non adjacents

- **WHEN** on interroge l'adjacence entre Flandre et Paris, entre Bretagne occidentale et Pays nantais, entre Bretagne occidentale et Basse-Normandie
- **THEN** aucune de ces paires n'est adjacente

### Requirement: Missions de la carte de France

Les missions de continents de la carte de France SHALL être :

1. Conquérir le Sud-Est et l'Ouest.
2. Conquérir le Sud-Est et le Nord.
3. Conquérir le Sud-Ouest et l'Est.
4. Conquérir le Sud-Ouest et le Nord.
5. Conquérir le Centre, l'Ouest et une troisième région au choix.
6. Conquérir l'Est, l'Île-de-France et une troisième région au choix.

#### Scenario: Paquet de missions sur la carte de France

- **WHEN** on crée une partie à 4 joueurs avec missions sur la carte de France
- **THEN** le paquet compte 12 missions, dont ces six missions de régions, « Conquérir 24 territoires » et « Occuper 18 territoires avec au moins 2 armées sur chacun »

#### Scenario: Texte d'une mission à région au choix

- **WHEN** on affiche la cinquième mission
- **THEN** le texte est « Conquérir le Centre, l'Ouest et une troisième région au choix »
