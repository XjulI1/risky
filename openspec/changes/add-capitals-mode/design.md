# Design

## Context

Après `add-secret-missions`, le moteur vérifie la victoire après chaque action du joueur courant,
gère le déplacement minimal automatique en cas de victoire pendant `conquestMove`, et porte un
`winReason`. Les phases sont une union discriminée et la mise en place se termine en basculant en
renforts. Ce change réutilise ces mécanismes. Motivation : proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Ajouter une phase et une condition de victoire sans toucher aux règles classiques.
- Réutiliser les mécanismes déjà en place (victoire généralisée, déplacement minimal automatique,
  objectif d'IA dérivé de l'état visible).

**Non-Goals :**

- Pas de règle propre aux capitales hors victoire (pas de bonus de défense ni de renforts).

## Decisions

### État et phase

- `settings.capitals: boolean` (défaut `false`), validé exclusif avec `settings.secretMissions`.
- `capitals: Record<PlayerId, TerritoryId> | null` dans `GameState`. La capitale est attachée au
  territoire ; le détenteur actuel se lit dans `territories[id].owner`.
- Nouvelle phase `{ kind: 'capitalChoice' }`, insérée entre la fin de la mise en place et la phase
  de renforts du premier joueur. Une seule fonction « fin de mise en place » décide de la phase
  suivante, pour les placements aléatoire et manuel.
- Action `chooseCapital { territory }`.
- Événements `capitalChosen { playerId, territory }` et `capitalCaptured { by, from, territory }`,
  ce dernier émis juste après l'événement de conquête quand le territoire conquis est une capitale.
- `winReason` gagne la valeur `'capitals'`.

### Victoire

La fonction de victoire évalue, dans l'ordre : domination, mission (si actif), capitales (si actif).
Les capitales sont publiques et la condition est symétrique, mais elle n'est évaluée que pour le
joueur courant : seule une action de sa part peut lui faire gagner une capitale.

### Information visible

Les capitales étant publiques, `PlayerView` recopie `capitals` tel quel.

### Plateau

`GameBoard` reçoit un prop optionnel `capitals` (territoire → couleur du joueur d'origine) et affiche
un `CapitalMarker` : une petite tour low-poly générée en code, posée à côté du pion d'armées en
décalant légèrement le point d'ancrage. Le compteur d'armées reste au-dessus du pion, sans
chevauchement. Le calcul du décalage est une fonction pure testée sur tous les territoires.

### IA

- Choix de capitale : facile → territoire le plus garni ; normal et difficile → minimisation de la
  menace (fonction de menace existante), intérieur d'abord, puis armées.
- Renforts : avant la logique de continent, une étape « défense de capitale » complète la garnison
  jusqu'à la menace voisine.
- Attaque : prime pour une capitale adverse et pour sa propre capitale perdue ; pour le difficile,
  mode « dernière capitale » qui oriente toute la réserve vers la capitale manquante (plus court
  chemin dans le graphe d'adjacence pour trouver son territoire le plus proche).

### Interface

- Création : les deux variantes deviennent des cases exclusives gérées par une fonction pure du
  formulaire (cocher l'une décoche l'autre).
- Contrôleur d'interaction : nouveau parcours `capitalChoice` (territoires du joueur sélectionnables,
  confirmation).
- HUD : décompte « Capitales : n/total » dans `PlayersPanel` ; alerte quand un humain perd sa
  capitale, déclenchée par l'événement `capitalCaptured`.
- Journal : formulations de `capitalChosen` et `capitalCaptured` ; écran de fin : motif
  « en contrôlant toutes les capitales ».

### Sauvegarde

`formatVersion` passe à 3 ; les sauvegardes précédentes sont rejetées par le chemin existant.

## Risks / Trade-offs

- [Avantage du premier joueur, qui choisit sa capitale en dernier informé de rien et attaque en
  premier] → règle officielle conservée ; à surveiller dans le tournoi.
- [Marqueur de capitale et pion qui se chevauchent sur les petits territoires] → test du décalage
  sur les 42 territoires et corrections manuelles possibles via `anchorOverrides`.
- [IA trop défensive qui ne termine pas les parties] → plafond de 500 tours du test de robustesse
  appliqué aussi au mode capitales.
