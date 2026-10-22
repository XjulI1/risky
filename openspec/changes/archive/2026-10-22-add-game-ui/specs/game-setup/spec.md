# Spec Delta

## MODIFIED Requirements

### Requirement: Réglages de partie

Une partie SHALL porter les réglages suivants, figés à la création, avec ces valeurs par défaut :

| Réglage | Valeurs | Défaut |
|---|---|---|
| Répartition des territoires | aléatoire, au choix des joueurs | aléatoire |
| Placement des armées restantes | aléatoire, un par un | aléatoire |
| Barème d'échange des cartes | progressif, fixe | progressif |
| Dés maximum en attaque | 1 à 3 | 3 |
| Dés maximum en défense | 1 à 3 | 2 |
| Fortification | chemin connexe, adjacente | chemin connexe |

#### Scenario: Réglages par défaut

- **WHEN** on crée une partie sans fournir de réglages
- **THEN** la partie porte les valeurs par défaut du tableau

#### Scenario: Réglage partiel

- **WHEN** on crée une partie en fournissant uniquement la fortification adjacente
- **THEN** la fortification vaut « adjacente » et les autres réglages leurs valeurs par défaut

#### Scenario: Réglage hors bornes

- **WHEN** on crée une partie avec 4 dés maximum en attaque
- **THEN** la création échoue avec une erreur explicite

### Requirement: Répartition aléatoire des territoires

En répartition aléatoire, la création SHALL distribuer au hasard les territoires restants (hors
neutre) entre les joueurs non neutres, à parts aussi égales que possible, avec une armée sur chacun,
puis passer au placement des armées restantes.

#### Scenario: Tous les territoires occupés

- **WHEN** on crée une partie en répartition aléatoire
- **THEN** chacun des 42 territoires a un propriétaire et au moins une armée

#### Scenario: Répartition équilibrée

- **WHEN** on crée une partie à 4 joueurs en répartition aléatoire
- **THEN** chaque joueur possède 10 ou 11 territoires

#### Scenario: Ouverture du placement

- **WHEN** on crée une partie en répartition aléatoire avec le placement des armées un par un
- **THEN** la partie est en phase de placement, au tour du premier joueur

#### Scenario: Placement aléatoire immédiat

- **WHEN** on crée une partie en répartition aléatoire avec le placement des armées aléatoire
- **THEN** toutes les armées initiales sont déjà sur le plateau et la partie est en phase de renforts du premier joueur

### Requirement: Répartition des territoires au choix

En répartition au choix, la partie SHALL commencer par une phase de revendication où, à tour de rôle
à partir du premier joueur, chaque joueur non neutre choisit un territoire libre et y place une
armée. Quand tous les territoires sont pris, la partie SHALL passer au placement des armées
restantes.

#### Scenario: Revendication d'un territoire libre

- **WHEN** le joueur courant revendique un territoire libre pendant la revendication
- **THEN** il en devient propriétaire avec une armée et la main passe au joueur suivant

#### Scenario: Revendication d'un territoire déjà pris

- **WHEN** le joueur courant revendique un territoire qui a déjà un propriétaire
- **THEN** l'action est refusée et l'état est inchangé

#### Scenario: Passage au placement

- **WHEN** le dernier territoire libre est revendiqué avec le placement des armées un par un
- **THEN** la partie passe en phase de placement

#### Scenario: Placement aléatoire après la revendication

- **WHEN** le dernier territoire libre est revendiqué avec le placement des armées aléatoire
- **THEN** les armées restantes de chaque joueur sont réparties au hasard sur ses territoires et la partie passe en phase de renforts du premier joueur

### Requirement: Placement des armées restantes

En placement aléatoire, les armées initiales restantes de chaque joueur non neutre SHALL être
réparties au hasard, une à une, sur ses territoires, puis la partie SHALL passer en phase de
renforts du premier joueur. En placement un par un, chaque joueur non neutre SHALL, à tour de rôle à
partir du premier joueur, placer une armée sur un de ses territoires, jusqu'à épuisement de ses
armées initiales, puis la partie passe en phase de renforts du premier joueur.

#### Scenario: Armées initiales exactes en placement aléatoire

- **WHEN** on crée une partie à 5 joueurs avec le placement des armées aléatoire
- **THEN** chaque joueur a exactement 25 armées sur le plateau

#### Scenario: Placement aléatoire déterministe

- **WHEN** on crée deux parties avec le placement des armées aléatoire, la même graine et les mêmes joueurs
- **THEN** les armées sont réparties à l'identique dans les deux parties

#### Scenario: Placement sur un territoire adverse

- **WHEN** pendant le placement un par un le joueur courant place une armée sur un territoire qu'il ne possède pas
- **THEN** l'action est refusée

#### Scenario: Joueur sans armée restante

- **WHEN** pendant le placement un par un un joueur a déjà placé toutes ses armées initiales
- **THEN** son tour est sauté jusqu'à la fin du placement

#### Scenario: Fin de la mise en place

- **WHEN** tous les joueurs ont placé toutes leurs armées initiales
- **THEN** la partie passe en phase de renforts du premier joueur
