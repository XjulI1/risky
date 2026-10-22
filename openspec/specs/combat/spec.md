# combat Specification

## Purpose

Résoudre les attaques entre territoires adjacents : chaque attaque enchaîne les lancers de dés
jusqu'à la conquête du territoire ou l'épuisement de l'attaquant, puis gère le déplacement
obligatoire qui suit une conquête.

## Requirements

### Requirement: Conditions d'attaque

Pendant la phase d'attaque, le joueur SHALL pouvoir attaquer depuis un de ses territoires comptant au
moins 2 armées vers un territoire adjacent appartenant à un autre joueur (neutre compris). Il SHALL
pouvoir enchaîner autant d'attaques qu'il le souhaite.

#### Scenario: Territoire d'origine trop faible

- **WHEN** le joueur attaque depuis un territoire qui n'a qu'une armée
- **THEN** l'action est rejetée

#### Scenario: Cible non adjacente

- **WHEN** le joueur attaque un territoire non adjacent à son territoire d'origine
- **THEN** l'action est rejetée

#### Scenario: Cible alliée

- **WHEN** le joueur attaque un de ses propres territoires
- **THEN** l'action est rejetée

### Requirement: Attaque menée jusqu'au bout

Une attaque SHALL enchaîner des lancers jusqu'à ce que le territoire défendu n'ait plus d'armée ou que
le territoire d'origine n'ait plus qu'une armée. Le joueur SHALL NOT pouvoir l'interrompre ni choisir
son nombre de dés. Chaque lancer SHALL produire son propre événement, dans l'ordre.

#### Scenario: Attaque victorieuse

- **WHEN** le joueur attaque et que le défenseur perd toutes ses armées
- **THEN** le territoire est conquis et la partie attend le déplacement après conquête

#### Scenario: Attaque épuisée

- **WHEN** le joueur attaque et que son territoire d'origine tombe à une armée
- **THEN** l'attaque s'arrête, le territoire défendu reste à son propriétaire et la partie reste en phase d'attaque

#### Scenario: Un événement par lancer

- **WHEN** une attaque nécessite 4 lancers
- **THEN** 4 événements de lancer de dés sont produits, dans l'ordre

### Requirement: Nombre de dés

À chaque lancer, l'attaquant SHALL lancer le minimum entre le maximum de dés en attaque du réglage et
(armées du territoire d'origine − 1). Le défenseur SHALL lancer le minimum entre le maximum de dés en
défense du réglage et le nombre d'armées du territoire défendu. Le nombre de dés SHALL être recalculé
avant chaque lancer.

#### Scenario: Dés de l'attaquant réduits en cours d'attaque

- **WHEN** au cours d'une attaque le territoire d'origine passe de 4 à 3 armées
- **THEN** l'attaquant lance 3 dés tant qu'il a 4 armées, puis 2 dés

#### Scenario: Défense limitée par les armées

- **WHEN** le territoire défendu n'a qu'une armée et que le réglage autorise 2 dés en défense
- **THEN** le défenseur lance 1 dé

#### Scenario: Réglage de défense à trois dés

- **WHEN** le réglage autorise 3 dés en défense et que le territoire défendu a 5 armées
- **THEN** le défenseur lance 3 dés

### Requirement: Résolution d'un lancer

Les dés de chaque camp SHALL être triés par ordre décroissant puis comparés paire par paire, sur le
nombre de dés du camp qui en a le moins. Pour chaque paire, le camp au résultat le plus faible perd
une armée ; en cas d'égalité, l'attaquant perd.

#### Scenario: Attaquant gagne deux paires

- **WHEN** l'attaquant obtient 6, 5, 1 et le défenseur 4, 4
- **THEN** le défenseur perd 2 armées et l'attaquant aucune

#### Scenario: Égalité en faveur du défenseur

- **WHEN** l'attaquant obtient 5, 3 et le défenseur 5, 2
- **THEN** chaque camp perd 1 armée

#### Scenario: Une seule paire comparée

- **WHEN** l'attaquant lance 3 dés et le défenseur 1 dé
- **THEN** une seule paire est comparée et une seule armée est perdue au total

### Requirement: Conquête et déplacement obligatoire

Quand le territoire défendu n'a plus d'armée, l'attaquant en SHALL devenir propriétaire et la partie
SHALL attendre un déplacement d'au moins le nombre de dés lancés au dernier lancer et d'au plus
(armées du territoire d'origine − 1). Aucune autre action ne SHALL être acceptée avant ce déplacement.

#### Scenario: Déplacement minimal

- **WHEN** le joueur conquiert un territoire avec un dernier lancer à 3 dés et qu'il reste 8 armées sur son territoire d'origine
- **THEN** il doit déplacer entre 3 et 7 armées vers le territoire conquis

#### Scenario: Déplacement insuffisant

- **WHEN** après une conquête avec 3 dés le joueur ne déplace que 2 armées
- **THEN** l'action est rejetée

#### Scenario: Autre action avant le déplacement

- **WHEN** après une conquête le joueur tente une nouvelle attaque sans avoir déplacé ses armées
- **THEN** l'action est rejetée
