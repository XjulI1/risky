## Why

Le moteur de règles (`add-classic-rules-engine`) produit un état de partie, mais rien ne permet encore
de le voir. Le plateau 3D est la pièce centrale de l'expérience : il doit afficher fidèlement l'état
du moteur, rester lisible à toutes les échelles et réagir à la souris comme au doigt, avant même que
l'interface de jeu ne soit branchée dessus.

## What Changes

- **Géométrie de la carte** : les contours des 42 territoires, déjà présents dans
  `data/maps/classic/territories.json` (chemins SVG, mêmes identifiants que le moteur), convertis au
  chargement en volumes extrudés façon tuiles de plateau. Les liaisons maritimes de
  `data/maps/classic/sea-routes.json` sont tracées en pointillés.
- **Rendu du plateau** : océan animé, territoires colorés selon leur propriétaire, relief léger,
  éclairage et ombres douces, un pion 3D par territoire avec un compteur d'armées lisible, noms des
  continents en pleine mer.
- **Caméra** : vue du haut inclinée fixe, zoom et déplacement à la souris (molette, glisser) et au
  tactile (pincer, glisser), bornés pour ne jamais perdre la carte.
- **Interaction** : survol, sélection au clic ou au toucher, et états de surbrillance pilotés de
  l'extérieur (sélectionnable, sélectionné, cible), sans aucune logique de règle dans le plateau.
- **Composant de plateau réutilisable**, purement présentationnel : il reçoit l'état et les
  surbrillances, et émet le territoire choisi.
- **Écran de démonstration provisoire** : l'écran d'accueil affiche une partie générée par le moteur
  pour vérifier le rendu, en attendant `add-game-ui`.

## Capabilities

### New Capabilities

- `board-rendering` : affichage 3D de la carte, des propriétaires, des pions et compteurs d'armées, et des liaisons maritimes.
- `board-camera` : cadrage incliné, zoom et déplacement bornés, à la souris et au tactile.
- `board-interaction` : survol, sélection et états de surbrillance des territoires, pilotés par l'appelant.

### Modified Capabilities

(aucune)

## Hors périmètre

- HUD, déroulement d'un tour, dés animés et main de cartes : `add-game-ui`.
- Animations liées aux événements du moteur (conquête, déploiement) : `add-game-ui`.
- Marqueur de capitale : `add-capitals-mode`.
- Brouillard de guerre : non retenu pour la V1.
- Modification des contours de la carte : les données de `data/maps/classic/` sont utilisées telles
  quelles.

## Impact

- Nouvelles dépendances à installer par l'utilisateur (`pnpm add`) : `three`, `@tresjs/core`,
  `@tresjs/cientos`, `@types/three` (dev).
- Nouveaux fichiers : `src/board/` (géométrie, modèle de vue, composants), remplacement du contenu
  provisoire de `src/App.vue`.
- Lit sans les modifier `territories.json`, `sea-routes.json` et `continent-labels.json` de
  `data/maps/classic/`, sous licence CC BY-SA 3.0 pour la géométrie (voir `SOURCE.md`).
- Dépend de `add-classic-rules-engine` (types, carte classique, `createGame`).
- Le moteur n'est pas modifié ; la règle ESLint qui l'isole de Three.js reste en place.
