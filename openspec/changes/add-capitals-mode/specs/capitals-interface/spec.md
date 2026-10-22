# Spec Delta

## Purpose

Rendre le mode capitales jouable et lisible : l'activer, choisir sa capitale sur le plateau, voir
en permanence où sont les capitales et qui les tient.

## ADDED Requirements

### Requirement: Option à la création

Le formulaire de création SHALL proposer l'option « Mode capitales », décochée par défaut. Cocher
« Mode capitales » SHALL décocher « Missions secrètes » et inversement, avec la mention « Les variantes
missions et capitales s'excluent ».

#### Scenario: Exclusivité dans le formulaire

- **WHEN** « Missions secrètes » est cochée et que l'utilisateur coche « Mode capitales »
- **THEN** « Missions secrètes » est décochée et la mention d'exclusivité s'affiche

#### Scenario: Deux joueurs

- **WHEN** la liste compte 2 joueurs
- **THEN** « Mode capitales » reste disponible

### Requirement: Choix guidé de la capitale

Pendant la phase de choix, les territoires du joueur humain courant SHALL être sélectionnables sur
le plateau ; toucher un territoire SHALL demander la confirmation « Faire de <territoire> votre
capitale ? ». Le HUD SHALL indiquer « <joueur> — Choix de la capitale ».

#### Scenario: Confirmation

- **WHEN** le joueur touche l'Égypte puis confirme
- **THEN** l'Égypte devient sa capitale et le choix passe au joueur suivant

#### Scenario: Annulation

- **WHEN** le joueur touche l'Égypte puis annule
- **THEN** aucun choix n'est fait et ses territoires restent sélectionnables

### Requirement: Marqueur de capitale

Chaque capitale SHALL porter sur le plateau un marqueur 3D distinct du pion d'armées, aux couleurs
du joueur dont c'est la capitale, visible à tous les niveaux de zoom, en plus de la couleur du
territoire qui indique son propriétaire actuel.

#### Scenario: Capitale prise visible

- **WHEN** Alice (rouge) conquiert la capitale de Bob (bleu)
- **THEN** le territoire devient rouge et son marqueur de capitale reste bleu

### Requirement: Capitales dans le HUD

Le HUD SHALL afficher pour chaque joueur le nombre de capitales qu'il tient sur le nombre total, et
SHALL signaler par une alerte visible la perte de sa capitale par un joueur humain.

#### Scenario: Décompte

- **WHEN** à 3 joueurs Alice tient sa capitale et celle de Bob
- **THEN** le HUD affiche « Capitales : 2/3 » pour Alice

#### Scenario: Alerte de perte

- **WHEN** une IA prend la capitale d'Alice, humaine
- **THEN** une alerte « Votre capitale <territoire> est tombée » s'affiche

### Requirement: Journal et fin de partie

Le journal SHALL contenir « <joueur> choisit <territoire> comme capitale » et « <joueur> s'empare de
la capitale de <joueur> (<territoire>) ». L'écran de fin SHALL indiquer « en contrôlant toutes les
capitales » comme motif de victoire.

#### Scenario: Prise de capitale journalisée

- **WHEN** Alice conquiert l'Égypte, capitale de Bob
- **THEN** le journal contient « Alice s'empare de la capitale de Bob (Égypte) »

#### Scenario: Motif de victoire

- **WHEN** Alice gagne par les capitales
- **THEN** l'écran de fin affiche « Alice remporte la partie en contrôlant toutes les capitales »
