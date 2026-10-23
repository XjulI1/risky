# ai-strategy Specification

## Purpose

Définir le comportement observable des quatre niveaux d'IA et garantir qu'ils offrent une progression
de difficulté réelle.

## Requirements

### Requirement: Probabilités de combat exactes

Les IA de niveau normal et difficile SHALL évaluer une attaque à partir de la probabilité exacte que
l'attaquant conquière le territoire en attaquant jusqu'au bout, calculée selon les réglages de dés de
la partie.

#### Scenario: Lancer unique trois contre deux

- **WHEN** on calcule les issues d'un lancer à 3 dés contre 2 avec les réglages par défaut
- **THEN** l'attaquant gagne les deux paires avec une probabilité de 2890/7776, chaque camp perd une armée avec une probabilité de 2611/7776 et le défenseur gagne les deux paires avec une probabilité de 2275/7776

#### Scenario: Conquête jusqu'au bout

- **WHEN** on calcule la probabilité qu'un territoire de 2 armées conquière un territoire défendu par 1 armée en attaquant jusqu'au bout
- **THEN** elle vaut 15/36

### Requirement: Niveau facile

L'IA facile SHALL répartir ses renforts au hasard sur ses territoires frontaliers, SHALL n'attaquer
que lorsque son territoire d'origine compte au moins deux fois plus d'armées que la cible et au moins
4 armées, SHALL arrêter ses attaques après 3 conquêtes dans le tour, et SHALL échanger ses cartes
uniquement quand c'est obligatoire.

#### Scenario: Pas d'attaque sans net avantage

- **WHEN** l'IA facile a en attaque un territoire de 5 armées voisin d'un territoire adverse de 3 armées, et aucune autre attaque possible
- **THEN** elle met fin à ses attaques sans attaquer

#### Scenario: Renforts sur les frontières

- **WHEN** l'IA facile déploie ses renforts
- **THEN** chaque armée est déployée sur un territoire ayant au moins un voisin adverse

### Requirement: Niveau normal

L'IA normale SHALL choisir un continent cible en fonction de la part qu'elle en possède, de son bonus
et du nombre de frontières à défendre ; SHALL concentrer ses renforts sur le territoire frontalier le
mieux placé pour progresser dans ce continent ; SHALL attaquer quand la probabilité de conquête est
d'au moins 0,6 ; SHALL échanger ses cartes dès qu'elle le peut ; SHALL fortifier en déplaçant les
armées d'un territoire intérieur vers un territoire frontalier.

#### Scenario: Continent presque complet

- **WHEN** l'IA normale possède 3 des 4 territoires de l'Océanie et que le quatrième est attaquable avec une probabilité de conquête d'au moins 0,6
- **THEN** elle déploie ses renforts sur un territoire voisin de ce quatrième territoire et l'attaque

#### Scenario: Aucun renfort à l'intérieur

- **WHEN** l'IA normale déploie ses renforts
- **THEN** aucun territoire sans voisin adverse ne reçoit d'armée

#### Scenario: Fortification vers le front

- **WHEN** l'IA normale fortifie et possède un territoire intérieur de 6 armées voisin d'un de ses territoires frontaliers
- **THEN** elle déplace 5 armées de ce territoire intérieur vers un territoire frontalier

### Requirement: Niveau difficile

L'IA difficile SHALL appliquer la stratégie normale avec, en plus : une priorité à l'attaque d'un
continent entièrement tenu par un adversaire quand la probabilité de conquête d'un de ses
territoires est d'au moins 0,5 ; une priorité à l'élimination d'un adversaire atteignable quand
la probabilité d'éliminer tous ses territoires dans le tour est d'au moins 0,5 et qu'il détient au
moins une carte ; une répartition des renforts proportionnelle à la menace adverse sur chaque
frontière ; et, en barème progressif, la conservation de ses cartes tant que l'échange n'est pas
obligatoire et qu'elle n'en a pas besoin pour une attaque prioritaire.

#### Scenario: Casser un continent adverse

- **WHEN** un adversaire tient toute l'Amérique du Sud et que l'IA difficile peut attaquer le Venezuela avec une probabilité de conquête d'au moins 0,5
- **THEN** elle attaque un territoire d'Amérique du Sud pendant ce tour

#### Scenario: Élimination rentable

- **WHEN** un adversaire ne possède plus qu'un territoire, détient 3 cartes, et que l'IA difficile peut le conquérir avec une probabilité d'au moins 0,5
- **THEN** elle attaque ce territoire en priorité

#### Scenario: Conservation des cartes

- **WHEN** en barème progressif l'IA difficile détient 4 cartes formant une série et n'a pas d'attaque prioritaire
- **THEN** elle n'échange pas de cartes ce tour-ci

### Requirement: Progression de difficulté

Sur un ensemble fixe de parties à trois joueurs opposant une IA de chaque niveau, avec des graines
fixées et l'ordre des niveaux permuté, l'IA difficile SHALL gagner plus de parties que l'IA normale,
qui SHALL elle-même gagner plus de parties que l'IA facile.

#### Scenario: Tournoi de référence

- **WHEN** on joue 60 parties à trois joueurs (facile, normal, difficile) sur 60 graines fixées, chaque ordre de jeu étant représenté également
- **THEN** le nombre de victoires est strictement croissant de facile à normal à difficile, et l'IA difficile gagne au moins 45 % des parties

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
