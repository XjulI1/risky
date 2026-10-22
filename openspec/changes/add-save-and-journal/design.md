# Design

## Context

L'état du moteur est déjà du JSON pur et la session de jeu (`add-game-ui`, `add-heuristic-ai`)
centralise toutes les actions, humaines et IA, dans `dispatch`, avec une file de présentation qui
convertit les événements en étapes d'animation. Ce change s'accroche à ces deux points. Motivation :
proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Journal et statistiques calculés par des fonctions pures à partir des événements du moteur.
- Un format de sauvegarde versionné, validé à la lecture, et un seul module qui touche au stockage.

**Non-Goals :**

- Pas d'IndexedDB : une partie sauvegardée pèse quelques centaines de kilo-octets au plus,
  largement sous les quotas de `localStorage`.
- Pas de migration entre versions de format pour la V1 : une version inconnue est rejetée.

## Decisions

### Arborescence

```
src/game/
  persistence.ts            lecture, validation, écriture, suppression
  history/turnCounter.ts    numéro de tour
  history/journal.ts        événements → entrées de journal
  history/statistics.ts     événements + état → relevés et compteurs
src/ui/
  hud/JournalPanel.vue
  screens/StatisticsTab.vue, LineChart.vue
```

### Numéro de tour

Le moteur ne compte pas les tours. `turnCounter` incrémente un compteur à chaque événement de début
de tour (un tour = le tour d'un joueur), et le compteur est stocké avec l'historique. Ajouter ce
compteur au moteur aurait été possible, mais aucune règle n'en a besoin : il reste côté application.

### Format de sauvegarde

```ts
type SavedGame = {
  formatVersion: 1
  savedAt: string
  status: 'inProgress' | 'finished'
  creation: GameCreationConfig
  engineState: GameState
  journal: JournalEntry[]
  statistics: GameStatistics
  turnNumber: number
}
```

Clé unique `risk.savedGame`. La lecture valide la structure par des gardes de type écrites à la main
(champs présents, `formatVersion` connue, `engineState` cohérent : 42 territoires, joueurs connus) ;
pas de bibliothèque de schéma pour une seule structure. Toute exception de lecture, d'analyse ou de
validation mène au même chemin « sauvegarde illisible ».

`creation` est conservée pour « Rejouer avec les mêmes paramètres » après une reprise.

### Moment de la sauvegarde

La sauvegarde est écrite après chaque action acceptée, à partir de `engineState` et non de
`displayedState` : elle reflète la vérité même si l'animation est en cours. Le journal sauvegardé
contient donc aussi les entrées pas encore affichées. À la reprise, aucune animation n'est rejouée et
tout le journal est visible, ce qui est cohérent avec un état affiché directement final.

L'écriture est synchrone (`localStorage`) : quelques kilo-octets à quelques centaines, une fois par
action, sans effet perceptible. Si une mesure montre le contraire en fin de partie, regrouper les
écritures d'un tour d'IA avec `requestIdleCallback`.

### Journal synchronisé avec les animations

`journal.ts` produit les entrées dès que le moteur répond. La session stocke la liste complète et un
index « affiché jusqu'à », avancé par chaque étape de présentation terminée. Le panneau ne montre que
les entrées jusqu'à cet index ; passer l'animation avance l'index au bout. Les lancers d'un blitz sont
regroupés par `journal.ts` à partir de l'action à l'origine des événements, transmise avec eux.

### Statistiques

`statistics.ts` est une fonction de réduction `(stats, events, stateAfter) → stats` : relevé au début
de chaque tour, compteurs incrémentés par lancer, conquête, échange et élimination. Le neutre n'a pas
de relevé, mais les armées qu'il perd sont comptées dans les armées détruites de l'attaquant.

### Graphiques

`LineChart.vue` dessine en SVG une courbe par joueur, avec un `viewBox` fixe et une largeur à 100 %
pour s'adapter à l'écran. Axes, graduations entières et légende sont calculés par une fonction pure
testée. Une bibliothèque de graphiques serait disproportionnée pour deux courbes.

## Risks / Trade-offs

- [Sauvegarde corrompue par une modification future du type `GameState`] → incrémenter
  `formatVersion` à chaque changement incompatible de l'état ; l'ancienne sauvegarde est alors
  rejetée proprement.
- [Journal très long en fin de partie] → environ 30 entrées par tour d'IA, soit quelques milliers
  d'entrées pour une longue partie ; le panneau n'affiche que les 200 dernières entrées et charge les
  précédentes en remontant.
- [Deux onglets ouverts écrasent mutuellement la sauvegarde] → cas marginal pour un jeu solo ;
  accepté.
