# Design

## Context

Après `add-secret-missions`, le moteur vérifie la victoire après chaque action du joueur courant,
gère le déplacement minimal automatique en cas de victoire pendant `conquestMove`, et porte un
`winReason`. Les phases sont une union discriminée ; la mise en place se termine par la phase de
placement puis bascule en renforts. L'IA ne voit l'état qu'à travers `PlayerView`, et la résolution
d'un lancer est une fonction pure. Ce change réutilise ces mécanismes. Motivation : proposal.md ;
exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Ajouter une phase, un bonus de combat et une condition de victoire sans toucher aux règles
  classiques hors mode capitales.
- Garder les choix de capitale réellement secrets jusqu'à la révélation, pour l'IA comme pour
  l'interface.

**Non-Goals :**

- Pas de renforts liés aux capitales ni de partie courte.

## Decisions

### État et phase

- `settings.capitals: boolean` (défaut `false`), validé exclusif avec `settings.secretMissions`.
- Nouvelle phase `{ kind: 'capitalChoice'; pending: Record<PlayerId, TerritoryId> }`, insérée entre
  la fin du placement et la phase de renforts du premier joueur. Une seule fonction « fin de mise en
  place » décide de la phase suivante.
- `capitals: Record<PlayerId, TerritoryId> | null` dans `GameState`, renseigné seulement à la
  révélation. La capitale est attachée au territoire ; le détenteur actuel se lit dans
  `territories[id].owner`.
- Action `chooseCapital { territory }`, jouée à tour de rôle : elle remplit `pending` et passe au
  joueur suivant. Le dernier choix copie `pending` dans `capitals`, émet `capitalsRevealed` et ouvre
  les renforts.
- Événements `capitalChosen { playerId }` (sans le territoire, pour ne rien divulguer),
  `capitalsRevealed { capitals }` et `capitalCaptured { by, from, territory }`, ce dernier émis juste
  après l'événement de conquête quand le territoire conquis est une capitale.
- `winReason` gagne la valeur `'capitals'`.

### Secret des choix

- `PlayerView` ne recopie de `pending` que le choix du joueur qui regarde ; `capitals` est public
  puisqu'il n'est rempli qu'à la révélation.
- Le HUD et le plateau ne lisent que `capitals` : aucun marqueur avant la révélation.
- En partie entre plusieurs humains, l'écran de passage de main s'affiche avant chaque choix,
  comme entre deux tours.

### Bonus de défense

La fonction pure de résolution d'un lancer reçoit un `defenderBonus` (0 ou 1) ajouté au dé le plus
haut du défenseur avant comparaison. Le moteur le fixe à 1 quand le territoire défendu est une
capitale révélée. L'événement de lancer porte les valeurs tirées et le bonus, pour que l'interface
affiche « +1 » et que le journal écrive « 5+1 ». Les règles classiques ne changent pas : sans mode
capitales, le bonus vaut toujours 0.

`combatOdds` (IA) indexe sa table par bonus de défense en plus des réglages de dés ; l'énumération
des lancers applique le même bonus que le moteur.

### Victoire

La fonction de victoire évalue, dans l'ordre : domination, mission (si actif), capitales (si actif).
Les capitales sont publiques et la condition est symétrique, mais elle n'est évaluée que pour le
joueur courant : seule une action de sa part peut lui faire gagner une capitale.

### Plateau

`GameBoard` reçoit un prop optionnel `capitals` (territoire → couleur du joueur d'origine) et affiche
un `CapitalMarker` : une petite tour low-poly générée en code, posée à côté du pion d'armées en
décalant légèrement le point d'ancrage. Le compteur d'armées reste au-dessus du pion, sans
chevauchement. Le calcul du décalage est une fonction pure testée sur tous les territoires.

### IA

- Choix de capitale : facile → territoire le plus garni ; normal et difficile → minimisation de la
  menace (fonction de menace existante), intérieur d'abord, puis armées. La décision ne lit que la
  `PlayerView`, donc ignore les choix des autres.
- Renforts : avant la logique de continent, une étape « défense de capitale » complète la garnison
  jusqu'à la menace voisine.
- Attaque : prime pour une capitale adverse et pour sa propre capitale perdue, évaluées avec les
  probabilités bonifiées ; pour le difficile, mode « dernière capitale » qui oriente toute la réserve
  vers la capitale manquante (plus court chemin dans le graphe d'adjacence pour trouver son
  territoire le plus proche).

### Interface

- Création : les deux variantes deviennent des cases exclusives gérées par une fonction pure du
  formulaire (cocher l'une décoche l'autre).
- Contrôleur d'interaction : nouveau parcours `capitalChoice` (territoires du joueur sélectionnables,
  confirmation).
- Révélation : annonce listant les capitales, déclenchée par `capitalsRevealed`.
- `DiceTray` : badge « +1 » sur le dé bonifié.
- HUD : décompte « Capitales : n/total » dans `PlayersPanel` ; alerte quand un humain perd sa
  capitale, déclenchée par l'événement `capitalCaptured`.
- Journal : `capitalChosen` ignoré, formulations de `capitalsRevealed` et `capitalCaptured`, détail de
  lancer « 5+1 » ; écran de fin : motif « en contrôlant toutes les capitales ».

### Sauvegarde

`formatVersion` passe à 3 ; les sauvegardes précédentes sont rejetées par le chemin existant.

## Risks / Trade-offs

- [Bonus de défense qui rend les capitales imprenables et allonge les parties] → mesurer la durée des
  parties du tournoi en mode capitales ; le bonus ne porte que sur un dé.
- [Marqueur de capitale et pion qui se chevauchent sur les petits territoires] → test du décalage
  sur les 42 territoires ; le décalage part du pôle d'inaccessibilité, qui laisse le plus de place
  autour du pion.
- [IA trop défensive qui ne termine pas les parties] → plafond de 500 tours du test de robustesse
  appliqué aussi au mode capitales.
