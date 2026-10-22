# Spec Delta

## Purpose

Ne jamais perdre une partie en cours : la sauvegarder automatiquement dans le navigateur et
permettre de la reprendre exactement où elle s'était arrêtée.

## ADDED Requirements

### Requirement: Sauvegarde automatique

Après chaque action acceptée par le moteur, qu'elle vienne d'un humain ou d'une IA, l'application
SHALL enregistrer dans le stockage local du navigateur une sauvegarde unique contenant une version
de format, la date, la configuration de création, l'état du moteur, le journal et les statistiques.

#### Scenario: Sauvegarde après une action

- **WHEN** le joueur déploie des armées
- **THEN** la sauvegarde contient l'état du moteur après ce déploiement

#### Scenario: Sauvegarde pendant le tour d'une IA

- **WHEN** une IA attaque
- **THEN** la sauvegarde est mise à jour après cette attaque

### Requirement: Reprise

Quand une sauvegarde d'une partie non terminée existe, l'accueil SHALL proposer « Reprendre la
partie » avec un résumé (joueurs, numéro de tour, date de dernière sauvegarde). La reprise SHALL
restaurer l'état du moteur, le journal et les statistiques, sans rejouer d'animation, puis
poursuivre la partie : si le joueur courant est une IA, elle reprend son tour.

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

### Requirement: Quitter et remplacer

« Quitter la partie » SHALL revenir à l'accueil sans demander de confirmation et en conservant la
sauvegarde. Créer une nouvelle partie alors qu'une sauvegarde non terminée existe SHALL demander
confirmation avant de la remplacer.

#### Scenario: Quitter conserve la partie

- **WHEN** l'utilisateur choisit « Quitter la partie »
- **THEN** l'accueil s'affiche et propose « Reprendre la partie »

#### Scenario: Remplacement confirmé

- **WHEN** une sauvegarde existe et que l'utilisateur lance une nouvelle partie puis confirme le remplacement
- **THEN** la nouvelle partie démarre et remplace la sauvegarde

#### Scenario: Remplacement annulé

- **WHEN** une sauvegarde existe et que l'utilisateur annule le remplacement
- **THEN** il revient à l'accueil et la sauvegarde est intacte

### Requirement: Partie terminée

Une partie terminée SHALL rester sauvegardée tant que l'écran de fin est affiché, pour survivre à un
rechargement, et SHALL être supprimée dès que l'utilisateur quitte l'écran de fin.

#### Scenario: Rechargement sur l'écran de fin

- **WHEN** l'utilisateur recharge la page sur l'écran de fin
- **THEN** l'accueil propose « Voir la dernière partie » qui rouvre l'écran de fin et ses statistiques

#### Scenario: Sortie de l'écran de fin

- **WHEN** l'utilisateur choisit « Retour à l'accueil » sur l'écran de fin
- **THEN** la sauvegarde est supprimée et l'accueil ne propose plus de reprise

### Requirement: Sauvegarde illisible ou incompatible

Une sauvegarde illisible, incomplète ou d'une version de format inconnue SHALL être supprimée, et
l'accueil SHALL afficher une fois le message « La sauvegarde précédente n'a pas pu être chargée ».

#### Scenario: Données corrompues

- **WHEN** le stockage contient une sauvegarde qui n'est pas du JSON valide
- **THEN** l'accueil affiche le message, ne propose pas de reprise, et la sauvegarde est supprimée

#### Scenario: Version inconnue

- **WHEN** la sauvegarde porte une version de format supérieure à celle que l'application connaît
- **THEN** elle est traitée comme illisible

### Requirement: Stockage indisponible

Si le stockage est plein ou indisponible (navigation privée, données de site bloquées), le jeu SHALL
continuer normalement et SHALL afficher une seule fois par partie l'avertissement « La partie ne peut
pas être sauvegardée sur cet appareil ».

#### Scenario: Stockage plein

- **WHEN** l'écriture de la sauvegarde échoue faute de place
- **THEN** l'avertissement s'affiche une fois et la partie continue
