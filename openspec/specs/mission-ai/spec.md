# mission-ai Specification

## Purpose

Faire jouer les IA vers leur mission secrète, pour qu'elles restent des adversaires crédibles dans
cette variante, avec un écart de niveau préservé.

## Requirements

### Requirement: IA facile

L'IA facile SHALL ignorer sa mission et jouer comme en partie classique.

#### Scenario: Mission ignorée

- **WHEN** on présente à l'IA facile deux états identiques ne différant que par sa mission
- **THEN** elle choisit la même action

### Requirement: Mission de continents

Les IA normale et difficile dont la mission exige des continents SHALL choisir leur continent cible
parmi ceux exigés par la mission tant qu'ils ne sont pas tous possédés, et pour une mission à
continent au choix SHALL viser ensuite le continent restant au meilleur score.

#### Scenario: Continent exigé visé

- **WHEN** la mission d'une IA normale est « Asie et Afrique » et qu'aucun continent n'est complet
- **THEN** ses renforts sont déployés sur une frontière d'Asie ou d'Afrique

### Requirement: Missions chiffrées

Pour « Conquérir 24 territoires », les IA normale et difficile SHALL privilégier les attaques qui
augmentent leur nombre de territoires au plus faible risque. Pour « 18 territoires à 2 armées », elles
SHALL laisser au moins 2 armées sur chaque territoire conquis quand c'est possible.

#### Scenario: Deux armées laissées

- **WHEN** une IA normale à mission « 18 territoires à 2 armées » conquiert un territoire depuis une origine de 6 armées
- **THEN** elle déplace un nombre d'armées qui laisse au moins 2 armées sur l'origine et au moins 2 sur le territoire conquis

### Requirement: Mission d'élimination

Les IA normale et difficile dont la mission est d'éliminer un joueur SHALL attaquer en priorité les
territoires de ce joueur quand la probabilité de conquête est d'au moins 0,5, et SHALL éviter
d'éliminer un autre joueur que leur cible quand un tiers est proche de l'éliminer.

#### Scenario: Cible prioritaire

- **WHEN** une IA difficile doit éliminer Carol et peut attaquer un territoire de Carol avec une probabilité de 0,7 et un territoire de Bob avec une probabilité de 0,9
- **THEN** elle attaque le territoire de Carol

### Requirement: Progression de difficulté préservée

Le tournoi de référence joué avec les missions secrètes SHALL conserver un nombre de victoires
strictement croissant de facile à normal à difficile.

#### Scenario: Tournoi avec missions

- **WHEN** on joue 60 parties à trois joueurs (facile, normal, difficile) avec missions sur 60 graines fixées, chaque ordre de jeu étant représenté également
- **THEN** le nombre de victoires est strictement croissant de facile à normal à difficile
