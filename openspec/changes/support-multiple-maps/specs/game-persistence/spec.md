## MODIFIED Requirements

### Requirement: Reprise

Quand une sauvegarde d'une partie non terminée existe, l'accueil SHALL proposer « Reprendre la
partie » avec un résumé (joueurs, numéro de tour, date de dernière sauvegarde). La reprise SHALL
restaurer l'état du moteur, la carte de la partie, le journal et les statistiques, sans rejouer
d'animation, puis poursuivre la partie : si le joueur courant est une IA, elle reprend son tour. Une
sauvegarde dont la configuration ne précise pas de carte SHALL être reprise sur la carte classique.
Une sauvegarde dont les territoires ne correspondent pas à ceux de sa carte SHALL être traitée comme
illisible.

#### Scenario: Reprise après rechargement

- **WHEN** l'utilisateur recharge la page en pleine partie puis choisit « Reprendre la partie »
- **THEN** le plateau, le HUD, le journal et le joueur courant sont ceux d'avant le rechargement

#### Scenario: Reprise pendant un déplacement après conquête

- **WHEN** la page est rechargée alors que le joueur devait déplacer ses armées après une conquête
- **THEN** à la reprise le sélecteur de déplacement est de nouveau proposé

#### Scenario: Reprise au tour d'une IA

- **WHEN** l'utilisateur reprend une partie sauvegardée au tour d'une IA
- **THEN** l'IA poursuit son tour automatiquement

#### Scenario: Pas de sauvegarde

- **WHEN** aucune sauvegarde n'existe
- **THEN** l'accueil ne propose pas « Reprendre la partie »

#### Scenario: Sauvegarde antérieure sans carte

- **WHEN** la sauvegarde a été écrite avant l'introduction du choix de carte et sa configuration ne précise pas de carte
- **THEN** la partie est reprise sur la carte classique

#### Scenario: Territoires d'une autre carte

- **WHEN** la sauvegarde désigne la carte classique mais ses territoires ne sont pas ceux de la carte classique
- **THEN** elle est traitée comme illisible
