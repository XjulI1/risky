# Spec Delta

## Purpose

Rendre les combats lisibles et vivants : montrer chaque lancer de dés et ses pertes, permettre
d'accélérer les animations, et rendre les conquêtes visibles sur le plateau.

## ADDED Requirements

### Requirement: Dés animés

Chaque lancer produit par le moteur SHALL être montré par une animation de dés : dés de l'attaquant
dans sa couleur, dés du défenseur dans la sienne, triés et alignés paire par paire une fois arrêtés,
avec la perte de chaque paire indiquée. Les valeurs affichées SHALL être exactement celles de
l'événement du moteur.

#### Scenario: Lancer à trois contre deux

- **WHEN** le moteur produit un lancer 6, 5, 1 contre 4, 4
- **THEN** les dés s'arrêtent sur ces valeurs, les paires 6/4 et 5/4 sont marquées perdues pour le défenseur et le 1 est grisé

### Requirement: Mise à jour du plateau après l'animation

Les compteurs d'armées et les couleurs du plateau SHALL être mis à jour à la fin de l'animation
de chaque lancer, et non avant, pour que le résultat affiché corresponde aux dés montrés.

#### Scenario: Compteurs synchronisés

- **WHEN** un lancer fait perdre 2 armées au défenseur
- **THEN** le compteur du territoire défendu diminue de 2 à la fin de l'animation de ce lancer

### Requirement: Enchaînement des lancers d'une attaque

Une attaque SHALL montrer successivement chaque lancer produit par le moteur, le premier à la
cadence normale et les suivants à une cadence accélérée. L'utilisateur SHALL pouvoir passer
l'animation restante d'une attaque d'un toucher.

#### Scenario: Attaque de quatre lancers

- **WHEN** une attaque produit 4 lancers
- **THEN** les 4 lancers sont montrés dans l'ordre puis le déplacement après conquête est proposé si le territoire est tombé

#### Scenario: Passer l'animation

- **WHEN** l'utilisateur touche l'écran pendant l'animation d'une attaque
- **THEN** le plateau affiche immédiatement l'état final de l'attaque

### Requirement: Vitesse d'animation

L'utilisateur SHALL pouvoir choisir la vitesse d'animation parmi normale, rapide et instantanée,
depuis le HUD, à tout moment. Le choix SHALL être mémorisé sur l'appareil. En vitesse instantanée,
aucun dé n'est animé : le résultat du lancer est affiché sous forme de texte.

#### Scenario: Vitesse mémorisée

- **WHEN** l'utilisateur choisit « rapide » puis recharge l'application
- **THEN** la vitesse est toujours « rapide »

#### Scenario: Vitesse instantanée

- **WHEN** la vitesse est « instantanée » et qu'une attaque est lancée
- **THEN** le plateau est mis à jour sans animation et le résultat s'affiche en texte dans le HUD

### Requirement: Animation de conquête

Quand un territoire change de propriétaire, le plateau SHALL faire passer sa couleur à celle du
nouveau propriétaire avec une courte transition, et SHALL animer le déplacement des armées après
conquête du territoire d'origine vers le territoire conquis.

#### Scenario: Conquête animée

- **WHEN** Alice conquiert le Brésil puis valide le déplacement
- **THEN** le Brésil prend la couleur d'Alice par transition et les armées déplacées sont animées de l'origine vers le Brésil

### Requirement: Mouvement réduit

Si le système de l'utilisateur demande de réduire les animations, la vitesse par défaut SHALL être
« instantanée ».

#### Scenario: Préférence système

- **WHEN** le navigateur signale la préférence de mouvement réduit et qu'aucune vitesse n'a été mémorisée
- **THEN** la vitesse est « instantanée »
