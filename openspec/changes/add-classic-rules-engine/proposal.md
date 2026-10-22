## Why

Le projet part de zéro. Tout ce qui viendra ensuite (rendu 3D, interface, IA, variantes) consomme
l'état d'une partie et doit respecter les mêmes règles. Il faut donc d'abord un **socle applicatif**
et un **moteur de règles Risk classique** pur, déterministe et sérialisable, testé en TDD, sur
lequel brancher l'affichage et l'IA sans jamais dupliquer de logique de jeu.

## What Changes

- **Socle du projet** : application Vite + Vue 3 + TypeScript strict, gérée avec pnpm, avec Vitest,
  ESLint et vérification de types. L'application affiche seulement un écran d'accueil provisoire.
- **Carte du monde classique en données** : 42 territoires, 6 continents avec leurs bonus, graphe
  d'adjacence (dont les liaisons maritimes comme Alaska–Kamtchatka), lus dans les données déjà
  présentes dans `data/maps/classic/` (voir `SOURCE.md`) et complétés par les noms français.
- **Moteur de règles** (`src/engine/`, sans dépendance à Vue ni à Three.js) :
  - création d'une partie de 2 à 6 joueurs, avec une armée neutre à 2 joueurs ;
  - répartition des territoires aléatoire ou au choix, puis placement des armées restantes par les
    joueurs ;
  - tour de jeu en phases : renforts, attaque, déplacement après conquête, fortification ;
  - combats aux dés, chaque attaque étant menée jusqu'à la conquête ou à l'épuisement de
    l'attaquant ;
  - cartes territoire, échange de séries, échange forcé, récupération des cartes d'un joueur éliminé ;
  - élimination et victoire.
- **Réglages numériques** activables à la création : barème d'échange progressif ou fixe, nombre
  maximal de dés en attaque et en défense, fortification par chemin connexe ou adjacente,
  répartition des territoires aléatoire ou au choix.
- **API d'actions** : chaque action du joueur est validée par le moteur, qui renvoie un nouvel état
  et une liste d'événements (pour le futur journal et les animations), ou une erreur de règle
  explicite. Le hasard passe par un générateur pseudo-aléatoire à graine stocké dans l'état :
  même graine + mêmes actions = même partie.

## Capabilities

### New Capabilities

- `world-map` : données de la carte classique (territoires, continents, bonus, adjacences) et leurs invariants.
- `game-setup` : création d'une partie, joueurs, armée neutre, réglages, armées initiales, répartition des territoires et placement initial.
- `turn-flow` : enchaînement des phases et des joueurs, validation des actions, événements, déterminisme, sérialisation, élimination et victoire.
- `reinforcement` : calcul et déploiement des renforts (territoires, bonus de continent, échanges de cartes).
- `combat` : attaque aux dés, résolution des pertes, attaque menée jusqu'au bout, conquête et déplacement obligatoire.
- `fortification` : déplacement de fin de tour, par chemin connexe ou en mode adjacent.
- `territory-cards` : paquet de cartes, pioche après conquête, séries valides, barèmes d'échange, échange forcé.

### Modified Capabilities

(aucune, projet vierge)

## Hors périmètre

Chaque point fera l'objet d'un change ultérieur, dans cet ordre indicatif :

1. `add-3d-board` : plateau 3D TresJS (SVG des territoires extrudés, caméra inclinée zoom/pan,
   pions et compteurs, sélection à la souris et au tactile).
2. `add-game-ui` : écran de création de partie, HUD des phases, dés animés et vitesse d'animation,
   main de cartes. Jouable d'abord avec tous les joueurs humains sur le même écran.
3. `add-heuristic-ai` : IA heuristique en trois niveaux (facile, normal, difficile).
4. `add-save-and-journal` : sauvegarde automatique en localStorage, reprise, journal de partie et
   statistiques de fin.
5. `add-secret-missions` : variante missions secrètes.
6. `add-capitals-mode` : variante capitales.

Rien de ce change n'est visible en jeu : il se vérifie par les tests du moteur.

## Impact

- Nouveau dépôt : `package.json`, configuration Vite, TypeScript, Vitest et ESLint, `index.html`,
  `src/main.ts`, `src/App.vue`.
- Nouveau module `src/engine/` (types, données de carte, générateur aléatoire, règles) avec tests
  colocalisés.
- Dépendances à installer par l'utilisateur (`pnpm install`) : vue, vite, @vitejs/plugin-vue,
  typescript, vue-tsc, vitest, eslint, typescript-eslint, eslint-plugin-vue.
- Aucune dépendance runtime ajoutée au moteur.
