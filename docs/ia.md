# Les IA de Risky

Ce document décrit, en clair, comment jouent les quatre niveaux d'IA : facile, normal, difficile et
expert, en partie classique puis dans les variantes missions secrètes et mode capitales.
Il reflète le code de `src/ai/` tel qu'il est implémenté, réglages issus du tournoi compris.

## Règles communes à tous les niveaux

### Ce que l'IA voit

L'IA ne triche pas. Elle ne connaît que :

- les propriétaires et les armées de chaque territoire ;
- la phase en cours, le joueur courant, les réglages de la partie et le nombre d'échanges déjà faits ;
- le **nombre** de cartes de chaque joueur ;
- le **contenu** de sa propre main ;
- avec les missions secrètes, **sa propre mission** ;
- en mode capitales, **sa propre capitale** pendant la phase de choix, puis toutes les capitales une
  fois révélées.

Elle ne voit ni l'ordre de la pioche, ni la défausse, ni les mains adverses, ni les missions
adverses, ni les capitales déjà choisies par les autres avant la révélation, ni l'état du générateur
aléatoire de la partie. Deux parties qui ne diffèrent que par ces informations cachées lui font
prendre exactement la même décision.

### Décisions reproductibles

Pour une même situation visible, une IA d'un niveau donné prend toujours la même décision. Quand un
niveau a besoin de hasard (le facile surtout), il tire ce hasard d'une empreinte de ce qu'il voit, et
non du générateur de la partie. Une partie entre IA relancée avec la même graine se rejoue donc à
l'identique. Sa mission n'entre pas dans cette empreinte : le facile, qui l'ignore, joue de la même
façon quelle qu'elle soit.

### Probabilités de combat

Le normal et le difficile évaluent chaque attaque par la **probabilité de conquérir** le territoire
en attaquant jusqu'au bout, avec le nombre maximal de dés autorisé par les réglages de la partie.

- Le calcul est exact jusqu'à 100 armées de chaque côté.
- Au-delà, les deux effectifs sont réduits dans le même rapport pour que le plus grand vaille 100 :
  2000 contre 600 est évalué comme 100 contre 30. Dans ces très grosses batailles, l'IA sous-estime
  légèrement ses chances.

Quelques repères avec les dés par défaut (3 en attaque, 2 en défense), l'attaquant comptant
l'armée qui doit rester sur place :

| Attaque contre défense | Probabilité de conquête |
|---|---|
| 2 contre 1 | 0,42 |
| 4 contre 2 | 0,66 |
| 5 contre 3 | 0,64 |
| 5 contre 4 | 0,48 |
| 6 contre 5 | 0,51 |
| 8 contre 3 | 0,91 |

En mode capitales, le dé le plus haut du défenseur d'une capitale compte +1. L'IA en tient compte
exactement, dans ses attaques comme dans son estimation de la menace :

| Attaque contre une capitale | Sans bonus | Avec bonus |
|---|---|---|
| 2 contre 1 | 0,42 | 0,28 |
| 4 contre 2 | 0,66 | 0,49 |
| 6 contre 3 | 0,77 | 0,59 |
| 8 contre 5 | 0,74 | 0,51 |

### Notions utilisées

- **Frontière** : territoire de l'IA dont au moins un voisin appartient à quelqu'un d'autre
  (armée neutre comprise).
- **Intérieur** : territoire de l'IA dont tous les voisins lui appartiennent.
- **Adversaires** : joueurs encore en jeu, hors armée neutre. La neutre se défend mais n'attaque
  jamais : elle ne représente aucune menace et on ne cherche jamais à l'éliminer.
- **Entrées d'un continent** : territoires du continent qui touchent un autre continent. Océanie 1,
  Amérique du Sud 2, Afrique 3, Amérique du Nord 3, Europe 4, Asie 5.
- **Intérêt d'un continent** : part du continent détenue × bonus du continent ÷ nombre d'entrées,
  multiplié par 3 s'il ne manque qu'un territoire et par 1,5 s'il en manque deux. L'Océanie et
  l'Amérique du Sud, petites et faciles à tenir, ressortent donc en premier.
- **Continent visé** : continent pas encore entièrement détenu dont l'intérêt est le plus grand.
- **Menace sur une frontière** : somme, sur chaque voisin adverse, de ses armées multipliées par sa
  probabilité de conquérir la frontière.

### Garde-fous

- Avec 5 cartes ou plus en main, l'échange est obligatoire : tous les niveaux échangent avant de
  déployer.
- Une IA met fin à ses attaques après 60 attaques dans le même tour, quelle que soit sa stratégie.
- Une décision prend moins de 50 ms aux niveaux facile, normal et difficile ; voir plus bas le
  temps de réflexion de l'expert.

### Noms

Chaque IA reçoit, dans le formulaire de création, un nom tiré au hasard parmi vingt chefs de guerre
historiques : Jules César, Hannibal, Attila, Léonidas, Sun Tzu, Vercingétorix, Boudica, Zénobie,
Charlemagne, Saladin, Gengis Khan, Jeanne d'Arc, Tokugawa Ieyasu, Vauban, Napoléon, Wellington,
Chaka, Foch, De Gaulle et Joukov. Deux joueurs d'une même partie
ne portent jamais le même nom. Un joueur humain passé en IA reçoit un nom de la liste ; une IA
repassée en humain reprend un nom numéroté (« Joueur 2 »). Les noms restent modifiables.

### Rythme à l'écran

Les actions d'une IA s'enchaînent seules, une par une :

- 700 ms entre deux actions en vitesse normale, 300 ms en rapide, aucune pause en instantanée ;
- l'IA réfléchit pendant cette pause : une décision plus courte ne retarde rien, une décision plus
  longue fait jouer l'action dès qu'elle est prise ;
- avant chaque attaque, le territoire d'origine et la cible sont mis en avant sur le plateau, au
  moins la moitié de la pause quand la décision a été longue ;
- pendant le tour d'une IA, le HUD affiche « <nom> réfléchit… » et ne propose aucune commande ;
  au-delà d'une demi-seconde de réflexion, trois points animés s'y ajoutent ;
- les décisions sont calculées à part (dans un Web Worker) : le plateau reste fluide pendant que
  l'IA réfléchit ;
- si un humain vient de piocher une carte, l'IA suivante attend qu'il ait fermé l'avis ;
- en mode capitales, l'IA attend que l'annonce de révélation des capitales ait été fermée ;
- quitter la partie arrête l'IA.

## Niveau facile

Le facile joue sans plan, disperse ses forces et n'attaque qu'en net avantage.

| Phase | Comportement |
|---|---|
| Revendication | Un territoire libre au hasard. |
| Placement initial | Une armée sur une de ses frontières, au hasard. |
| Échange de cartes | Seulement quand c'est obligatoire (5 cartes ou plus), avec la première série valide de sa main. |
| Renforts | Sur une frontière tirée au hasard, par paquets aléatoires d'au plus la moitié de la réserve, jusqu'à épuisement. Jamais sur un territoire intérieur. |
| Attaque | Uniquement si le territoire d'origine compte au moins 4 armées et au moins deux fois les armées de la cible. Choisit au hasard parmi les attaques qui remplissent ces conditions. S'arrête après 3 conquêtes dans le tour. |
| Après une conquête | Un nombre d'armées tiré au hasard entre le minimum et le maximum autorisés. |
| Fortification | Prend un territoire intérieur au hasard qui peut rejoindre une frontière et y envoie toutes ses armées sauf une ; passe s'il n'y en a pas. |

Exemple : avec 5 armées face à 3, le facile n'attaque pas (il lui en faudrait 6). Avec 6 contre 3,
il attaque.

## Niveau normal

Le normal vise un continent, concentre ses renforts sur ce front et attaque quand ses chances sont
bonnes.

| Phase | Comportement |
|---|---|
| Revendication | Le territoire libre qui fait le plus progresser vers un continent intéressant, en évitant les continents déjà disputés. En pratique, l'Océanie d'abord, puis l'Amérique du Sud. |
| Placement initial | Une armée sur son territoire de front (voir Renforts). |
| Échange de cartes | Dès qu'il a une série. Il choisit la série qui rapporte le plus d'armées, bonus de +2 compris, en gardant ses jokers quand cela ne coûte rien. |
| Renforts | **Toute** la réserve sur un seul territoire : la frontière voisine d'un territoire adverse du continent visé d'où l'attaque aurait les meilleures chances, renforts compris. À défaut, la frontière d'où il aurait les meilleures chances contre n'importe quel voisin. Jamais sur un territoire intérieur. |
| Attaque | Seulement si la probabilité de conquête vaut au moins **0,6**. Parmi ces attaques, il préfère celles qui visent son continent cible (+1) et celles qui achèvent un continent (+1), puis les plus sûres. Il enchaîne tant qu'une attaque passe ce seuil. |
| Après une conquête | Avance tout si le territoire d'origine n'a plus de voisin adverse ; le minimum si le territoire conquis n'a aucun voisin adverse ; sinon la moitié des armées du territoire d'origine. |
| Fortification | Prend son territoire intérieur le plus fourni (au moins 2 armées) et envoie toutes ses armées sauf une vers la frontière atteignable la plus menacée ; passe s'il n'y en a pas. |

Exemples :

- Il tient 3 des 4 territoires de l'Océanie : il déploie tous ses renforts à côté du quatrième, puis
  l'attaque.
- 5 contre 3 (0,64) : il attaque. 6 contre 5 (0,51) ou 5 contre 4 (0,48) : il n'attaque pas.
- Un territoire intérieur de 6 armées voisin d'une frontière : il en déplace 5 vers cette frontière.

## Niveau difficile

Le difficile reprend la stratégie du normal et y ajoute quatre priorités : éliminer, casser les
continents adverses, défendre selon la menace et garder ses cartes.

### Attaques prioritaires

Avant son plan habituel, le difficile cherche, dans cet ordre :

1. **Une élimination rentable** : un adversaire qui n'a plus que 1 à 3 territoires, qui détient au
   moins une carte, et que le difficile peut éliminer dans le tour avec une probabilité d'au moins
   0,5. Cette probabilité est le produit des meilleures chances contre chacun de ses territoires.
   Éliminer un joueur rapporte ses cartes.
2. **Un continent adverse à casser** : un territoire d'un continent entièrement tenu par un
   adversaire, attaquable avec une probabilité d'au moins **0,5**.

S'il n'y a ni l'un ni l'autre, il attaque comme le normal. Une différence : tant qu'il n'a rien
conquis dans le tour, il accepte une probabilité de 0,5 au lieu de 0,6, pour s'assurer une carte en
fin de tour.

Exemples :

- Un adversaire tient toute l'Amérique du Sud et le difficile peut prendre le Venezuela à 6 contre 5
  (0,51) : il attaque. Le normal, lui, ne le ferait pas.
- Un adversaire n'a plus qu'un territoire et 3 cartes, attaquable avec une probabilité d'au moins
  0,5 : le difficile l'attaque avant tout le reste.

### Renforts

- Si une élimination ou une casse de continent devient possible grâce à la réserve, **toute** la
  réserve va sur le territoire d'où lancer cette attaque.
- Sinon, il répartit ses renforts **selon la menace** sur chacune de ses frontières. Il vise une
  répartition finale des armées de frontière proportionnelle à la menace, et renforce d'abord la
  frontière la plus en retard sur cet objectif. Le territoire de front vers le continent visé reçoit
  en plus un poids offensif égal à trois fois la menace totale, soit environ 75 % de l'effort.
- Sans aucune menace, tout va sur le territoire de front.

### Cartes

- Barème fixe : il échange dès qu'il a une série, comme le normal.
- Barème progressif : il **garde ses cartes** tant que l'échange n'est pas obligatoire, sauf si les
  armées de l'échange rendent possible une attaque prioritaire qui ne l'était pas sans elles.

Exemple : en barème progressif, avec 4 cartes formant une série et aucune attaque prioritaire, il
n'échange pas ce tour-ci.

### Autres phases

| Phase | Comportement |
|---|---|
| Revendication | Prend en priorité le dernier territoire libre d'un continent dont tous les autres territoires appartiennent à un même adversaire, pour l'empêcher de le compléter ; sinon comme le normal. |
| Placement initial | Une armée, placée selon sa logique de renforts. |
| Après une conquête | Comme le normal. |
| Fortification | Comme le normal, mais vers son territoire de front offensif s'il est atteignable ; sinon vers la frontière la plus menacée. |

## Niveau expert

L'expert joue comme le difficile, sauf pour ses deux décisions les plus lourdes de conséquences :
où déployer ses renforts et quelle attaque lancer. Pour celles-là, au lieu d'appliquer une règle,
il essaie plusieurs possibilités et regarde ce qu'elles donnent.

### Les possibilités comparées

| Décision | Possibilités |
|---|---|
| Déploiement | Le choix du difficile ; toute la réserve sur l'une des 3 frontières d'où l'attaque est la plus prometteuse ; toute la réserve sur l'une des 2 frontières les plus menacées. |
| Attaque | Le choix du difficile ; arrêter d'attaquer ; l'une des 4 attaques aux meilleures chances de conquête, à partir d'une chance sur quatre. |

Au plus six possibilités, sans doublon. Quand il n'en reste qu'une, il la joue sans réfléchir.

### Comment il les compare

Pour chaque possibilité, l'expert imagine 24 fois la suite :

1. il distribue au hasard les cartes qu'il ne voit pas entre les mains adverses (en respectant le
   nombre de cartes de chacun) et la pioche ;
2. il joue la possibilité, puis la fin de son tour et le tour de chaque adversaire, tous joués
   comme par le difficile, avec des dés tirés au hasard ;
3. il évalue la position atteinte au début de son tour suivant.

Les possibilités sont comparées sur les mêmes 24 distributions et les mêmes dés : une possibilité
ne gagne pas parce qu'elle a eu de la chance. Il retient celle dont la position moyenne est la
meilleure, et le choix du difficile en cas d'égalité.

La position vaut 1 s'il a gagné, 0 s'il est éliminé, et sinon sa part de la force des joueurs
encore en jeu (neutre exclu), la force d'un joueur valant :

> armées + 3 × renforts attendus au prochain tour + nombre de cartes

### Loyauté et reproductibilité

L'expert ne voit rien de plus que les autres niveaux : les mains adverses et la pioche qu'il
imagine ne sont que des hypothèses compatibles avec ce qu'il voit. Ses tirages au hasard sont
dérivés de l'empreinte de sa vue : une même situation donne toujours la même décision, et une partie
entre IA rejouée avec la même graine se déroule à l'identique.

### Mode classique uniquement

L'expert n'est proposé qu'en partie classique : dès qu'une variante est cochée, le choix « Expert »
est grisé et le niveau revient à difficile. Ses simulations ignorent en effet les missions et les
capitales. Si une IA experte se retrouve malgré tout dans une variante, elle joue exactement comme
le difficile.

### Temps de réflexion

Le nombre de simulations est fixe, pas le temps : c'est ce qui garantit la reproductibilité. Sur un
ordinateur portable récent, une décision prend en moyenne 77 ms, 95 % d'entre elles moins de 240 ms
et la plus longue du tournoi 729 ms ; elle reste le plus souvent cachée dans la pause entre deux
actions.

## Variantes

### Missions secrètes

Le facile ignore sa mission : il joue exactement comme en partie classique et ne gagne par sa
mission que par hasard. Le normal et le difficile orientent leur plan vers elle.

| Mission | Comportement du normal et du difficile |
|---|---|
| Conquérir des continents | Le continent visé est celui que la mission exige et qui manque encore, le plus intéressant d'abord. Une fois les continents exigés tenus, ou pour le « troisième continent au choix », il revient au continent le plus intéressant. |
| Conquérir 24 territoires | Il attaque les territoires faibles (2 armées ou moins) dès une probabilité de 0,5 au lieu de 0,6, pour multiplier les conquêtes. |
| Occuper 18 territoires avec 2 armées | Il laisse au moins 2 armées des deux côtés après une conquête quand c'est possible, et en garde 2 sur un territoire intérieur qu'il dégarnit en fortifiant. |
| Éliminer un joueur | Il attaque les territoires de sa cible dès une probabilité de 0,5. Le normal leur donne une forte prime (+3) et évite d'éliminer quelqu'un d'autre (−2), ce qui lui ferait perdre sa mission au profit de « Conquérir 24 territoires ». Le difficile en fait sa priorité absolue, avant les éliminations rentables et la casse de continents, et ne cherche plus à éliminer les autres joueurs. |

### Mode capitales

**Choix de la capitale**, fait sans connaître le choix des autres :

- le facile prend son territoire le plus garni en armées ;
- le normal et le difficile prennent le territoire le moins menacé, de préférence un territoire
  intérieur, puis le plus garni en armées.

**Pendant la partie**, le facile joue comme en partie classique, en subissant seulement le bonus de
défense des capitales. Le normal et le difficile ajoutent trois règles, prioritaires sur tout le
reste :

| Situation | Comportement |
|---|---|
| Sa capitale est menacée | Si elle compte moins d'armées que l'ensemble des armées adverses voisines et que sa réserve suffit à combler l'écart, il y déploie **toute** sa réserve. Exemple : capitale de 3 armées face à 6, réserve de 5 : les 5 vont sur la capitale. |
| Sa capitale est tombée | Sa reconquête devient sa première attaque dès une probabilité de 0,5. |
| Une capitale adverse est attaquable | Il l'attaque dès une probabilité de 0,5, bonus de défense compris, avant ses autres attaques. Exemple : 8 contre 5 (0,51) : il attaque ; 4 contre 2 (0,49) : il s'abstient, alors que contre un territoire ordinaire (0,66) il attaquerait. |

Le difficile ajoute un **mode « dernière capitale »** : dès qu'il tient toutes les capitales sauf
une, il déploie toute sa réserve sur celui de ses territoires voisins de cette capitale qui compte le
plus d'armées. S'il n'en a aucun, il prend son territoire le plus proche de la capitale, en nombre de
territoires traversés.

## Écart de force mesuré

Tournoi de référence : 60 parties à trois joueurs (un facile, un normal, un difficile) sur des
graines fixées, chacun des six ordres de jeu représenté 10 fois. Il est joué aux réglages par
défaut, puis avec chaque variante.

| Niveau | Classique | Missions secrètes | Mode capitales |
|---|---|---|---|
| Facile | 0 | 3 | 0 |
| Normal | 27 | 25 | 28 |
| Difficile | 33 (55 %) | 32 (53 %) | 32 (53 %) |

En mode capitales, une partie dure 22 tours en médiane et 56 au plus.

En partie classique et en mode capitales, le facile ne gagne aucune partie du tournoi ; avec les
missions secrètes, il en gagne quelques-unes sans jamais poursuivre sa mission. Il n'est pas éliminé
en premier plus souvent que les autres : il se défend assez pour durer, mais ses renforts dispersés,
ses attaques rares, son plafond de 3 conquêtes et l'absence de bonus de continent l'empêchent de
finir une partie. Il est conçu pour être battable par un débutant humain.

### Expert contre difficile

Tournoi expert (`pnpm test:expert`) : 60 parties à trois joueurs en partie classique, une IA experte
contre deux IA difficiles, sur des graines fixées, l'expert occupant chaque place 20 fois. L'expert
en gagne 41 (68 %), là où le hasard seul lui en donnerait un tiers ; le seuil exigé est de 30.
