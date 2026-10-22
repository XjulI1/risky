## MODIFIED Requirements

### Requirement: Liste des joueurs

Le formulaire SHALL proposer par défaut 3 joueurs avec des couleurs distinctes : le joueur 1, humain,
nommé « Joueur 1 », et deux IA nommées selon la capacité `ai-players`. Il SHALL permettre d'ajouter
ou de retirer des joueurs entre 2 et 6. Chaque joueur SHALL avoir un nom modifiable et une couleur
choisie dans une palette de 6 couleurs distinctes du gris neutre. Chaque joueur SHALL tenir sur une
seule ligne, et son retrait SHALL se faire par un bouton marqué d'une croix, nommé « Retirer <nom> »
pour les lecteurs d'écran.

#### Scenario: Valeurs par défaut

- **WHEN** l'écran de création s'ouvre
- **THEN** 3 joueurs sont proposés, le premier nommé « Joueur 1 », avec des couleurs toutes différentes

#### Scenario: Limite haute

- **WHEN** la liste compte déjà 6 joueurs
- **THEN** l'ajout d'un joueur est désactivé

#### Scenario: Limite basse

- **WHEN** la liste compte 2 joueurs
- **THEN** le retrait d'un joueur est désactivé

#### Scenario: Retrait d'un joueur

- **WHEN** l'utilisateur appuie sur la croix du deuxième joueur
- **THEN** ce joueur disparaît de la liste et les autres restent dans le même ordre

#### Scenario: Couleur déjà prise

- **WHEN** l'utilisateur choisit pour un joueur une couleur déjà utilisée par un autre
- **THEN** les deux joueurs échangent leurs couleurs
