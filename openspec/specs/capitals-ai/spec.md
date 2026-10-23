# capitals-ai Specification

## Purpose

Faire jouer les IA de manière crédible en mode capitales : choisir une capitale défendable, la
protéger et viser les capitales adverses, avec un écart de niveau préservé.

## Requirements

### Requirement: Choix de capitale

L'IA facile SHALL choisir comme capitale son territoire le plus garni en armées. Les IA normale et
difficile SHALL choisir le territoire qui minimise la menace adverse voisine, en privilégiant un
territoire intérieur, puis le plus garni en armées.

#### Scenario: IA facile

- **WHEN** l'IA facile choisit sa capitale et que son territoire le plus garni a 5 armées
- **THEN** elle choisit ce territoire

#### Scenario: Territoire intérieur privilégié

- **WHEN** l'IA normale possède un territoire intérieur et des territoires frontaliers
- **THEN** elle choisit un territoire intérieur

### Requirement: Défense de la capitale

Les IA normale et difficile SHALL, pendant leurs renforts, porter la défense de leur capitale à au
moins la somme des armées adverses voisines quand leur réserve le permet, avant toute autre
priorité. Si leur capitale est perdue, elles SHALL faire de sa reconquête leur priorité d'attaque
quand la probabilité de conquête est d'au moins 0,5.

#### Scenario: Capitale menacée

- **WHEN** la capitale d'une IA normale a 3 armées, est voisine de 6 armées adverses, et que sa réserve est de 5
- **THEN** elle déploie ses 5 armées sur sa capitale

#### Scenario: Reconquête

- **WHEN** la capitale d'une IA difficile est tenue par un adversaire et qu'elle peut l'attaquer avec une probabilité de 0,6
- **THEN** elle attaque sa capitale en priorité

### Requirement: Probabilités avec bonus de défense

Les IA normale et difficile SHALL évaluer toute attaque contre une capitale avec des probabilités de
conquête qui tiennent compte exactement du bonus de défense.

#### Scenario: Conquête d'une capitale à deux contre un

- **WHEN** on calcule la probabilité qu'un territoire de 2 armées conquière une capitale défendue par 1 armée
- **THEN** elle vaut 10/36, contre 15/36 pour un territoire ordinaire

### Requirement: Choix sans information cachée

Une IA SHALL choisir sa capitale sans connaître les choix déjà faits par les autres joueurs.

#### Scenario: Choix indépendant

- **WHEN** on présente à une IA deux états de choix identiques sauf les capitales déjà choisies par d'autres joueurs
- **THEN** elle choisit la même capitale

### Requirement: Attaque des capitales adverses

Les IA normale et difficile SHALL attaquer une capitale adverse quand la probabilité de conquête est
d'au moins 0,5. L'IA difficile SHALL concentrer tous ses renforts en vue de la dernière capitale qui
lui manque dès qu'elle tient toutes les autres.

#### Scenario: Dernière capitale

- **WHEN** l'IA difficile tient toutes les capitales sauf une
- **THEN** elle déploie toute sa réserve sur un de ses territoires voisins de cette capitale ou, si elle n'en a aucun, sur son territoire le plus proche de cette capitale en nombre de territoires traversés

### Requirement: Progression de difficulté préservée

Le tournoi de référence joué en mode capitales SHALL conserver un nombre de victoires strictement
croissant de facile à normal à difficile.

#### Scenario: Tournoi en mode capitales

- **WHEN** on joue 60 parties à trois joueurs (facile, normal, difficile) en mode capitales sur 60 graines fixées, chaque ordre de jeu étant représenté également
- **THEN** le nombre de victoires est strictement croissant de facile à normal à difficile
