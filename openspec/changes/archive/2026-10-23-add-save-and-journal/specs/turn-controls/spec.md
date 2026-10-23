## MODIFIED Requirements

### Requirement: Bandeau d'état

Le HUD SHALL afficher en permanence le joueur courant (nom et couleur), la phase courante en
français, la réserve d'armées quand elle existe, et pour chaque joueur son nombre de territoires,
d'armées et de cartes. Les joueurs éliminés SHALL apparaître barrés. Le nom du joueur SHALL occuper
sa propre ligne ; la réserve SHALL apparaître sous une forme courte, sur la ligne de la phase. Les
lignes du bandeau SHALL garder leur place d'une action à l'autre, pour que le contenu du HUD ne
saute pas.

#### Scenario: Phase de renforts

- **WHEN** c'est le tour d'Alice en phase de renforts avec 7 armées en réserve
- **THEN** le HUD affiche « Alice » sur une ligne, puis « Renforts » et « 7 à placer » sur la ligne suivante

#### Scenario: Joueur éliminé

- **WHEN** Bob est éliminé
- **THEN** Bob apparaît barré dans la liste des joueurs
