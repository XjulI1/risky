# Spec Delta

## Purpose

Permettre de désigner un territoire sur le plateau à la souris ou au doigt, et afficher les états de
surbrillance que l'interface de jeu lui demande, sans que le plateau ne connaisse les règles.

## ADDED Requirements

### Requirement: Sélection d'un territoire

Un clic ou un toucher bref sur un territoire SHALL signaler à l'appelant l'identifiant de ce
territoire. Un geste de déplacement ou de zoom SHALL NOT être interprété comme une sélection. Un clic
sur l'océan SHALL signaler une désélection.

#### Scenario: Clic sur un territoire

- **WHEN** le joueur clique sur l'Égypte
- **THEN** le plateau signale la sélection du territoire Égypte

#### Scenario: Glisser n'est pas sélectionner

- **WHEN** le joueur appuie sur un territoire puis glisse de plus de quelques pixels avant de relâcher
- **THEN** la vue se déplace et aucune sélection n'est signalée

#### Scenario: Clic dans l'océan

- **WHEN** le joueur clique sur l'océan
- **THEN** le plateau signale une désélection

#### Scenario: Clic sur une île secondaire

- **WHEN** le joueur clique sur n'importe quelle île de l'Indonésie
- **THEN** le plateau signale la sélection du territoire Indonésie

### Requirement: États de surbrillance pilotés par l'appelant

Le plateau SHALL afficher pour chaque territoire l'état de surbrillance fourni par l'appelant parmi :
aucun, sélectionnable, sélectionné, cible. Les territoires non sélectionnables SHALL être atténués
dès qu'au moins un territoire est marqué sélectionnable. Le plateau SHALL NOT décider seul de ces
états.

#### Scenario: Sélectionnables mis en avant

- **WHEN** l'appelant marque 5 territoires comme sélectionnables
- **THEN** ces 5 territoires sont mis en avant et les autres sont atténués

#### Scenario: Origine et cibles

- **WHEN** l'appelant marque un territoire comme sélectionné et trois voisins comme cibles
- **THEN** le territoire sélectionné et les cibles sont visuellement distincts entre eux et du reste

#### Scenario: Aucune surbrillance

- **WHEN** l'appelant ne fournit aucune surbrillance
- **THEN** tous les territoires sont affichés normalement

### Requirement: Survol

Sur un appareil à pointeur, le territoire survolé SHALL être légèrement mis en avant et son nom
affiché. Sur un appareil tactile, aucun état de survol ne SHALL rester affiché après un toucher.

#### Scenario: Survol à la souris

- **WHEN** le pointeur survole le Pérou
- **THEN** le Pérou est mis en avant et son nom est affiché

### Requirement: Cibles tactiles

Sur un appareil tactile, un toucher SHALL viser le territoire sous le doigt, y compris pour les petits
territoires au zoom minimal, en retenant le territoire le plus proche du point de contact dans un
rayon de tolérance quand le contact tombe sur l'océan.

#### Scenario: Toucher imprécis près d'un petit territoire

- **WHEN** le joueur touche l'océan juste à côté de l'Islande, dans le rayon de tolérance
- **THEN** le plateau signale la sélection de l'Islande
