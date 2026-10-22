# Spec Delta

## Purpose

Créer une partie de Risk prête à jouer : joueurs, armée neutre à deux joueurs, réglages, armées
initiales, répartition des territoires (aléatoire ou au choix) et placement des armées restantes.

## ADDED Requirements

### Requirement: Création d'une partie

Le moteur SHALL créer une partie à partir d'une liste de 2 à 6 joueurs (chacun avec un identifiant,
un nom, une couleur et un type humain ou IA), d'une graine aléatoire et de réglages optionnels. Une
configuration invalide SHALL être refusée avec une erreur explicite.

#### Scenario: Partie valide

- **WHEN** on crée une partie avec 4 joueurs et une graine
- **THEN** la partie contient ces 4 joueurs dans l'ordre fourni et une pioche de cartes mélangée

#### Scenario: Nombre de joueurs invalide

- **WHEN** on crée une partie avec 1 joueur ou avec 7 joueurs
- **THEN** la création échoue avec une erreur indiquant le nombre de joueurs attendu

#### Scenario: Identifiants ou couleurs en double

- **WHEN** deux joueurs partagent le même identifiant ou la même couleur
- **THEN** la création échoue avec une erreur explicite

### Requirement: Réglages de partie

Une partie SHALL porter les réglages suivants, figés à la création, avec ces valeurs par défaut :

| Réglage | Valeurs | Défaut |
|---|---|---|
| Répartition des territoires | aléatoire, au choix des joueurs | aléatoire |
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

### Requirement: Armée neutre à deux joueurs

À 2 joueurs, le moteur SHALL ajouter un joueur neutre. Le neutre SHALL posséder des territoires et
défendre normalement, mais SHALL NOT jouer de tour, recevoir de renforts ni de cartes. Il SHALL NOT
compter pour la victoire. Ses 14 territoires SHALL être tirés au hasard et ses armées SHALL être
réparties au hasard sur ses territoires dès la création, quel que soit le mode de répartition.

#### Scenario: Neutre ajouté à deux joueurs

- **WHEN** on crée une partie avec 2 joueurs
- **THEN** la partie contient en plus un joueur neutre qui possède 14 territoires portant au total 40 armées

#### Scenario: Pas de neutre à trois joueurs et plus

- **WHEN** on crée une partie avec 3 joueurs
- **THEN** la partie ne contient pas de joueur neutre

### Requirement: Armées initiales

Chaque joueur, neutre compris, SHALL disposer d'un nombre d'armées initiales fonction du nombre de
joueurs non neutres : 40 à 2, 35 à 3, 30 à 4, 25 à 5, 20 à 6.

#### Scenario: Armées initiales à cinq joueurs

- **WHEN** on crée une partie à 5 joueurs et que la mise en place est terminée
- **THEN** chaque joueur a exactement 25 armées sur le plateau

#### Scenario: Armées initiales à deux joueurs

- **WHEN** on crée une partie à 2 joueurs et que la mise en place est terminée
- **THEN** chacun des 2 joueurs et le neutre a exactement 40 armées sur le plateau

### Requirement: Premier joueur

Le premier joueur SHALL être tiré au sort parmi les joueurs non neutres à l'aide de la graine ;
l'ordre de jeu suit ensuite l'ordre de la liste, de façon circulaire. Cet ordre s'applique à la mise
en place comme au jeu.

#### Scenario: Tirage déterministe

- **WHEN** on crée deux parties avec la même graine et les mêmes joueurs
- **THEN** le premier joueur est le même dans les deux parties

### Requirement: Répartition aléatoire des territoires

En répartition aléatoire, la création SHALL distribuer au hasard les territoires restants (hors
neutre) entre les joueurs non neutres, à parts aussi égales que possible, avec une armée sur chacun,
puis ouvrir la phase de placement.

#### Scenario: Tous les territoires occupés

- **WHEN** on crée une partie en répartition aléatoire
- **THEN** chacun des 42 territoires a un propriétaire et au moins une armée

#### Scenario: Répartition équilibrée

- **WHEN** on crée une partie à 4 joueurs en répartition aléatoire
- **THEN** chaque joueur possède 10 ou 11 territoires

#### Scenario: Ouverture du placement

- **WHEN** on crée une partie en répartition aléatoire
- **THEN** la partie est en phase de placement, au tour du premier joueur

### Requirement: Répartition des territoires au choix

En répartition au choix, la partie SHALL commencer par une phase de revendication où, à tour de rôle
à partir du premier joueur, chaque joueur non neutre choisit un territoire libre et y place une
armée. Quand tous les territoires sont pris, la phase de placement SHALL s'ouvrir.

#### Scenario: Revendication d'un territoire libre

- **WHEN** le joueur courant revendique un territoire libre pendant la revendication
- **THEN** il en devient propriétaire avec une armée et la main passe au joueur suivant

#### Scenario: Revendication d'un territoire déjà pris

- **WHEN** le joueur courant revendique un territoire qui a déjà un propriétaire
- **THEN** l'action est refusée et l'état est inchangé

#### Scenario: Passage au placement

- **WHEN** le dernier territoire libre est revendiqué
- **THEN** la partie passe en phase de placement

### Requirement: Placement des armées restantes

Pendant la phase de placement, chaque joueur non neutre SHALL, à tour de rôle à partir du premier
joueur, placer une armée sur un de ses territoires, jusqu'à épuisement de ses armées initiales. La
partie passe ensuite en phase de renforts du premier joueur.

#### Scenario: Placement sur un territoire adverse

- **WHEN** pendant le placement le joueur courant place une armée sur un territoire qu'il ne possède pas
- **THEN** l'action est refusée

#### Scenario: Joueur sans armée restante

- **WHEN** pendant le placement un joueur a déjà placé toutes ses armées initiales
- **THEN** son tour est sauté jusqu'à la fin du placement

#### Scenario: Fin de la mise en place

- **WHEN** tous les joueurs ont placé toutes leurs armées initiales
- **THEN** la partie passe en phase de renforts du premier joueur
