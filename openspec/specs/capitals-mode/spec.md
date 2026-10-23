# capitals-mode Specification

## Purpose

Règles de la variante capitales : chaque joueur désigne en secret une capitale, révélée en même
temps que celles des autres ; une capitale se défend mieux, et le premier à tenir toutes les
capitales en même temps gagne.

## Requirements

### Requirement: Réglage mode capitales

Une partie SHALL porter un réglage « mode capitales », désactivé par défaut, autorisé de 2 à 6
joueurs. Son activation conjointe avec les missions secrètes SHALL être refusée avec une erreur
explicite.

#### Scenario: Désactivé par défaut

- **WHEN** on crée une partie sans préciser ce réglage
- **THEN** il n'y a pas de phase de choix de capitale et aucune capitale

#### Scenario: Exclusivité avec les missions

- **WHEN** on crée une partie avec le mode capitales et les missions secrètes activés
- **THEN** la création échoue avec une erreur indiquant que les deux variantes s'excluent

### Requirement: Choix secret des capitales

Quand le réglage est actif, la fin de la phase de placement SHALL ouvrir une phase de choix des
capitales : à tour de rôle à partir du premier joueur, chaque joueur non neutre désigne un territoire
qu'il possède comme sa capitale. Un choix SHALL être définitif et SHALL NOT être visible des autres
joueurs avant la révélation. Quand le dernier joueur a choisi, toutes les capitales SHALL être
révélées en même temps par un événement de révélation, puis la partie passe en phase de renforts du
premier joueur.

#### Scenario: Ouverture du choix

- **WHEN** la phase de placement d'une partie en mode capitales se termine
- **THEN** la partie est en phase de choix des capitales du premier joueur

#### Scenario: Choix valide

- **WHEN** le joueur courant désigne un de ses territoires pendant la phase de choix
- **THEN** ce territoire est enregistré comme sa capitale et la main passe au joueur suivant

#### Scenario: Territoire adverse

- **WHEN** le joueur courant désigne un territoire qu'il ne possède pas
- **THEN** l'action est rejetée

#### Scenario: Choix caché

- **WHEN** Alice a choisi sa capitale et que c'est au tour de Bob de choisir
- **THEN** l'information visible de Bob ne contient pas la capitale d'Alice

#### Scenario: Révélation simultanée

- **WHEN** le dernier joueur non neutre choisit sa capitale
- **THEN** un événement révèle toutes les capitales et la partie passe en phase de renforts du premier joueur

#### Scenario: Neutre sans capitale

- **WHEN** on crée une partie à 2 joueurs avec le mode capitales
- **THEN** seules 2 capitales sont choisies et le neutre n'en a pas

### Requirement: Bonus de défense des capitales

Lors de chaque lancer contre un territoire capitale, quel qu'en soit le propriétaire, le dé le plus
haut du défenseur SHALL être augmenté de 1 pour la comparaison (une valeur de 7 étant possible).
Les autres dés et les règles d'égalité restent inchangés.

#### Scenario: Bonus qui renverse une paire

- **WHEN** l'attaquant obtient 6, 2 et que le défenseur d'une capitale obtient 5, 1
- **THEN** le défenseur compte 6 et 1 : la première paire est une égalité gagnée par le défenseur, la seconde est gagnée par l'attaquant, et chaque camp perd 1 armée

#### Scenario: Capitale prise par un autre joueur

- **WHEN** Alice tient la capitale de Bob et que Carol l'attaque
- **THEN** Alice bénéficie du bonus de défense

#### Scenario: Territoire ordinaire

- **WHEN** l'attaquant attaque un territoire qui n'est pas une capitale
- **THEN** aucun bonus n'est appliqué

### Requirement: Capitale prise

Une capitale SHALL rester attachée à son territoire pour toute la partie, quel qu'en soit le
propriétaire. Perdre sa capitale SHALL NOT éliminer un joueur. La conquête d'une capitale SHALL
produire un événement indiquant le joueur à qui appartenait cette capitale.

#### Scenario: Perte de sa capitale

- **WHEN** Bob perd sa capitale mais possède encore d'autres territoires
- **THEN** Bob n'est pas éliminé et continue de jouer

#### Scenario: Reprise de sa capitale

- **WHEN** Bob reconquiert plus tard le territoire de sa capitale
- **THEN** il tient de nouveau sa capitale

### Requirement: Victoire par les capitales

Après chaque action du joueur courant, si celui-ci possède le territoire de chacune des capitales,
la partie SHALL se terminer immédiatement avec ce joueur pour vainqueur, y compris au milieu d'une
phase d'attaque. Si la victoire résulte d'une conquête, le déplacement minimal après conquête SHALL
être effectué automatiquement avant la fin. L'élimination de tous les adversaires SHALL rester une
victoire.

#### Scenario: Dernière capitale prise

- **WHEN** à 3 joueurs, Alice tient sa capitale et celle de Bob, et conquiert celle de Carol
- **THEN** la partie se termine, Alice gagne par les capitales et le déplacement minimal est effectué automatiquement

#### Scenario: Capitale propre perdue

- **WHEN** Alice tient les capitales de Bob et de Carol mais a perdu la sienne
- **THEN** la partie continue

#### Scenario: Victoire à deux joueurs

- **WHEN** dans une partie à 2 joueurs avec neutre, Alice tient sa capitale et conquiert celle de Bob
- **THEN** la partie se termine et Alice gagne
