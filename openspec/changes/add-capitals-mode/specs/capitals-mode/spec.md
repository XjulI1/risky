# Spec Delta

## Purpose

Règles de la variante capitales : chaque joueur désigne une capitale publique, et le premier à tenir
toutes les capitales en même temps gagne.

## ADDED Requirements

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

### Requirement: Choix des capitales

Quand le réglage est actif, la mise en place (aléatoire ou manuelle) SHALL être suivie d'une phase de
choix des capitales : à tour de rôle à partir du premier joueur, chaque joueur non neutre désigne un
territoire qu'il possède comme sa capitale. Le choix SHALL être définitif et public. La partie passe
ensuite en phase de renforts du premier joueur.

#### Scenario: Après une mise en place aléatoire

- **WHEN** on crée une partie à 3 joueurs en placement aléatoire avec le mode capitales
- **THEN** la partie est en phase de choix des capitales du premier joueur

#### Scenario: Choix valide

- **WHEN** le joueur courant désigne un de ses territoires pendant la phase de choix
- **THEN** ce territoire devient sa capitale et la main passe au joueur suivant

#### Scenario: Territoire adverse

- **WHEN** le joueur courant désigne un territoire qu'il ne possède pas
- **THEN** l'action est rejetée

#### Scenario: Fin du choix

- **WHEN** le dernier joueur non neutre a choisi sa capitale
- **THEN** la partie passe en phase de renforts du premier joueur

#### Scenario: Neutre sans capitale

- **WHEN** on crée une partie à 2 joueurs avec le mode capitales
- **THEN** seules 2 capitales sont choisies et le neutre n'en a pas

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
