## MODIFIED Requirements

### Requirement: Paquet et attribution

Quand le réglage est actif, le moteur SHALL constituer un paquet formé des missions générales de la
carte de la partie et d'une mission « éliminer <joueur> » pour chaque joueur de la partie, le
mélanger avec la graine de la partie et en attribuer une à chaque joueur à la création. Les missions
générales d'une carte SHALL être ses missions de continents suivies de « Conquérir 24 territoires »
et « Occuper 18 territoires avec au moins 2 armées sur chacun ». Une mission à continent au choix
SHALL employer le mot de la carte pour ses continents (« un troisième continent au choix »). Pour la
carte classique, les missions générales SHALL être :

1. Conquérir l'Amérique du Nord et l'Afrique.
2. Conquérir l'Amérique du Nord et l'Océanie.
3. Conquérir l'Asie et l'Amérique du Sud.
4. Conquérir l'Asie et l'Afrique.
5. Conquérir l'Europe, l'Amérique du Sud et un troisième continent au choix.
6. Conquérir l'Europe, l'Océanie et un troisième continent au choix.
7. Conquérir 24 territoires.
8. Occuper 18 territoires avec au moins 2 armées sur chacun.

#### Scenario: Taille du paquet

- **WHEN** on crée une partie à 4 joueurs avec missions sur la carte classique
- **THEN** le paquet compte 12 missions et chaque joueur en tire exactement une, aucune carte n'étant tirée deux fois

#### Scenario: Attribution déterministe

- **WHEN** on crée deux parties avec missions, la même graine et les mêmes joueurs
- **THEN** chaque joueur reçoit la même mission dans les deux parties

#### Scenario: Missions de la carte de la partie

- **WHEN** on crée une partie avec missions sur une carte de test dont les missions de continents ne citent que ses propres continents
- **THEN** toute mission de continents attribuée cite uniquement des continents de cette carte
