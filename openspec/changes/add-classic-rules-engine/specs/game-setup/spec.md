# Spec Delta

## Purpose

Créer une partie de Risk prête à jouer : joueurs, armée neutre à deux joueurs, réglages, armées
initiales et répartition des territoires, en mode aléatoire ou manuel.

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
| Placement initial | aléatoire, manuel | aléatoire |
| Barème d'échange des cartes | progressif, fixe | progressif |
| Dés maximum en attaque | 1 à 3 | 3 |
| Dés maximum en défense | 1 à 3 | 2 |
| Fortification | adjacente, chemin connexe | adjacente |

#### Scenario: Réglages par défaut

- **WHEN** on crée une partie sans fournir de réglages
- **THEN** la partie porte les valeurs par défaut du tableau

#### Scenario: Réglage partiel

- **WHEN** on crée une partie en fournissant uniquement la fortification en chemin connexe
- **THEN** la fortification vaut « chemin connexe » et les autres réglages leurs valeurs par défaut

#### Scenario: Réglage hors bornes

- **WHEN** on crée une partie avec 4 dés maximum en attaque
- **THEN** la création échoue avec une erreur explicite

### Requirement: Armée neutre à deux joueurs

À 2 joueurs, le moteur SHALL ajouter un joueur neutre. Le neutre SHALL posséder des territoires et
défendre normalement, mais SHALL NOT jouer de tour, recevoir de renforts ni de cartes. Il SHALL NOT
compter pour la victoire.

#### Scenario: Neutre ajouté à deux joueurs

- **WHEN** on crée une partie avec 2 joueurs
- **THEN** la partie contient en plus un joueur neutre

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
l'ordre de jeu suit ensuite l'ordre de la liste, de façon circulaire.

#### Scenario: Tirage déterministe

- **WHEN** on crée deux parties avec la même graine et les mêmes joueurs
- **THEN** le premier joueur est le même dans les deux parties

### Requirement: Mise en place aléatoire

En placement aléatoire, la création SHALL produire directement une partie au début du premier tour :
les territoires sont distribués au hasard et à parts aussi égales que possible entre tous les joueurs
(neutre compris), chaque territoire reçoit une armée, puis les armées restantes de chaque joueur sont
réparties au hasard sur ses territoires.

#### Scenario: Tous les territoires occupés

- **WHEN** on crée une partie en placement aléatoire
- **THEN** chacun des 42 territoires a un propriétaire et au moins une armée

#### Scenario: Répartition équilibrée

- **WHEN** on crée une partie à 4 joueurs en placement aléatoire
- **THEN** chaque joueur possède 10 ou 11 territoires

#### Scenario: La partie démarre en phase de renforts

- **WHEN** on crée une partie en placement aléatoire
- **THEN** la partie est en phase de renforts du premier joueur

### Requirement: Mise en place manuelle

En placement manuel, la partie SHALL commencer par une phase de revendication où, à tour de rôle
à partir du premier joueur, chaque joueur non neutre choisit un territoire libre et y place une armée.
À 2 joueurs, le neutre SHALL recevoir 14 territoires tirés au hasard avant la revendication, et ses
armées restantes SHALL être réparties au hasard sur ses territoires. Quand tous les territoires sont
pris, une phase de placement SHALL suivre où chaque joueur, à tour de rôle, place une armée sur un de
ses territoires, jusqu'à épuisement de ses armées initiales. La partie passe alors en phase de
renforts du premier joueur.

#### Scenario: Revendication d'un territoire libre

- **WHEN** le joueur courant revendique un territoire libre pendant la revendication
- **THEN** il en devient propriétaire avec une armée et la main passe au joueur suivant

#### Scenario: Revendication d'un territoire déjà pris

- **WHEN** le joueur courant revendique un territoire qui a déjà un propriétaire
- **THEN** l'action est refusée et l'état est inchangé

#### Scenario: Passage au placement

- **WHEN** le dernier territoire libre est revendiqué
- **THEN** la partie passe en phase de placement

#### Scenario: Placement sur un territoire adverse

- **WHEN** pendant le placement le joueur courant place une armée sur un territoire qu'il ne possède pas
- **THEN** l'action est refusée

#### Scenario: Joueur sans armée restante

- **WHEN** pendant le placement un joueur a déjà placé toutes ses armées initiales
- **THEN** son tour est sauté jusqu'à la fin du placement

#### Scenario: Fin de la mise en place

- **WHEN** tous les joueurs ont placé toutes leurs armées initiales
- **THEN** la partie passe en phase de renforts du premier joueur
