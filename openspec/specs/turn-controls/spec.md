# turn-controls Specification

## Purpose

Guider le joueur pendant son tour : lui montrer où il en est, ne lui proposer que des actions
légales sur le plateau et dans le HUD, et transmettre ses choix au moteur.

## Requirements

### Requirement: Bandeau d'état

Le HUD SHALL afficher en permanence le joueur courant (nom et couleur), la phase courante en
français, la réserve d'armées quand elle existe, et pour chaque joueur son nombre de territoires,
d'armées et de cartes. Les joueurs éliminés SHALL apparaître barrés.

#### Scenario: Phase de renforts

- **WHEN** c'est le tour d'Alice en phase de renforts avec 7 armées en réserve
- **THEN** le HUD affiche « Alice — Renforts » et « 7 armées à placer »

#### Scenario: Joueur éliminé

- **WHEN** Bob est éliminé
- **THEN** Bob apparaît barré dans la liste des joueurs

### Requirement: Seules les actions légales sont proposées

À chaque étape, le plateau SHALL mettre en avant uniquement les territoires sur lesquels une action
légale est possible, et les boutons du HUD correspondant à une action illégale SHALL être désactivés.
Si le moteur rejette malgré tout une action, son message SHALL être affiché sans modifier l'état.

#### Scenario: Origines d'attaque

- **WHEN** la phase d'attaque commence
- **THEN** seuls les territoires du joueur ayant au moins 2 armées et un voisin adverse sont sélectionnables

#### Scenario: Rejet inattendu

- **WHEN** le moteur rejette une action
- **THEN** son message d'erreur s'affiche dans une notification et l'état affiché ne change pas

### Requirement: Mise en place

Pendant la revendication (répartition au choix), le joueur courant SHALL revendiquer un territoire
libre en le touchant. Pendant la phase de placement, quel que soit le mode de répartition, il SHALL
placer une armée en touchant un de ses territoires ; le HUD SHALL afficher le nombre d'armées qu'il
lui reste à placer.

#### Scenario: Revendication

- **WHEN** pendant la revendication le joueur courant touche un territoire libre
- **THEN** le territoire lui est attribué et la main passe au joueur suivant

#### Scenario: Placement après une répartition aléatoire

- **WHEN** une partie en répartition aléatoire démarre et que le joueur courant touche un de ses territoires
- **THEN** le territoire gagne une armée, le nombre d'armées restant à placer diminue de 1 et la main passe au joueur suivant

### Requirement: Déploiement des renforts

En phase de renforts, toucher un de ses territoires SHALL ouvrir un sélecteur de quantité entre 1 et
la réserve (1 par défaut, boutons + et −, raccourci « tout »). La validation SHALL déployer cette
quantité sur le territoire.

#### Scenario: Déployer trois armées

- **WHEN** le joueur touche son territoire, règle la quantité à 3 et valide
- **THEN** le territoire gagne 3 armées et la réserve diminue de 3

### Requirement: Parcours d'attaque

En phase d'attaque, toucher un territoire d'origine valide SHALL le sélectionner et marquer ses
voisins adverses comme cibles. Toucher une cible SHALL ouvrir un panneau de confirmation rappelant
l'origine, la cible et leurs armées, avec un bouton « Attaquer » qui lance l'attaque jusqu'au bout.
Toucher l'origine à nouveau ou l'océan SHALL annuler la sélection. Un bouton « Terminer les attaques » SHALL passer à la
fortification.

#### Scenario: Choix d'une cible

- **WHEN** le joueur touche son territoire de 5 armées voisin de deux territoires adverses
- **THEN** ce territoire est marqué sélectionné et les deux territoires adverses comme cibles

#### Scenario: Panneau d'attaque

- **WHEN** le joueur touche le Brésil (3 armées) depuis l'Afrique du Nord (5 armées)
- **THEN** le panneau affiche « Attaquer Brésil (3) depuis Afrique du Nord (5) » et le bouton « Attaquer »

#### Scenario: Annulation

- **WHEN** une origine est sélectionnée et que le joueur touche l'océan
- **THEN** la sélection est annulée et les origines possibles sont de nouveau mises en avant

#### Scenario: Attaque épuisée

- **WHEN** une attaque se termine sans conquête, l'origine n'ayant plus qu'une armée
- **THEN** la sélection est annulée et les origines possibles sont de nouveau mises en avant

### Requirement: Déplacement après conquête

Après une conquête, le HUD SHALL afficher un sélecteur borné par le minimum et le maximum imposés par
le moteur, réglé par défaut sur le maximum, et aucune autre action ne SHALL être proposée avant sa
validation.

#### Scenario: Déplacement par défaut

- **WHEN** le joueur conquiert un territoire et valide le sélecteur sans le modifier
- **THEN** le nombre maximal d'armées autorisé est déplacé

### Requirement: Parcours de fortification

En phase de fortification, toucher un de ses territoires d'au moins 2 armées SHALL marquer les
destinations valides selon le mode de fortification ; toucher une destination SHALL ouvrir un
sélecteur de quantité. Un bouton « Passer » SHALL terminer le tour sans fortifier.

#### Scenario: Destinations en mode adjacent

- **WHEN** en mode adjacent le joueur touche son territoire de 4 armées
- **THEN** seuls ses territoires voisins sont marqués comme destinations

#### Scenario: Passer

- **WHEN** le joueur touche « Passer »
- **THEN** le tour passe au joueur suivant

### Requirement: Passage de main entre humains

Quand le tour passe d'un humain à un autre humain, l'application SHALL afficher au centre de
l'écran une boîte « Au tour de <nom> », par-dessus un voile léger qui laisse voir le plateau et
l'interface. La main de cartes du nouveau joueur SHALL rester masquée et le plateau inactif jusqu'à
ce qu'il touche « Je suis prêt ». Cette boîte SHALL être omise quand un seul humain participe, ainsi
que pendant la revendication et le placement initial, où aucune information privée n'existe encore.

#### Scenario: Deux humains

- **WHEN** dans une partie entre Alice et Bob le tour d'Alice se termine
- **THEN** la boîte « Au tour de Bob » s'affiche, le plateau reste visible derrière, et la main de Bob n'est visible qu'après « Je suis prêt »

#### Scenario: Mise en place

- **WHEN** dans une partie entre Alice et Bob en placement des armées un par un, Alice place une armée
- **THEN** la main passe à Bob sans afficher la boîte « Au tour de Bob »

### Requirement: Mise en page desktop et tablette

L'écran de partie SHALL être conçu pour des fenêtres en paysage d'au moins 1024 × 768 pixels CSS :
plateau en plein écran et HUD en panneau latéral, toutes les commandes visibles sans défilement de la
page. Toute commande SHALL offrir une zone tactile d'au moins 44 × 44 pixels CSS, pour la souris
comme pour le doigt sur tablette.

#### Scenario: Tablette en paysage

- **WHEN** l'écran de partie s'affiche en 1024 × 768
- **THEN** le HUD est un panneau latéral, toutes ses commandes sont visibles sans défilement et le plateau occupe le reste de l'écran

#### Scenario: Grand écran

- **WHEN** l'écran de partie s'affiche en 1920 × 1080
- **THEN** le HUD garde sa largeur et le plateau profite de l'espace supplémentaire
