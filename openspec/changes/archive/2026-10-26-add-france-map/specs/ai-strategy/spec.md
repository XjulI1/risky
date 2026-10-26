## ADDED Requirements

### Requirement: Progression de difficulté sur la carte de France

L'IA difficile SHALL gagner plus de parties que l'IA normale, qui SHALL elle-même gagner plus de
parties que l'IA facile, sur un ensemble fixe de parties à trois joueurs sur la carte de France
opposant une IA de chaque niveau, avec des graines fixées et l'ordre des niveaux permuté.

#### Scenario: Tournoi sur la carte de France

- **WHEN** on joue 60 parties à trois joueurs (facile, normal, difficile) sur la carte de France, sur 60 graines fixées, chaque ordre de jeu étant représenté également
- **THEN** le nombre de victoires est strictement croissant de facile à normal à difficile, et l'IA difficile gagne au moins 40 % des parties
