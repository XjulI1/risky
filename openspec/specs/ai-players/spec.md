# ai-players Specification

## Purpose

Permettre d'affronter des adversaires contrôlés par l'ordinateur : les déclarer à la création de la
partie, les laisser jouer leur tour seuls, de façon lisible, légale et sans accès à l'information
cachée.

## Requirements

### Requirement: Déclaration des joueurs IA

Le formulaire de création SHALL permettre de choisir pour chaque joueur le type « Humain » ou « IA »,
et un niveau unique, parmi facile, normal et difficile, commun à toutes les IA de la partie. Par
défaut, le premier joueur SHALL être humain et les autres des IA, au niveau normal. Une partie sans
aucun humain SHALL être autorisée et se dérouler sans intervention.

#### Scenario: Valeurs par défaut

- **WHEN** l'écran de création s'ouvre
- **THEN** le joueur 1 est humain et les joueurs 2 et 3 sont des IA de niveau normal

#### Scenario: Niveau commun

- **WHEN** l'utilisateur choisit le niveau difficile, puis transforme un joueur humain en IA et ajoute un joueur
- **THEN** toutes les IA de la partie, y compris ces deux joueurs, sont de niveau difficile

#### Scenario: Partie entre IA

- **WHEN** l'utilisateur lance une partie dont tous les joueurs sont des IA
- **THEN** la partie se déroule seule jusqu'à la victoire et l'utilisateur peut la regarder

### Requirement: Noms des IA

Chaque IA SHALL recevoir un nom tiré au hasard dans une liste prédéfinie d'une vingtaine de
personnages historiques liés à l'armée, aux batailles ou à la guerre. Deux joueurs d'une même partie
SHALL NOT porter le même nom. Un joueur humain SHALL garder un nom numéroté (« Joueur 2 »), et le nom
de chaque joueur SHALL rester modifiable.

#### Scenario: Noms distincts

- **WHEN** l'écran de création s'ouvre, puis l'utilisateur ajoute trois joueurs
- **THEN** chaque IA porte un nom de la liste et aucun nom n'est porté par deux joueurs

#### Scenario: Changement de type

- **WHEN** l'utilisateur transforme un joueur humain en IA
- **THEN** ce joueur reçoit un nom de la liste qu'aucun autre joueur ne porte

#### Scenario: Retour à un humain

- **WHEN** l'utilisateur transforme en humain l'IA du joueur 2
- **THEN** ce joueur s'appelle « Joueur 2 »

### Requirement: Tour automatique

Quand le joueur courant est une IA, ses actions SHALL être choisies et soumises automatiquement, une
par une, par le même point d'entrée que les actions humaines, jusqu'à la fin de son tour. Cela
SHALL s'appliquer aussi à la revendication, au placement initial, au déplacement après conquête et
aux échanges obligatoires. Aucune commande de jeu ne SHALL être proposée à l'humain pendant le tour
d'une IA.

#### Scenario: Enchaînement d'un tour

- **WHEN** le tour passe à une IA
- **THEN** elle échange si nécessaire, déploie toute sa réserve, attaque, fortifie ou passe, puis le tour passe au joueur suivant sans action de l'humain

#### Scenario: Commandes masquées

- **WHEN** une IA joue son tour
- **THEN** le HUD indique « <nom> réfléchit… » et ne propose aucune commande de jeu

### Requirement: Rythme lisible

Les actions d'une IA SHALL être espacées selon la vitesse d'animation choisie, et chaque attaque
SHALL mettre en avant son origine et sa cible sur le plateau avant le lancer. En vitesse
instantanée, le tour d'une IA SHALL s'afficher sans pause.

#### Scenario: Attaque d'une IA visible

- **WHEN** une IA attaque en vitesse normale
- **THEN** son territoire d'origine et sa cible sont mis en avant avant que les dés ne soient lancés

### Requirement: Information visible uniquement

Les décisions d'une IA SHALL dépendre uniquement de l'information publique (propriétaires, armées,
nombre de cartes de chaque joueur, nombre d'échanges, réglages) et de sa propre main. L'ordre de la
pioche, les mains adverses et l'état du générateur aléatoire de la partie SHALL NOT influencer ses
décisions.

#### Scenario: Mains adverses différentes

- **WHEN** on présente à une IA deux états identiques sauf le contenu de la main d'un adversaire, à nombre de cartes égal
- **THEN** l'IA choisit la même action dans les deux cas

#### Scenario: Pioche différente

- **WHEN** on présente à une IA deux états identiques sauf l'ordre de la pioche et l'état du générateur de la partie
- **THEN** l'IA choisit la même action dans les deux cas

### Requirement: Décisions déterministes

Pour un même état visible, une IA d'un niveau donné SHALL toujours choisir la même action, de sorte
qu'une partie entre IA créée avec la même graine se rejoue à l'identique.

#### Scenario: Partie entre IA rejouée

- **WHEN** on joue deux fois une partie entre IA avec la même graine et les mêmes niveaux
- **THEN** les deux parties produisent la même suite d'actions et le même vainqueur

### Requirement: Légalité et terminaison

Une IA SHALL NOT soumettre d'action rejetée par le moteur. Son tour SHALL se terminer en un nombre
borné d'actions, et une décision SHALL être prise en moins de 50 ms sur un ordinateur portable récent.

#### Scenario: Aucune action rejetée

- **WHEN** on joue 100 parties entre IA de niveaux mélangés, de 2 à 6 joueurs, avec des graines et des réglages variés
- **THEN** aucune action n'est rejetée par le moteur et toutes les parties se terminent par une victoire
