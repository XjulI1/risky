# game-screens Specification

## Purpose

Organiser l'application en écrans successifs (accueil, création, partie, fin de partie) et définir
comment on passe de l'un à l'autre.

## Requirements

### Requirement: Écran d'accueil

Au lancement, l'application SHALL afficher un écran d'accueil proposant de créer une nouvelle partie.

#### Scenario: Lancement de l'application

- **WHEN** l'utilisateur ouvre l'application
- **THEN** l'écran d'accueil s'affiche avec un bouton « Nouvelle partie »

#### Scenario: Aller à la création

- **WHEN** l'utilisateur clique sur « Nouvelle partie »
- **THEN** l'écran de création de partie s'affiche

### Requirement: Écrans hors cible

Sur une fenêtre de moins de 1024 pixels CSS de large ou en portrait, l'application SHALL rester
accessible sans mise en page dédiée, et SHALL afficher un bandeau refermable « Risky est conçu pour
un écran d'au moins 1024 px de large en mode paysage ». Le bandeau SHALL NOT bloquer l'usage.

#### Scenario: Ouverture sur un smartphone

- **WHEN** l'application s'ouvre dans une fenêtre de 390 × 844
- **THEN** le bandeau s'affiche et l'utilisateur peut le refermer puis utiliser l'application

#### Scenario: Écran cible

- **WHEN** l'application s'ouvre dans une fenêtre de 1024 × 768
- **THEN** aucun bandeau ne s'affiche

### Requirement: Écran de partie et sortie

Une fois la partie créée, l'application SHALL afficher le plateau 3D en plein écran avec le HUD
superposé. L'utilisateur SHALL pouvoir quitter la partie à tout moment et revenir à l'accueil, sans
confirmation : la partie reste sauvegardée et peut être reprise depuis l'accueil.

#### Scenario: Démarrage d'une partie

- **WHEN** l'utilisateur valide la création d'une partie
- **THEN** l'écran de partie s'affiche avec le plateau et le HUD du premier joueur

#### Scenario: Quitter la partie

- **WHEN** l'utilisateur choisit « Quitter la partie »
- **THEN** l'écran d'accueil s'affiche aussitôt, sans confirmation, et propose « Reprendre la partie »

### Requirement: Écran de fin de partie

Quand le moteur déclare un vainqueur, l'application SHALL afficher un écran de fin de partie
nommant le vainqueur dans sa couleur, par-dessus le plateau final, avec les choix « Rejouer avec
les mêmes paramètres » et « Retour à l'accueil ».

#### Scenario: Victoire

- **WHEN** le moteur déclare la victoire d'Alice
- **THEN** l'écran de fin affiche « Alice remporte la partie » dans la couleur d'Alice

#### Scenario: Rejouer

- **WHEN** l'utilisateur choisit « Rejouer avec les mêmes paramètres »
- **THEN** une nouvelle partie démarre avec les mêmes joueurs et réglages et une nouvelle graine
