# game-statistics Specification

## Purpose

Collecter des statistiques pendant la partie et les présenter à la fin, pour voir comment la partie
s'est jouée et qui a eu de la chance aux dés.

## Requirements

### Requirement: Relevé à chaque tour

Au début du tour de chaque joueur, l'application SHALL relever pour chaque joueur non neutre son
nombre de territoires et son nombre total d'armées. Ces relevés SHALL être conservés dans la
sauvegarde.

#### Scenario: Relevé de début de tour

- **WHEN** le tour 5 commence
- **THEN** un relevé est ajouté avec, pour chaque joueur, ses territoires et ses armées à cet instant

### Requirement: Compteurs de combat et de cartes

Pour chaque joueur, l'application SHALL compter au fil de la partie : territoires conquis, armées
perdues, armées adverses détruites, attaques lancées, lancers où l'attaquant a obtenu le meilleur dé,
séries échangées et armées obtenues par échange, ainsi que le tour de son élimination.

#### Scenario: Compteurs après un lancer

- **WHEN** Alice attaque Bob et que le lancer fait perdre 2 armées à Bob et 0 à Alice
- **THEN** les armées détruites d'Alice augmentent de 2 et les armées perdues de Bob de 2

#### Scenario: Élimination datée

- **WHEN** Bob est éliminé au tour 23
- **THEN** les statistiques de Bob indiquent « éliminé au tour 23 »

### Requirement: Écran de statistiques

L'écran de fin SHALL proposer un onglet « Statistiques » avec deux courbes (territoires par tour et
armées par tour, une ligne par joueur dans sa couleur, avec légende) et un tableau récapitulatif des
compteurs par joueur, le vainqueur en premier puis les autres dans l'ordre inverse de leur
élimination. Les courbes SHALL rester lisibles dès 1024 × 768.

#### Scenario: Ordre du tableau

- **WHEN** Carol gagne, Bob a été éliminé au tour 30 et Alice au tour 18
- **THEN** le tableau liste Carol, puis Bob, puis Alice

#### Scenario: Courbes

- **WHEN** l'utilisateur ouvre l'onglet « Statistiques » après une partie de 40 tours à 3 joueurs
- **THEN** deux courbes de 40 points par joueur s'affichent avec une légende aux couleurs des joueurs

#### Scenario: Plus petit écran cible

- **WHEN** l'onglet « Statistiques » est ouvert en 1024 × 768
- **THEN** les deux courbes et le tableau sont lisibles sans défilement horizontal de la page
