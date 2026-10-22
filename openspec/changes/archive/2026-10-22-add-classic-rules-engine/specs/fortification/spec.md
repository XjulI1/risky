# Spec Delta

## Purpose

Permettre au joueur, en fin de tour, de déplacer une fois des armées entre deux de ses territoires,
selon le mode de fortification choisi à la création de la partie.

## ADDED Requirements

### Requirement: Fortification unique

Pendant la phase de fortification, le joueur SHALL pouvoir effectuer un seul déplacement d'armées
d'un de ses territoires vers un autre de ses territoires, en laissant au moins une armée sur le
territoire d'origine, ou y renoncer. Dans les deux cas, son tour se termine.

#### Scenario: Fortification valide

- **WHEN** le joueur déplace 4 armées d'un territoire de 6 armées vers un territoire voisin qu'il possède
- **THEN** l'origine passe à 2 armées, la destination gagne 4 armées et le tour passe au joueur suivant

#### Scenario: Origine vidée

- **WHEN** le joueur tente de déplacer toutes les armées du territoire d'origine
- **THEN** l'action est rejetée

#### Scenario: Destination adverse

- **WHEN** le joueur tente de fortifier vers un territoire qu'il ne possède pas
- **THEN** l'action est rejetée

### Requirement: Mode adjacent

En mode adjacent, la destination SHALL être adjacente au territoire d'origine.

#### Scenario: Destination non adjacente en mode adjacent

- **WHEN** en mode adjacent le joueur fortifie vers un de ses territoires non adjacent à l'origine
- **THEN** l'action est rejetée

### Requirement: Mode chemin connexe

En mode chemin connexe, la destination SHALL être reliée à l'origine par une chaîne de territoires
adjacents appartenant tous au joueur.

#### Scenario: Chemin connexe valide

- **WHEN** en mode chemin connexe le joueur fortifie vers un territoire relié à l'origine par ses propres territoires
- **THEN** le déplacement est accepté

#### Scenario: Chemin coupé par un adversaire

- **WHEN** en mode chemin connexe la seule liaison entre l'origine et la destination passe par un territoire adverse
- **THEN** l'action est rejetée
