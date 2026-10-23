# Design

## Context

Motivation et chiffres du prototype : proposal.md ; exigences : `specs/`.

État actuel :

- `src/ai/index.ts` expose `chooseAction(view, level, turn)`, qui aiguille vers une `Strategy` par
  niveau. Il expose aussi `progressAfter` et `nextAiAction`, ainsi que la boucle `playUntilHumanOrEnd`.
- `useGameSession` appelle `nextAiAction` de façon synchrone, puis joue l'action après le délai
  `aiAction` de la vitesse courante : 700 ms en normal, 300 ms en rapide, 0 en instantané.
- `applyAction` copie l'état entier avec `structuredClone`, puis applique des fonctions de règles qui
  modifient cette copie sur place.
- Le niveau commun des IA est choisi dans `CreateGameScreen.vue` ; `AI_LEVELS` existe en double,
  dans `src/engine/setup.ts` pour la validation et dans `src/game/gameForm.ts` pour le formulaire.

Le prototype (`src/ai/expert/`, sur la branche `feat/monte-carlo-ai-prototype`) sert de point de
départ. Une partie à 4 IA difficiles se simule en environ 94 ms : la moitié du temps va à la copie
de l'état, l'autre moitié à la décision heuristique.

## Goals / Non-Goals

**Goals :**

- Intégrer le prototype comme niveau `expert` du moteur et de l'IA, sans changer le comportement
  des trois niveaux existants.
- Calculer toutes les décisions des IA dans un Web Worker, avec un seul chemin d'exécution pour tous
  les niveaux.
- Garder l'IA déterministe et sans accès à l'information cachée, y compris dans le worker.

**Non-Goals :**

- Optimiser les heuristiques du niveau difficile, qui servent aussi de modèle des adversaires
  pendant les simulations.
- Mettre en parallèle les simulations sur plusieurs workers.
- Ajouter le tournoi expert à `pnpm test`.

## Decisions

### Simulation sur le moteur, modifié sur place

`applyActionInPlace(state, action)` partage le code d'`applyAction` (vérifications du tour et de la
phase, application des règles, fin de partie), sans la copie. `applyAction` devient
« copie puis `applyActionInPlace` ». Les fonctions de règles valident avant de modifier, donc une
action refusée ne laisse pas d'état partiel ; la JSDoc interdit tout de même de réutiliser l'état
après un refus. Une action refusée pendant une simulation est un bug : elle lève une exception.

*Alternative écartée :* un simulateur dédié, avec un état allégé et une copie des règles. La copie
de l'état ne représente que la moitié du coût, si bien qu'il n'apporterait pas plus que l'exécution
sur place. Il dupliquerait en revanche toutes les règles, avec un risque de divergence qu'il faudrait
surveiller par des tests comparatifs.

### Monte-Carlo à plat sur des candidats heuristiques

Pour un déploiement ou une attaque, l'Expert construit la liste des candidats : le choix du
difficile en premier, puis les alternatives décrites dans la spec, sans doublons. Il évalue chaque
candidat sur `samples` mondes, avec 24 mondes par défaut. Les candidats sont au plus 6 : en
déploiement, le choix du difficile, 3 frontières offensives et 2 menacées ; en attaque, le choix du
difficile, la fin des attaques et 4 attaques. Le mieux noté l'emporte, et le premier en cas
d'égalité, c'est-à-dire le choix du difficile. Les décisions qui ne sont pas cherchées sont celles du
difficile, comme les phases où le difficile n'offre qu'un seul candidat.

*Alternatives écartées :*

- un MCTS, qui demande bien plus de simulations pour un même budget, avec un facteur de
  branchement élevé (dés, choix de cibles) ;
- une recherche sur le tour entier, avec des plans combinant déploiement et attaques, dont
  l'espace des candidats explose. Décider action par action reste lisible et suffit à obtenir le
  gain mesuré.

### Mondes compatibles avec la vue, comparés à chance égale

`determinize(view, random)` construit un `GameState` complet à partir de la vue :

- les cartes que la vue ne montre pas (le paquet de `buildDeck` moins la main de l'Expert) sont
  mélangées, puis distribuées selon `handSizes` ;
- le reste forme la pioche, et la défausse est vide ;
- `rngState` est tiré du générateur de l'IA.

Le contenu réel de la défausse est inconnu de la vue ; le mettre dans la pioche est une
approximation qui ne change que l'ordre des cartes piochées.

Pour chaque monde, chaque candidat part d'une copie du même état, donc avec les mêmes mains et les
mêmes dés. Cette comparaison à chance égale réduit fortement la variance par rapport à des tirages
indépendants.

### Horizon d'un tour de table et évaluation

Une simulation joue tous les joueurs avec `chooseAction(…, 'hard', …)`, jusqu'au début du tour
suivant de l'Expert ou jusqu'à la fin de la partie, avec un plafond de 1500 actions. La position
est ensuite évaluée comme la part de force de l'Expert, la force valant
`armées + 3 × renforts attendus + 1 × cartes`. Les joueurs neutres et éliminés sont exclus. Une
victoire vaut 1, une élimination 0.

*Alternative écartée :* simuler jusqu'à la fin de la partie, soit environ 100 ms par simulation et
une vingtaine de simulations par seconde, ce qui laisse trop de bruit pour départager les candidats.

### Déterminisme : un budget en nombre de simulations, pas en temps

Le générateur de l'Expert est `aiRandom(view, 'expert')`, déjà dérivé du hachage de la vue. Le
budget est un nombre fixe de mondes. Un budget en millisecondes rendrait la décision dépendante de la
machine et de sa charge, et casserait l'exigence de partie rejouable à l'identique. Le temps reste
borné par le nombre de candidats, le nombre de mondes et le plafond d'actions par simulation ; les
temps réels sont vérifiés par le tournoi expert.

### Organisation du code et dépendances circulaires

Le prototype importe `chooseAction` depuis `src/ai/index.ts`, qui devra lui-même déléguer à
l'Expert : c'est un cycle. L'organisation retenue l'évite :

```
src/ai/
  heuristic.ts        chooseHeuristicAction(view, level: HeuristicLevel, turn), NEW_TURN,
                      MAX_ATTACKS_PER_TURN, progressAfter (déplacés depuis index.ts)
  expert/
    determinization.ts, positionValue.ts, rollout.ts, expert.ts
    expert.test.ts, expertTournament.test.ts
  index.ts            chooseAction(view, level, turn) : expert → expertAction si mode classique,
                      sinon chooseHeuristicAction avec le niveau difficile pour l'expert ;
                      nextAiAction, playUntilHumanOrEnd ; réexporte heuristic.ts
  worker.ts           point d'entrée du Web Worker
```

`expert/` n'importe que `heuristic.ts`, jamais `index.ts`. Dans le moteur, `AiLevel` devient
`'easy' | 'normal' | 'hard' | 'expert'` ; `HeuristicLevel = Exclude<AiLevel, 'expert'>` type la
table des stratégies. Le formulaire importe la liste des niveaux du moteur au lieu de la dupliquer.

### Web Worker : la vue part, l'action revient

Le fil principal construit la `PlayerView` et l'envoie au worker avec le niveau et la progression du
tour ; le worker répond par l'action, accompagnée de l'identifiant de la requête. L'état complet,
pioche et mains adverses comprises, ne quitte donc jamais le fil principal : le typage anti-triche
s'applique aussi au worker. La vue est un objet JSON de quelques kilo-octets, que `postMessage` copie
en moins d'une milliseconde.

Côté application, un `AiDecider` est injecté dans `useGameSession` :

```ts
type AiDecider = {
  decide: (view: PlayerView, level: AiLevel, turn: TurnProgress) => Promise<Action>
  dispose: () => void
}
```

- `createWorkerDecider()` crée le worker avec
  `new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' })`, que Vite compile
  en un fichier JS séparé. Il associe chaque réponse à sa requête et rejette les requêtes en attente
  à `dispose`, qui termine le worker.
- `createInlineDecider()` appelle `chooseAction` directement. Il sert dans les tests (happy-dom n'a
  pas de Worker) et de repli quand `Worker` n'existe pas.

Tous les niveaux passent par le worker. Un seul chemin d'exécution est plus simple à tester, et le
surcoût est négligeable pour les niveaux heuristiques.

### Rythme, mise en avant et indicateur dans la session

`scheduleAiAction` devient asynchrone et associe à chaque décision un numéro de passage, qu'il
incrémente à chaque fois :

1. il lance en même temps la décision (`decider.decide`) et le délai `aiAction` de la vitesse ;
2. il programme à 500 ms le passage de `aiThinking` à vrai, et l'annule dès que la décision arrive ;
3. une fois la décision arrivée, il ignore le résultat si la session est fermée ou si le numéro de
   passage a changé ;
4. pour une attaque hors vitesse instantanée, il met en avant l'origine et la cible dès la décision
   prise ;
5. il attend la fin du délai, et pour une attaque au moins la moitié du délai après la décision ;
6. il appelle `dispatch`.

`dispose` (quitter la partie) incrémente le numéro de passage et libère le decider. Aucune action
n'est donc jouée ni sauvegardée après coup.

Le bandeau affiche, quand `aiThinking` est vrai, trois points animés après « <nom> réfléchit… ». Sous
`prefers-reduced-motion`, l'animation est remplacée par des points fixes.

### Formulaire : Expert grisé avec une variante

`gameForm.ts` gagne deux fonctions pures :

- `isLevelAvailable(level, settings)` : l'Expert n'est disponible que sans missions ni capitales ;
- `levelForSettings(level, settings)` : renvoie le difficile si l'Expert n'est pas disponible, et le
  niveau inchangé sinon.

Après chaque changement de variante, l'écran applique `levelForSettings` au niveau commun, puis
`applyAiLevel`. Le bouton Expert est `disabled` et montre la mention « Mode classique uniquement »
quand il n'est pas disponible. Le moteur accepte malgré tout un Expert dans une variante : une
partie créée autrement (tests, sauvegarde) reste jouable, et l'Expert y joue comme le difficile.

### Tournoi expert à la demande

`expertTournament.test.ts` joue les 60 parties à trois joueurs de la spec, l'Expert occupant la
place `partie % 3`. Il vérifie le seuil de 30 victoires, l'absence d'action refusée et les temps de
décision. Il ne s'exécute que si la variable d'environnement `EXPERT_TOURNAMENT` est définie, et le
script `pnpm test:expert` la positionne. Il dure environ 6 à 8 minutes, joué de façon séquentielle
pour que les temps mesurés ne soient pas faussés par d'autres calculs en parallèle.

## Risks / Trade-offs

- [Gain surestimé face à un humain : le tournoi oppose l'Expert aux IA difficiles qu'il simule
  exactement] → Accepté pour cette version ; jouer des parties réelles (tâche de fin) et, si l'écart
  ressenti est faible, envisager dans un change ultérieur des adversaires simulés plus variés.
- [Temps sur iPad 2 à 3 fois plus long que sur le portable] → Le budget mesuré sur portable
  (95e centile sous 500 ms, maximum sous 1,5 s) correspond à des pics de 2 à 3 s au plus sur
  tablette. Une vérification manuelle sur iPad est prévue ; si les décisions dépassent
  régulièrement 1 s, passer à 16 mondes. Le prototype gagnait encore 62 % avec 8 mondes.
- [Worker absent du précache, donc Expert cassé hors ligne] → Vérifier après `pnpm build` que le
  fichier du worker figure dans le manifeste de précache, puis tester une partie Expert hors ligne
  sur iPad.
- [Course entre une décision tardive et une action humaine ou un changement de partie] → Numéro de
  passage vérifié avant `dispatch`. Pendant le tour d'une IA, aucune commande de jeu n'est proposée.
- [Simulation trop longue dans un cas pathologique, par exemple une suite de conquêtes] → Plafond de
  1500 actions par simulation et de 60 attaques par tour, déjà appliqué par la boucle heuristique.
- [Écart de comportement entre le worker et l'exécution directe] → Les deux exécutent le même
  `chooseAction` sur la même vue, et un test vérifie que le decider inline et la fonction directe
  donnent la même action.

## Migration Plan

- Les sauvegardes existantes restent lisibles : le format ne change pas, et `expert` n'est qu'une
  valeur de niveau en plus.
- Une version antérieure de l'application ne saurait pas faire jouer une IA experte d'une partie
  sauvegardée. C'est sans conséquence, car l'application ne revient jamais à une version antérieure.
- Pour revenir en arrière, il suffit de retirer `expert` des niveaux proposés par le formulaire ; le
  worker peut rester en place.
