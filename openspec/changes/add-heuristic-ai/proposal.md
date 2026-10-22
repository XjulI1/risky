## Why

L'objectif du projet est de jouer seul contre l'ordinateur. Après `add-game-ui`, le jeu ne se joue
qu'entre humains sur le même écran. Il faut des adversaires artificiels crédibles, de difficulté
réglable, qui respectent les mêmes règles que le joueur et ne trichent pas.

## What Changes

- **Joueurs IA** sélectionnables à la création d'une partie, avec un niveau : facile, normal ou
  difficile. Par défaut : le premier joueur est humain, les autres sont des IA de niveau normal.
- **Tour automatique** : quand c'est au tour d'une IA, elle enchaîne seule ses actions (mise en
  place manuelle comprise) à travers le même point d'entrée que les humains, à un rythme lisible qui
  suit la vitesse d'animation, avec mise en avant de l'origine et de la cible de chaque attaque.
- **Trois niveaux de stratégie heuristique** :
  - facile : renforts dispersés, attaques seulement en net avantage, pas de plan ;
  - normal : continent visé, renforts concentrés sur le front, attaques guidées par la probabilité de
    victoire, fortification de l'intérieur vers les frontières ;
  - difficile : en plus, casse les continents adverses, cherche les éliminations rentables, pèse la
    menace sur ses frontières et retarde ses échanges de cartes quand c'est avantageux.
- **Pas de triche** : une IA ne voit que l'information publique et sa propre main.
- **Table de probabilités de combat** calculée exactement à partir des règles de dés de la partie.

## Capabilities

### New Capabilities

- `ai-players` : création de joueurs IA, tour automatique, rythme, information visible, garanties de terminaison et de légalité.
- `ai-strategy` : comportements observables de chaque niveau et écart de force attendu entre niveaux.

### Modified Capabilities

(aucune)

## Hors périmètre

- IA par simulation (Monte-Carlo) : non retenue pour la V1.
- Prise en compte des missions secrètes et des capitales par l'IA : ajoutée par `add-secret-missions`
  et `add-capitals-mode`.
- Sauvegarde d'une partie contre l'IA : `add-save-and-journal`.

## Impact

- Nouveau module `src/ai/` (pur, sans Vue ni Three.js, soumis à la même règle d'isolement ESLint que
  le moteur).
- Moteur : le type de joueur IA porte désormais un niveau ; aucune règle ne change.
- Interface : formulaire de création (type et niveau par joueur), pilotage des tours IA dans la
  session de jeu.
- Aucune nouvelle dépendance.
- Dépend de `add-classic-rules-engine` et `add-game-ui`. Ce change suppose que ces deux changes ont
  été appliqués ; leurs specs n'étant pas encore archivées au moment de la rédaction, les nouvelles
  exigences sont portées par les capacités `ai-players` et `ai-strategy`.
