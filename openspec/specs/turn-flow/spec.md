# turn-flow Specification

## Purpose

Orchestrer une partie : phases d'un tour, passage d'un joueur à l'autre, validation des actions,
événements produits, déterminisme, sérialisation, élimination et victoire.

## Requirements

### Requirement: Phases d'un tour

Le tour d'un joueur SHALL enchaîner les phases renforts, attaque puis fortification. Un déplacement
après conquête SHALL s'intercaler dans la phase d'attaque après chaque conquête, et un échange forcé
après élimination SHALL s'y intercaler quand la règle des cartes l'exige. Le joueur neutre SHALL NOT
avoir de tour.

#### Scenario: Passage automatique en attaque

- **WHEN** le joueur courant a déployé tous ses renforts et n'est plus tenu d'échanger des cartes
- **THEN** la partie passe en phase d'attaque

#### Scenario: Fin de l'attaque

- **WHEN** le joueur courant met fin à ses attaques
- **THEN** la partie passe en phase de fortification

#### Scenario: Fin du tour

- **WHEN** le joueur courant effectue sa fortification ou y renonce
- **THEN** le tour passe au joueur non neutre et non éliminé suivant, en phase de renforts

#### Scenario: Neutre sauté

- **WHEN** dans une partie à 2 joueurs le tour du second joueur se termine
- **THEN** c'est de nouveau au premier joueur de jouer, le neutre est sauté

### Requirement: Validation des actions

Toute action SHALL être validée contre l'état courant : bon joueur, bonne phase, paramètres conformes
aux règles. Une action invalide SHALL être rejetée avec un code d'erreur identifiable et un message,
sans modifier l'état. Une action valide SHALL produire un nouvel état sans modifier l'état d'entrée.

#### Scenario: Action hors tour

- **WHEN** un joueur qui n'est pas le joueur courant soumet une action
- **THEN** l'action est rejetée avec un code d'erreur « pas votre tour »

#### Scenario: Action hors phase

- **WHEN** le joueur courant soumet une attaque pendant la phase de renforts
- **THEN** l'action est rejetée avec un code d'erreur « mauvaise phase »

#### Scenario: Immutabilité de l'état d'entrée

- **WHEN** une action valide est appliquée à un état
- **THEN** l'état d'entrée est strictement identique à ce qu'il était avant l'appel

### Requirement: Événements

Chaque action valide SHALL produire la liste ordonnée des événements qu'elle a causés (renforts
déployés, cartes échangées, lancer de dés avec ses résultats, territoire conquis, joueur éliminé,
carte piochée, fortification, début de tour, victoire), suffisante pour reconstituer un journal et
animer le plateau.

#### Scenario: Événements d'une conquête

- **WHEN** une attaque élimine la dernière armée défendant un territoire
- **THEN** les événements contiennent, dans l'ordre, le lancer de dés puis la conquête du territoire

### Requirement: Déterminisme

Tout tirage aléatoire SHALL provenir d'un générateur pseudo-aléatoire initialisé par la graine de la
partie et dont l'état est stocké dans l'état de jeu. Deux parties créées avec la même graine et les
mêmes joueurs et réglages, auxquelles on applique la même suite d'actions, SHALL aboutir au même état.

#### Scenario: Rejouer une partie

- **WHEN** on rejoue la même suite d'actions sur deux parties créées avec la même graine
- **THEN** les deux états finaux sont égaux, lancers de dés et pioches compris

### Requirement: Sérialisation

L'état de jeu SHALL être sérialisable en JSON sans perte : une partie sérialisée puis désérialisée
SHALL se poursuivre exactement comme l'originale.

#### Scenario: Reprise après sérialisation

- **WHEN** on sérialise un état en JSON, on le désérialise, puis on applique la même action aux deux versions
- **THEN** les deux états résultants sont égaux

### Requirement: Élimination

Un joueur qui ne possède plus aucun territoire SHALL être éliminé : il ne joue plus et ses cartes
passent au joueur qui l'a éliminé.

#### Scenario: Élimination d'un joueur

- **WHEN** un joueur perd son dernier territoire
- **THEN** il est marqué éliminé, un événement d'élimination est produit et l'attaquant reçoit ses cartes

### Requirement: Victoire

La partie SHALL se terminer dès qu'il ne reste qu'un seul joueur non neutre non éliminé, déclaré
vainqueur. Aucune action de jeu ne SHALL être acceptée ensuite.

#### Scenario: Victoire à trois joueurs

- **WHEN** le dernier adversaire d'un joueur est éliminé
- **THEN** la partie est terminée, le joueur est déclaré vainqueur et un événement de victoire est produit

#### Scenario: Victoire à deux joueurs malgré le neutre

- **WHEN** dans une partie à 2 joueurs l'adversaire est éliminé alors que le neutre possède encore des territoires
- **THEN** la partie est terminée et le joueur restant est vainqueur

#### Scenario: Action après la fin

- **WHEN** une action est soumise sur une partie terminée
- **THEN** elle est rejetée avec un code d'erreur « partie terminée »
