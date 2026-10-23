# Spec Delta

## ADDED Requirements

### Requirement: Niveau expert

L'IA experte SHALL jouer comme l'IA difficile, sauf pour le déploiement des renforts et le choix des
attaques. Pour ces deux décisions, elle SHALL comparer le choix de l'IA difficile à des alternatives :
- en déploiement, la réserve entière placée sur ses territoires frontaliers les mieux placés pour
  attaquer et sur les plus menacés ;
- en attaque, la fin de ses attaques et ses attaques aux meilleures probabilités de conquête,
  à partir de 0,25.

Elle SHALL évaluer chaque candidat en simulant plusieurs fois la fin de son tour puis le tour de
chaque adversaire, tous joués comme par l'IA difficile. Chaque simulation part d'une répartition
au hasard des cartes qu'elle ne voit pas, compatible avec le nombre de cartes de chaque main. Tous
les candidats SHALL être évalués sur les mêmes répartitions et les mêmes dés. Elle SHALL jouer le
candidat dont la position moyenne atteinte est la meilleure, et le choix de l'IA difficile en cas
d'égalité. La position d'un joueur SHALL valoir 1 s'il a gagné, 0 s'il est éliminé, et sinon sa part
de la force des joueurs encore en jeu, cette force tenant compte des armées, des renforts attendus
et des cartes. Quand le choix de l'IA difficile est le seul candidat, elle SHALL le jouer sans
simuler.

#### Scenario: Décisions laissées au difficile

- **WHEN** l'IA experte doit fortifier, déplacer ses armées après une conquête ou échanger des cartes
- **THEN** elle joue la même action que l'IA difficile placée dans la même situation

#### Scenario: Fin d'attaque envisagée

- **WHEN** l'IA experte est en phase d'attaque avec un territoire de 10 armées voisin d'un territoire adverse de 2 armées
- **THEN** ses candidats comprennent la fin de ses attaques et l'attaque de ce territoire

#### Scenario: Attaque peu probable écartée

- **WHEN** la seule attaque possible de l'IA experte a une probabilité de conquête inférieure à 0,25
- **THEN** elle ne l'envisage pas parmi ses candidats

#### Scenario: Victoire simulée

- **WHEN** on évalue une position où l'IA experte a gagné la partie
- **THEN** cette position vaut 1, et 0 pour chacun de ses adversaires

#### Scenario: Cartes adverses inconnues

- **WHEN** on présente à l'IA experte deux états identiques sauf le contenu des mains adverses, à nombre de cartes égal, l'ordre de la pioche et l'état du générateur de la partie
- **THEN** elle choisit la même action dans les deux cas

### Requirement: Expert hors du mode classique

Quand les missions secrètes ou le mode capitales sont activés, une IA de niveau expert SHALL jouer
exactement comme une IA difficile.

#### Scenario: Partie avec missions

- **WHEN** une IA de niveau expert joue une partie avec missions secrètes
- **THEN** chacune de ses actions est celle que jouerait l'IA difficile dans la même situation

### Requirement: Supériorité de l'expert

Sur un ensemble fixe de parties à trois joueurs opposant une IA experte à deux IA difficiles, en mode
classique, avec des graines fixées et la place de l'IA experte permutée, l'IA experte SHALL gagner au
moins la moitié des parties.

#### Scenario: Tournoi expert

- **WHEN** on joue 60 parties à trois joueurs, une IA experte contre deux IA difficiles, sur 60 graines fixées, l'IA experte occupant chaque place autant de fois
- **THEN** toutes les parties se terminent par une victoire sans action rejetée, et l'IA experte en gagne au moins 30

### Requirement: Budget de réflexion de l'expert

Le temps d'une décision de l'IA experte SHALL rester court dans la grande majorité des cas, avec
des pics rares. Sur un ordinateur portable récent, sur l'ensemble des décisions de l'IA experte du
tournoi expert, le temps moyen SHALL être inférieur à 250 ms, 95 % des décisions SHALL prendre moins
de 500 ms et aucune SHALL NOT dépasser 1,5 s.

#### Scenario: Temps mesurés pendant le tournoi

- **WHEN** on joue le tournoi expert sur un ordinateur portable récent, sans autre calcul en parallèle
- **THEN** le temps moyen d'une décision de l'IA experte est inférieur à 250 ms, le 95e centile inférieur à 500 ms et le maximum inférieur à 1,5 s
