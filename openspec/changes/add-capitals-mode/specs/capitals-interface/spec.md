# Spec Delta

## Purpose

Rendre le mode capitales jouable et lisible : l'activer, choisir sa capitale en secret, voir en
permanence où sont les capitales, qui les tient et quand leur bonus de défense joue.

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

### Requirement: Choix secret guidé

Pendant la phase de choix, les territoires du joueur humain courant SHALL être sélectionnables sur
le plateau ; toucher un territoire SHALL demander la confirmation « Faire de <territoire> votre
capitale ? ». Le HUD SHALL indiquer « <joueur> — Choix de la capitale ». Les choix déjà faits par
d'autres joueurs SHALL NOT être affichés. Entre deux humains, l'écran de passage de main SHALL
s'afficher avant chaque choix. Une fois tous les choix faits, une annonce SHALL présenter toutes les
capitales en même temps.

#### Scenario: Confirmation

- **WHEN** le joueur touche l'Égypte puis confirme
- **THEN** l'Égypte est enregistrée comme sa capitale et le choix passe au joueur suivant

#### Scenario: Annulation

- **WHEN** le joueur touche l'Égypte puis annule
- **THEN** aucun choix n'est fait et ses territoires restent sélectionnables

#### Scenario: Choix des autres masqués

- **WHEN** Bob choisit sa capitale après Alice
- **THEN** aucun marqueur ni aucune mention de la capitale d'Alice n'est visible

#### Scenario: Révélation

- **WHEN** le dernier joueur a choisi sa capitale
- **THEN** une annonce présente la capitale de chaque joueur et les marqueurs apparaissent sur le plateau

### Requirement: Marqueur de capitale

Après la révélation, chaque capitale SHALL porter sur le plateau un marqueur 3D distinct du pion
d'armées, aux couleurs du joueur dont c'est la capitale, visible à tous les niveaux de zoom, en plus
de la couleur du territoire qui indique son propriétaire actuel.

#### Scenario: Capitale prise visible

- **WHEN** Alice (rouge) conquiert la capitale de Bob (bleu)
- **THEN** le territoire devient rouge et son marqueur de capitale reste bleu

### Requirement: Bonus de défense visible

Lors d'un lancer contre une capitale, le dé bonifié du défenseur SHALL afficher sa valeur tirée et
la mention « +1 », et la comparaison des paires SHALL utiliser la valeur bonifiée. Le détail du
lancer dans le journal SHALL noter la valeur bonifiée sous la forme « 5+1 ».

#### Scenario: Affichage du bonus

- **WHEN** le défenseur d'une capitale obtient 5 et 1
- **THEN** le dé à 5 affiche « +1 », il est comparé comme un 6, et le détail du journal indique « 5+1-1 »

### Requirement: Capitales dans le HUD

Après la révélation, le HUD SHALL afficher pour chaque joueur le nombre de capitales qu'il tient sur
le nombre total, et SHALL signaler par une alerte visible la perte de sa capitale par un joueur
humain.

#### Scenario: Décompte

- **WHEN** à 3 joueurs Alice tient sa capitale et celle de Bob
- **THEN** le HUD affiche « Capitales : 2/3 » pour Alice

#### Scenario: Alerte de perte

- **WHEN** une IA prend la capitale d'Alice, humaine
- **THEN** une alerte « Votre capitale <territoire> est tombée » s'affiche

### Requirement: Journal et fin de partie

Le journal SHALL contenir, à la révélation, « Capitales : <joueur> — <territoire>, … » et, à chaque
prise, « <joueur> s'empare de la capitale de <joueur> (<territoire>) ». Il SHALL NOT contenir de
choix individuel avant la révélation. L'écran de fin SHALL indiquer « en contrôlant toutes les
capitales » comme motif de victoire.

#### Scenario: Révélation journalisée

- **WHEN** les capitales sont révélées
- **THEN** le journal contient une seule entrée listant la capitale de chaque joueur

#### Scenario: Prise de capitale journalisée

- **WHEN** Alice conquiert l'Égypte, capitale de Bob
- **THEN** le journal contient « Alice s'empare de la capitale de Bob (Égypte) »

#### Scenario: Motif de victoire

- **WHEN** Alice gagne par les capitales
- **THEN** l'écran de fin affiche « Alice remporte la partie en contrôlant toutes les capitales »
