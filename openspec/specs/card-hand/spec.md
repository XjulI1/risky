# card-hand Specification

## Purpose

Montrer au joueur ses cartes territoire, l'aider à former une série valide et à l'échanger au bon
moment, y compris lors des échanges obligatoires.

## Requirements

### Requirement: Affichage de la main

Le HUD SHALL afficher la main du joueur courant humain : pour chaque carte, son symbole et le nom
de son territoire (ou « Joker »), avec une marque sur les cartes dont le territoire lui appartient.
Les cartes des autres joueurs SHALL NOT être visibles, seul leur nombre l'est.

#### Scenario: Carte d'un territoire possédé

- **WHEN** Alice possède le Pérou et détient la carte Pérou
- **THEN** la carte Pérou est marquée comme donnant un bonus de territoire

#### Scenario: Main adverse cachée

- **WHEN** c'est le tour d'Alice et que Bob détient 3 cartes
- **THEN** le HUD indique que Bob a 3 cartes sans montrer lesquelles

### Requirement: Composition d'une série

Pendant sa phase de renforts, le joueur SHALL pouvoir sélectionner 3 cartes ; le bouton « Échanger »
SHALL n'être actif que si la sélection forme une série valide, et SHALL afficher le nombre d'armées
qu'elle rapporte selon le barème de la partie, bonus de territoire compris. Une suggestion SHALL
présélectionner la série la plus avantageuse.

#### Scenario: Série valide

- **WHEN** le joueur sélectionne un fantassin, un cavalier et une artillerie au premier échange de la partie en barème progressif
- **THEN** le bouton affiche « Échanger (+4) » et il est actif

#### Scenario: Série invalide

- **WHEN** le joueur sélectionne deux fantassins et un cavalier
- **THEN** le bouton « Échanger » est inactif

#### Scenario: Suggestion

- **WHEN** le joueur ouvre sa main et qu'au moins une série valide existe
- **THEN** la série rapportant le plus d'armées est présélectionnée

### Requirement: Échange obligatoire

Quand le moteur impose un échange (5 cartes ou plus en début de renforts, ou 6 cartes ou plus après
une élimination), la main SHALL s'ouvrir automatiquement avec un message expliquant l'obligation, et
aucune autre action ne SHALL être proposée tant que l'échange n'est pas fait.

#### Scenario: Cinq cartes en début de tour

- **WHEN** Alice commence ses renforts avec 5 cartes
- **THEN** sa main s'ouvre avec le message « Vous devez échanger une série » et le déploiement n'est pas proposé avant l'échange

#### Scenario: Après une élimination

- **WHEN** Alice élimine Bob et détient ensuite 7 cartes
- **THEN** sa main s'ouvre pour l'échange obligatoire avant de reprendre les attaques

### Requirement: Carte piochée

À la fin d'un tour où il a conquis au moins un territoire, le joueur humain SHALL voir la carte
qu'il vient de piocher.

#### Scenario: Pioche montrée

- **WHEN** Alice termine un tour avec au moins une conquête
- **THEN** la carte piochée lui est montrée brièvement avant le passage au joueur suivant
