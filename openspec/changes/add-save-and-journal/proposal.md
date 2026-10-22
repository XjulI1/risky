## Why

Une partie de Risk dure longtemps : sans sauvegarde, un rechargement de page ou une fermeture d'onglet
fait tout perdre. Et contre plusieurs IA qui jouent vite, il est difficile de suivre ce qui s'est
passé pendant leurs tours ou de comprendre a posteriori comment la partie a basculé.

## What Changes

- **Sauvegarde automatique** de la partie en cours dans le navigateur après chaque action acceptée,
  et **reprise** depuis l'accueil, au même point, IA comprises.
- « Quitter la partie » revient à l'accueil **en conservant** la sauvegarde ; créer une nouvelle partie
  demande confirmation avant de la remplacer.
- Gestion des sauvegardes illisibles, d'une version incompatible et d'un stockage plein ou
  indisponible, sans jamais bloquer le jeu.
- **Journal de partie** : chaque action décrite en français, regroupée par tour, aux couleurs des
  joueurs, synchronisée avec les animations pour ne pas dévoiler un résultat avant les dés.
- **Statistiques** : relevé de chaque joueur à chaque tour et compteurs de combat, présentés en fin
  de partie sous forme de courbes et d'un tableau récapitulatif.

## Capabilities

### New Capabilities

- `game-persistence` : sauvegarde automatique, reprise, remplacement, erreurs de stockage.
- `game-journal` : journal lisible des actions de la partie.
- `game-statistics` : collecte des statistiques au fil de la partie et écran de statistiques de fin.

### Modified Capabilities

(aucune)

## Hors périmètre

- Plusieurs emplacements de sauvegarde, export ou import de fichier : non retenus pour la V1.
- Relecture pas à pas d'une partie terminée (« replay ») : possible plus tard grâce au déterminisme
  du moteur, non retenue pour la V1.
- Synchronisation entre appareils.

## Impact

- Nouveau dossier `src/game/history/` (journal, statistiques) et module `src/game/persistence.ts`.
- `useGameSession` enregistre journal et statistiques, et déclenche la sauvegarde.
- Écrans : bouton « Reprendre la partie » sur l'accueil, confirmation de remplacement, panneau de
  journal dans le HUD, onglet « Statistiques » sur l'écran de fin.
- « Quitter la partie » conserve désormais la partie, ce qui change le sens de l'action définie dans
  `add-game-ui` (`game-screens`).
- Aucune nouvelle dépendance ; graphiques en SVG faits main.
- Dépend de `add-classic-rules-engine`, `add-game-ui` et `add-heuristic-ai`.
