## ADDED Requirements

### Requirement: Choix de la carte

Le formulaire SHALL proposer le choix de la carte entre « Monde », la carte classique, et « France »,
« Monde » étant sélectionné à l'ouverture. La partie SHALL être créée sur la carte choisie. Le choix
de la carte SHALL NOT modifier les joueurs, les réglages ni la disponibilité des variantes et des
niveaux d'IA. Relancer une partie depuis l'écran de fin SHALL garder la même carte.

#### Scenario: Carte par défaut

- **WHEN** l'écran de création s'ouvre
- **THEN** la carte « Monde » est sélectionnée

#### Scenario: Partie sur la carte de France

- **WHEN** l'utilisateur choisit « France » puis lance la partie
- **THEN** la partie est créée sur la carte de France et le plateau affiche la France

#### Scenario: Variantes disponibles sur la France

- **WHEN** l'utilisateur choisit « France » avec 3 joueurs
- **THEN** les missions secrètes, le mode capitales et le niveau expert restent proposés comme sur la carte « Monde »
