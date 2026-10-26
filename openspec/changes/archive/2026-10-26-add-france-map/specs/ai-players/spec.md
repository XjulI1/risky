## MODIFIED Requirements

### Requirement: Légalité et terminaison

Une IA SHALL NOT soumettre d'action rejetée par le moteur. Son tour SHALL se terminer en un nombre
borné d'actions. Aux niveaux facile, normal et difficile, une décision SHALL être prise en moins de
50 ms sur un ordinateur portable récent ; le niveau expert suit son propre budget de réflexion. Ces
garanties SHALL valoir sur chaque carte du catalogue.

#### Scenario: Aucune action rejetée

- **WHEN** on joue 100 parties entre IA de niveaux mélangés, de 2 à 6 joueurs, avec des graines et des réglages variés
- **THEN** aucune action n'est rejetée par le moteur et toutes les parties se terminent par une victoire

#### Scenario: Aucune action rejetée sur la carte de France

- **WHEN** on joue 100 parties entre IA de niveaux mélangés sur la carte de France, de 2 à 6 joueurs, avec des graines et des réglages variés, variantes comprises
- **THEN** aucune action n'est rejetée par le moteur et toutes les parties se terminent par une victoire
