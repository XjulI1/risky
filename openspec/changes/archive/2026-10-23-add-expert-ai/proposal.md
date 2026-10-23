## Why

La V1 offre trois niveaux d'IA heuristique ; le niveau difficile suit des règles fixes et reste
prévisible. Le prototype de la branche `feat/monte-carlo-ai-prototype` montre qu'une IA qui simule
la suite de la partie avant de déployer et d'attaquer gagne 45 parties sur 60 (75 %) contre deux IA
difficiles, contre 22 sur 60 (37 %) pour une IA difficile à la même place, en environ 150 ms par
décision cherchée. Ce gain justifie d'en faire un vrai niveau de jeu : le mode Expert.

## What Changes

- **Niveau Expert** : un quatrième niveau, choisi comme les autres par le niveau commun des IA de la
  partie. Il reprend le niveau difficile pour toutes les décisions, sauf le déploiement des renforts
  et le choix des attaques : il compare alors plusieurs candidats en simulant, pour chacun, la fin de
  son tour et le tour de chaque adversaire, puis retient celui qui laisse la meilleure position.
- **Toujours loyal et rejouable** : l'Expert ne voit que ce que voient les autres niveaux. Il tire
  au hasard les mains adverses et la pioche, en restant compatible avec ce qu'il voit, et ses
  tirages découlent de sa vue : la même vue donne toujours la même décision.
- **Mode classique uniquement** : l'Expert n'est proposé que sans missions secrètes ni capitales.
  Activer une de ces variantes grise le choix Expert et ramène le niveau à Difficile.
- **Réflexion hors du fil de l'interface** : les décisions des IA sont calculées dans un Web Worker,
  si bien que le plateau reste fluide (zoom, déplacement) pendant que l'Expert réfléchit. Le délai
  de rythme et le calcul s'exécutent en même temps. Au-delà d'une courte durée, le bandeau signale
  que l'IA réfléchit.
- **Budget de réflexion** : la plupart des décisions de l'Expert restent sous la seconde sur
  tablette, avec des pics occasionnels de 2 à 3 s.
- **Tournoi Expert** : un tournoi de 60 parties contre deux IA difficiles vérifie que l'Expert en gagne
  au moins la moitié ; il est lancé à la demande (`pnpm test:expert`) et non par `pnpm test`, car il dure
  plusieurs minutes.
- **Moteur** : ajout de `applyActionInPlace`, variante de `applyAction` qui modifie l'état sur place
  pour les simulations, et export de `buildDeck`. Aucune règle ne change.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `ai-players` : quatrième niveau, Expert, réservé au mode classique ; décisions calculées sans
  bloquer l'interface, avec signalement de la réflexion ; budget de temps propre à l'Expert, la
  limite de 50 ms restant celle des trois niveaux heuristiques.
- `ai-strategy` : comportement du niveau Expert et supériorité mesurée sur le niveau difficile.

## Hors périmètre

- Expert en missions secrètes et en mode capitales : sa simulation devrait estimer les missions
  adverses et son évaluation tenir compte des objectifs de chaque variante. Change ultérieur.
- Recherche par arbre (MCTS) ou recherche sur plusieurs tours de table.
- Recherche des autres décisions (échange de cartes, déplacement après conquête, fortification,
  mise en place) : l'Expert y joue comme le difficile.
- Niveau différent pour chaque IA d'une même partie.
- Réglage du temps de réflexion par l'utilisateur.
- Adaptation au style de jeu de l'humain : les adversaires simulés jouent comme des IA difficiles.

## Impact

- `src/engine/` : `applyActionInPlace` (le code d'`applyAction` est partagé), export de `buildDeck`,
  niveau `expert` accepté à la création.
- `src/ai/expert/` : tirage d'un monde compatible avec la vue, évaluation de position, simulation,
  choix de l'action ; `chooseAction` délègue au niveau Expert.
- `src/ai/` : point d'entrée du Web Worker.
- `src/game/` : session de jeu asynchrone pour les décisions des IA (worker, annulation, indicateur),
  formulaire (niveau Expert, retour au difficile avec une variante).
- `src/ui/` : bouton Expert dans l'écran de création, indicateur de réflexion dans le bandeau.
- `package.json` : script `test:expert`. Aucune nouvelle dépendance : Vite gère nativement les Web
  Workers, et le worker compilé est précaché par le service worker comme les autres fichiers JS.
- Sauvegarde : le format ne change pas ; une partie Expert sauvegardée reprend normalement.
