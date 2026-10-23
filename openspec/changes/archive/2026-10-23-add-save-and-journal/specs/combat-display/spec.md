## MODIFIED Requirements

### Requirement: Vitesse d'animation

L'utilisateur SHALL pouvoir choisir la vitesse d'animation parmi normale, rapide et instantanée,
depuis le HUD, à tout moment. Le choix SHALL être mémorisé sur l'appareil. En vitesse instantanée,
aucun dé n'est animé : le résultat de l'attaque est affiché sous forme de texte dans le journal de
partie, et nulle part ailleurs dans le HUD.

#### Scenario: Vitesse mémorisée

- **WHEN** l'utilisateur choisit « rapide » puis recharge l'application
- **THEN** la vitesse est toujours « rapide »

#### Scenario: Vitesse instantanée

- **WHEN** la vitesse est « instantanée » et qu'une attaque est lancée
- **THEN** le plateau est mis à jour sans animation et le résultat s'affiche en texte dans le journal de partie
