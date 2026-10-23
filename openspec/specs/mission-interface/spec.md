# mission-interface Specification

## Purpose

Permettre d'activer les missions secrètes, de consulter sa mission et sa progression sans la
dévoiler aux autres, et révéler toutes les missions en fin de partie.

## Requirements

### Requirement: Option à la création

Le formulaire de création SHALL proposer l'option « Missions secrètes », décochée par défaut, et
désactivée avec la mention « 3 joueurs minimum » quand la liste compte 2 joueurs.

#### Scenario: Deux joueurs

- **WHEN** la liste compte 2 joueurs
- **THEN** l'option est désactivée et décochée, avec la mention « 3 joueurs minimum »

#### Scenario: Passage à deux joueurs

- **WHEN** l'option est cochée avec 3 joueurs et que l'utilisateur retire un joueur
- **THEN** l'option est décochée et désactivée

### Requirement: Consultation de sa mission

Dans une partie avec missions, le HUD SHALL offrir au joueur humain courant un bouton « Ma mission »
qui affiche le texte de sa mission et sa progression : territoires possédés par continent exigé,
nombre de territoires (et de territoires à 2 armées ou plus) pour les missions chiffrées, nombre de
territoires restants de la cible pour une mission d'élimination. Pendant le tour d'une IA, le bouton
SHALL montrer la mission du premier joueur humain si la partie n'en compte qu'un, et SHALL être
masqué sinon.

#### Scenario: Progression d'une mission de continents

- **WHEN** la mission d'Alice est « Amérique du Nord et Afrique » et qu'elle possède 7 territoires d'Amérique du Nord et 4 d'Afrique
- **THEN** « Ma mission » affiche « Amérique du Nord 7/9 » et « Afrique 4/6 »

#### Scenario: Un seul humain

- **WHEN** Alice est le seul humain et qu'une IA joue
- **THEN** Alice peut toujours consulter sa mission

### Requirement: Conversion notifiée en privé

Quand la mission d'un joueur humain est convertie, il SHALL en être informé au début de son prochain
tour (après l'écran de passage de main s'il existe) par le message « Votre cible a été éliminée par un
autre joueur : votre mission devient Conquérir 24 territoires ». Le journal SHALL NOT mentionner la
conversion.

#### Scenario: Message de conversion

- **WHEN** la mission d'Alice, humaine, est convertie pendant le tour d'une IA
- **THEN** le message s'affiche au début du tour suivant d'Alice et le journal ne contient aucune entrée à ce sujet

### Requirement: Fin de partie avec missions

L'écran de fin SHALL indiquer le motif de la victoire (« en accomplissant sa mission : <texte> » ou
« en éliminant tous ses adversaires ») et SHALL révéler la mission de chaque joueur. Le journal SHALL
contenir « <joueur> accomplit sa mission : <texte> ».

#### Scenario: Victoire par mission

- **WHEN** Alice gagne en accomplissant « Conquérir 24 territoires »
- **THEN** l'écran de fin affiche « Alice remporte la partie en accomplissant sa mission : Conquérir 24 territoires » et la liste des missions de tous les joueurs
