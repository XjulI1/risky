## REMOVED Requirements

### Requirement: Écran de partie

**Reason**: « Quitter la partie » ne demande plus de confirmation, puisque la partie est désormais
sauvegardée et peut être reprise ; les scénarios d'abandon confirmé ou annulé n'ont plus lieu d'être.

**Migration**: remplacée par l'exigence « Écran de partie et sortie ».

## ADDED Requirements

### Requirement: Écran de partie et sortie

Une fois la partie créée, l'application SHALL afficher le plateau 3D en plein écran avec le HUD
superposé. L'utilisateur SHALL pouvoir quitter la partie à tout moment et revenir à l'accueil, sans
confirmation : la partie reste sauvegardée et peut être reprise depuis l'accueil.

#### Scenario: Démarrage d'une partie

- **WHEN** l'utilisateur valide la création d'une partie
- **THEN** l'écran de partie s'affiche avec le plateau et le HUD du premier joueur

#### Scenario: Quitter la partie

- **WHEN** l'utilisateur choisit « Quitter la partie »
- **THEN** l'écran d'accueil s'affiche aussitôt, sans confirmation, et propose « Reprendre la partie »
