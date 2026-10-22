# Spec Delta

## Purpose

Gérer les cartes territoire : composition du paquet, pioche après une conquête, séries échangeables
contre des armées selon le barème choisi, et échanges obligatoires.

## ADDED Requirements

### Requirement: Paquet de cartes

Le paquet SHALL contenir 44 cartes : une carte par territoire, portant un symbole (fantassin, cavalier
ou artillerie) avec 14 cartes de chaque symbole, plus 2 jokers sans territoire. Il SHALL être mélangé
à la création de la partie. Quand la pioche est vide, la défausse SHALL être mélangée pour former
une nouvelle pioche.

#### Scenario: Composition

- **WHEN** on crée une partie
- **THEN** la pioche contient 44 cartes : 14 fantassins, 14 cavaliers, 14 artilleries et 2 jokers, chaque territoire figurant sur exactement une carte

#### Scenario: Pioche vide

- **WHEN** un joueur doit piocher alors que la pioche est vide et que la défausse contient des cartes
- **THEN** la défausse est mélangée pour reformer la pioche et le joueur pioche

### Requirement: Pioche après conquête

Un joueur ayant conquis au moins un territoire pendant son tour SHALL piocher exactement une carte à
la fin de ce tour, quel que soit le nombre de conquêtes.

#### Scenario: Plusieurs conquêtes

- **WHEN** un joueur conquiert 3 territoires dans le même tour puis termine son tour
- **THEN** il pioche une seule carte

#### Scenario: Aucune conquête

- **WHEN** un joueur termine son tour sans avoir conquis de territoire
- **THEN** il ne pioche pas de carte

### Requirement: Séries valides

Une série SHALL être composée de 3 cartes : trois symboles identiques, trois symboles différents, ou
deux cartes quelconques et un joker. Toute autre combinaison SHALL être refusée.

#### Scenario: Série de trois symboles différents

- **WHEN** le joueur échange un fantassin, un cavalier et une artillerie
- **THEN** l'échange est accepté

#### Scenario: Série invalide

- **WHEN** le joueur échange deux fantassins et un cavalier, sans joker
- **THEN** l'action est rejetée

### Requirement: Moment de l'échange

Un joueur SHALL pouvoir échanger une série pendant sa phase de renforts. Il SHALL être obligé
d'échanger tant qu'il détient 5 cartes ou plus. Les armées obtenues s'ajoutent à sa réserve. Les
cartes échangées vont à la défausse.

#### Scenario: Échange forcé à cinq cartes

- **WHEN** un joueur commence sa phase de renforts avec 5 cartes
- **THEN** la partie ne passe pas en phase d'attaque tant qu'il n'a pas échangé une série, même si sa réserve est vide

#### Scenario: Échange hors phase de renforts

- **WHEN** un joueur tente d'échanger une série pendant sa phase de fortification
- **THEN** l'action est rejetée

### Requirement: Barème progressif

En barème progressif, la valeur d'une série SHALL dépendre du nombre d'échanges déjà effectués dans
la partie, tous joueurs confondus : 4, 6, 8, 10, 12, 15, puis +5 à chaque échange suivant.

#### Scenario: Septième échange

- **WHEN** six échanges ont déjà eu lieu dans la partie et qu'un joueur échange une série
- **THEN** il reçoit 20 armées

### Requirement: Barème fixe

En barème fixe, la valeur d'une série SHALL dépendre de sa composition : 4 pour trois fantassins,
6 pour trois cavaliers, 8 pour trois artilleries, 10 pour trois symboles différents. Une série avec
joker SHALL valoir la meilleure valeur qu'elle permet de former.

#### Scenario: Trois artilleries

- **WHEN** en barème fixe le joueur échange trois artilleries
- **THEN** il reçoit 8 armées

#### Scenario: Série avec joker

- **WHEN** en barème fixe le joueur échange un fantassin, un cavalier et un joker
- **THEN** il reçoit 10 armées

### Requirement: Bonus de territoire

Si au moins une carte de la série désigne un territoire possédé par le joueur, 2 armées
supplémentaires SHALL être placées directement sur un seul de ces territoires, sans passer par la
réserve. Le territoire retenu SHALL être le premier, dans l'ordre des cartes fournies, qui est
adjacent à un territoire adverse ; à défaut, le premier de ces territoires dans l'ordre des cartes.

#### Scenario: Bonus accordé une seule fois

- **WHEN** le joueur échange une série dont deux cartes désignent des territoires qu'il possède
- **THEN** un seul de ces territoires reçoit 2 armées supplémentaires et la réserve n'augmente que de la valeur de la série

#### Scenario: Priorité à la frontière

- **WHEN** la première carte éligible désigne un territoire sans voisin adverse et la seconde un territoire voisin d'un adversaire
- **THEN** le bonus va au territoire voisin d'un adversaire

#### Scenario: Aucun territoire frontalier

- **WHEN** aucun des territoires éligibles n'a de voisin adverse
- **THEN** le bonus va au territoire de la première carte éligible

### Requirement: Échange forcé après élimination

Quand un joueur récupère les cartes d'un joueur éliminé et en détient alors 6 ou plus, il SHALL
échanger des séries immédiatement jusqu'à en détenir 4 ou moins, puis déployer aussitôt les armées
obtenues, avant de reprendre sa phase d'attaque.

#### Scenario: Récupération de cartes au-delà du seuil

- **WHEN** un joueur détenant 3 cartes élimine un adversaire qui en détenait 4
- **THEN** il doit échanger des séries jusqu'à n'avoir plus que 4 cartes ou moins, déployer les armées obtenues, puis reprend sa phase d'attaque

#### Scenario: Récupération sous le seuil

- **WHEN** un joueur détenant 1 carte élimine un adversaire qui en détenait 2
- **THEN** il détient 3 cartes et reste en phase d'attaque sans échange obligatoire
