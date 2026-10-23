# Design

## Context

Le moteur évalue déjà la victoire dans une fonction dédiée appelée après chaque changement de
propriétaire (point d'extension prévu par `add-classic-rules-engine`). L'IA ne voit l'état qu'à
travers `PlayerView`. La sauvegarde est versionnée. Motivation : proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Les missions comme données (union discriminée) évaluées par une seule fonction pure, partagée par
  le moteur, l'interface (progression) et l'IA.
- Aucune information de mission adverse accessible à l'IA ou au journal.

**Non-Goals :**

- Pas d'interface d'édition des missions.

## Decisions

### Modèle des missions

```ts
type Mission =
  | { kind: 'continents'; required: ContinentId[]; extraContinents: number }
  | { kind: 'territories'; count: number; minArmies: number }
  | { kind: 'eliminate'; target: PlayerId }
```

Les 8 missions générales sont des constantes de `src/engine/missions.ts` ; la mission 7 vaut
`{ kind: 'territories', count: 24, minArmies: 1 }` et la mission 8 `{ count: 18, minArmies: 2 }`.
Le texte français de chaque mission est produit par une fonction de formatage dans le même module,
partagée par le HUD, le journal et l'écran de fin.

`missionProgress(state, playerId)` renvoie une structure de progression (par continent, compteurs,
territoires restants de la cible) et un booléen `accomplished`. Le moteur n'utilise que le booléen ;
l'interface affiche la structure ; l'IA s'en sert comme critère.

### État et événements

- `settings.secretMissions: boolean` (défaut `false`).
- `missions: Record<PlayerId, Mission> | null` dans `GameState`.
- Événements `missionConverted { playerId }` et `missionAccomplished { playerId, mission }`.
- `winReason: 'domination' | 'mission'` ajouté à l'état final.

### Vérification de la victoire

La fonction de victoire existante devient : domination d'abord, puis mission du joueur courant si le
réglage est actif. Elle est appelée après chaque action acceptée du joueur courant (et plus seulement
après un changement de propriétaire), car la mission « 18 territoires à 2 armées » peut s'accomplir
par un déploiement ou une fortification.

En cas d'accomplissement pendant la phase `conquestMove`, le moteur applique d'abord le déplacement
minimal puis termine la partie : l'état final ne contient jamais de territoire à 0 armée.

La conversion des missions d'élimination est faite dans la gestion de l'élimination : pour chaque
autre joueur dont la mission vise l'éliminé, remplacement par la mission 24 territoires et événement
de conversion.

### Information cachée

- `PlayerView` gagne un champ `ownMission` ; le champ `missions` de l'état n'y est jamais recopié.
- `journal.ts` ignore `missionConverted` et formate `missionAccomplished`.
- Le HUD ne lit la mission que du joueur humain autorisé (joueur courant humain, ou seul humain de la
  partie).

### IA

Les niveaux normal et difficile reçoivent un « objectif » dérivé de `ownMission` qui modifie
l'évaluation existante :

- missions de continents : prime forte sur les continents exigés dans le score de continent ;
- 24 territoires : poids du gain de territoire augmenté, seuil de probabilité d'attaque abaissé à 0,5
  pour les cibles à 1 ou 2 armées ;
- 18 × 2 : déplacement après conquête et fortification contraints à laisser 2 armées ;
- élimination : prime sur les territoires de la cible, et malus sur l'élimination d'un autre joueur
  quand la cible n'est pas encore éliminée.

Le niveau facile ne lit pas `ownMission`.

### Sauvegarde

`formatVersion` passe à 2 : l'état contient de nouveaux champs. Une sauvegarde de version 1 est
rejetée par le chemin « illisible » existant.

## Risks / Trade-offs

- [Parties avec missions trop courtes, par exemple 24 territoires accomplis très tôt en placement
  aléatoire] → règle officielle conservée ; à observer pendant les tests de jeu.
- [Révélation involontaire de mission en hot-seat] → affichage seulement sur demande, derrière
  l'écran de passage de main.
- [Tournoi avec missions plus aléatoire] → même critère qu'en classique ; ajuster les primes
  d'objectif si besoin.
