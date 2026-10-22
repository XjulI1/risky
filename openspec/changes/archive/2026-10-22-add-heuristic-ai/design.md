# Design

## Context

Le moteur expose `applyAction` et des requêtes en lecture ; la session de jeu de `add-game-ui`
centralise `dispatch` et la file de présentation. L'IA vient se brancher entre les deux : elle lit
l'état, choisit une action, et la session la soumet comme pour un humain. Motivation : proposal.md ;
exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Une IA pure : `chooseAction(view, level) → Action`, testable sans interface, rejouable.
- Une seule boucle de jeu automatique, utilisée à l'identique dans l'application et dans les tests
  de tournoi.
- Des heuristiques lisibles et réglables par constantes, sans apprentissage.

**Non-Goals :**

- Pas de Web Worker : une décision heuristique coûte bien moins d'une frame ; un worker compliquerait
  la synchronisation avec la file d'animations sans gain mesurable.
- Pas de recherche arborescente ni de simulation de parties.

## Decisions

### Arborescence

```
src/ai/
  index.ts                 chooseAction, playUntilHumanOrEnd (boucle automatique)
  playerView.ts            projection de l'état sur l'information visible
  aiRandom.ts              aléa déterministe dérivé de la vue
  combatOdds.ts            table exacte des probabilités de conquête
  evaluation.ts            frontières, menace, valeur des continents
  levels/easy.ts, levels/normal.ts, levels/hard.ts
  tournament.test.ts       tournoi de référence
```

`src/ai/**` est ajouté à la règle ESLint qui interdit `vue`, `three` et `@tresjs/*`.

### Vue joueur : l'anti-triche par le type

`playerView(state, playerId)` produit un type `PlayerView` qui ne contient ni pioche, ni défausse
détaillée, ni état du générateur, ni mains adverses (remplacées par leur taille). Les fonctions de
`levels/` ne reçoivent que ce type : accéder à une information cachée devient une erreur de typage,
pas une discipline. Les tests de la spec (mains et pioches différentes → même action) vérifient en
plus le comportement.

Pour valider ses propres actions, l'IA s'appuie sur les requêtes du moteur, qui n'ont besoin que de
la partie publique de l'état ; ces requêtes sont typées pour accepter une `PlayerView`.

### Aléa déterministe sans stockage

Les niveaux facile et normal ont besoin d'un peu d'aléa (départager des ex aequo, disperser des
renforts). Utiliser le générateur de la partie divulguerait les futurs dés et modifierait la suite
des tirages ; stocker un générateur propre à l'IA obligerait à changer l'état du moteur. Choix :
la graine de l'IA est un hachage (FNV-1a) de la `PlayerView` sérialisée et du niveau. Même vue → même
décision ; aucune donnée cachée n'entre dans la graine.

### Probabilités de combat

`combatOdds` calcule d'abord la distribution exacte des pertes d'un lancer pour chaque couple
(dés attaquant, dés défenseur) par énumération des 6^n combinaisons, puis la probabilité de conquête
« jusqu'au bout » par programmation dynamique sur (armées attaquantes, armées défensives), avec les
dés maximaux de la partie. La table est calculée à la demande jusqu'à 100 × 100 et mémorisée par jeu
de réglages de dés ; la borne de 100 est arbitraire, elle limite seulement la taille de la table.
Au-delà, les deux effectifs sont réduits dans le même rapport pour que le plus grand vaille 100
(2000 contre 600 est évalué comme 100 contre 30). Un simple plafond ramènerait 2000 contre 600 à
100 contre 100 : l'IA dominante n'attaquerait plus un adversaire retranché et la partie ne finirait
pas. La réduction est une approximation prudente : à rapport égal, de grosses armées ont des issues
plus tranchées que de petites, donc l'IA sous-estime légèrement ses chances dans ces grosses batailles.

### Structure d'une décision

Chaque niveau implémente une fonction par phase : `claim`, `place`, `trade`, `deploy`, `attack`,
`conquestMove`, `fortify`. `chooseAction` aiguille sur la phase de la vue. Les fonctions de phase
renvoient toujours une action légale ; en dernier recours, l'action de sortie de phase (`endAttack`,
`skipFortify`).

Garde-fou de terminaison : l'IA met fin à ses attaques après 60 attaques dans le même tour (compteur
dérivé des événements du tour, transmis par la boucle automatique).

### Heuristiques

- **Évaluation de continent** (normal, difficile) :
  `score = (territoires possédés / total) × bonus / nombre de territoires frontaliers du continent`,
  avec une forte prime quand il ne manque qu'un ou deux territoires.
- **Menace sur une frontière** (difficile) : somme des armées adverses voisines pondérée par la
  probabilité de conquête de chaque voisin contre ce territoire.
- **Déplacement après conquête** : tout déplacer si le territoire d'origine devient intérieur, sinon
  équilibrer selon la menace sur les deux territoires.
- **Revendication manuelle** (normal, difficile) : territoires du continent visé, en commençant par
  l'Océanie et l'Amérique du Sud, faciles à tenir.

Toutes les constantes (seuils de probabilité, primes) sont regroupées en tête de chaque fichier de
niveau pour être ajustées pendant la mise au point du tournoi.

### Intégration à la session

`useGameSession` observe le joueur courant : si c'est une IA et qu'aucune présentation n'est en cours,
il calcule l'action, met en avant origine et cible pour une attaque, attend le délai de la vitesse
courante, puis appelle `dispatch`. La boucle s'arrête dès que le joueur courant est humain ou que la
partie est finie. Quitter la partie annule le délai en attente.

### Moteur et création de partie

Le type de joueur du moteur devient `{ kind: 'human' } | { kind: 'ai'; level: AiLevel }`. Le
formulaire de création ajoute pour chaque joueur un choix Humain / IA, et un seul choix de niveau,
appliqué à toutes les IA de la partie. Chaque IA reçoit un nom tiré au hasard dans une liste
d'une vingtaine de chefs de guerre historiques (`AI_NAMES` dans `src/game/gameForm.ts`), parmi les
noms qu'aucun joueur ne porte encore ; le tirage se fait dans le formulaire, avec un générateur
injectable pour les tests. Le moteur garde un niveau par joueur : le tournoi de référence
et le test de robustesse font s'affronter des niveaux différents dans une même partie ; c'est le
formulaire qui impose un niveau commun. L'écran de passage de main n'apparaît qu'entre deux humains,
comme déjà spécifié.

## Risks / Trade-offs

- [Le tournoi ne montre pas la progression attendue] → constantes centralisées et tournoi rapide à
  relancer ; ajuster les heuristiques avant d'assouplir le critère.
- [Tournoi trop lent pour la suite de tests] → 60 parties en vitesse moteur pure, sans animation ;
  si la durée dépasse 20 s, l'isoler dans un script `pnpm test:ai` hors de la suite principale.
- [Parties entre IA très longues, voire bloquées en équilibre] → plafond de 500 tours dans la boucle
  de test, comptabilisé comme échec explicite.
- [Hachage de la vue coûteux] → la vue fait quelques kilo-octets ; mesurer seulement si la limite de
  50 ms par décision est approchée.
