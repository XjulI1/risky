# Spec Delta

## Purpose

Règles de la variante missions secrètes : chaque joueur reçoit un objectif caché dont
l'accomplissement lui donne immédiatement la victoire.

## ADDED Requirements

### Requirement: Réglage missions secrètes

Une partie SHALL porter un réglage « missions secrètes », désactivé par défaut. Son activation SHALL
être refusée à 2 joueurs avec une erreur explicite.

#### Scenario: Désactivé par défaut

- **WHEN** on crée une partie sans préciser ce réglage
- **THEN** aucune mission n'est attribuée et seule l'élimination de tous les adversaires fait gagner

#### Scenario: Refus à deux joueurs

- **WHEN** on crée une partie à 2 joueurs avec les missions secrètes activées
- **THEN** la création échoue avec une erreur indiquant que les missions exigent au moins 3 joueurs

### Requirement: Paquet et attribution

Quand le réglage est actif, le moteur SHALL constituer un paquet formé des 8 missions générales
suivantes et d'une mission « éliminer <joueur> » pour chaque joueur de la partie, le mélanger avec la
graine de la partie et en attribuer une à chaque joueur à la création :

1. Conquérir l'Amérique du Nord et l'Afrique.
2. Conquérir l'Amérique du Nord et l'Océanie.
3. Conquérir l'Asie et l'Amérique du Sud.
4. Conquérir l'Asie et l'Afrique.
5. Conquérir l'Europe, l'Amérique du Sud et un troisième continent au choix.
6. Conquérir l'Europe, l'Océanie et un troisième continent au choix.
7. Conquérir 24 territoires.
8. Occuper 18 territoires avec au moins 2 armées sur chacun.

#### Scenario: Taille du paquet

- **WHEN** on crée une partie à 4 joueurs avec missions
- **THEN** le paquet compte 12 missions et chaque joueur en tire exactement une, aucune carte n'étant tirée deux fois

#### Scenario: Attribution déterministe

- **WHEN** on crée deux parties avec missions, la même graine et les mêmes joueurs
- **THEN** chaque joueur reçoit la même mission dans les deux parties

### Requirement: Mission désignant son détenteur

Un joueur qui tire la mission « éliminer » le désignant lui-même SHALL recevoir à la place la mission
« Conquérir 24 territoires ».

#### Scenario: Propre élimination tirée

- **WHEN** Alice tire la mission « éliminer Alice »
- **THEN** sa mission est « Conquérir 24 territoires »

### Requirement: Conversion d'une mission d'élimination

Quand la cible d'une mission « éliminer » est éliminée par un autre joueur que le détenteur de la
mission, cette mission SHALL devenir « Conquérir 24 territoires », et un événement de conversion
destiné au seul détenteur SHALL être produit.

#### Scenario: Cible éliminée par un tiers

- **WHEN** la mission de Bob est « éliminer Carol » et qu'Alice élimine Carol
- **THEN** la mission de Bob devient « Conquérir 24 territoires » et un événement de conversion concernant Bob est produit

### Requirement: Accomplissement et victoire

Après chaque action du joueur courant, le moteur SHALL vérifier sa mission ; si elle est accomplie,
la partie SHALL se terminer immédiatement avec ce joueur pour vainqueur et un événement de mission
accomplie, y compris au milieu d'une phase d'attaque. Si la mission est accomplie par une conquête,
le déplacement minimal après conquête SHALL être effectué automatiquement avant la fin, pour qu'aucun
territoire ne reste sans armée. Une mission de continents SHALL être accomplie
quand le joueur possède tous les territoires des continents exigés (et d'au moins un autre continent
complet pour les missions à continent au choix). La mission d'élimination SHALL être accomplie quand
le détenteur élimine lui-même sa cible. L'élimination de tous les adversaires SHALL rester une
victoire.

#### Scenario: Mission accomplie par une conquête

- **WHEN** la mission d'Alice est « Amérique du Nord et Océanie », qu'elle possède déjà toute l'Amérique du Nord et 3 territoires d'Océanie, et qu'elle conquiert le quatrième
- **THEN** la partie se termine aussitôt, Alice gagne, le déplacement minimal est effectué automatiquement et aucun déplacement n'est demandé

#### Scenario: Continent au choix manquant

- **WHEN** la mission d'Alice est « Europe, Amérique du Sud et un troisième continent » et qu'elle ne possède que l'Europe et l'Amérique du Sud
- **THEN** la mission n'est pas accomplie

#### Scenario: Dix-huit territoires à deux armées

- **WHEN** la mission d'Alice est « 18 territoires avec au moins 2 armées » et qu'elle possède 20 territoires dont 18 avec au moins 2 armées après un déploiement
- **THEN** la partie se termine et Alice gagne

#### Scenario: Élimination de sa cible

- **WHEN** la mission de Bob est « éliminer Carol » et que Bob conquiert le dernier territoire de Carol
- **THEN** la partie se termine et Bob gagne

#### Scenario: Mission d'un autre joueur

- **WHEN** pendant le tour d'Alice, la situation remplit la mission de Bob
- **THEN** la partie continue ; la mission de Bob sera vérifiée après ses propres actions

### Requirement: Mission privée

La mission d'un joueur SHALL faire partie de l'état sauvegardé mais SHALL NOT figurer dans
l'information visible des autres joueurs.

#### Scenario: Vue d'un adversaire

- **WHEN** on construit l'information visible d'Alice
- **THEN** elle contient la mission d'Alice et aucune mission des autres joueurs
