# Risky

Jeu Risk en application web, avec un plateau en 3D vu du haut, jouable seul contre l'ordinateur
sur ordinateur ou tablette en mode paysage (1024 px de large minimum).

> **État du projet** : en développement. On peut déjà jouer une partie complète aux règles
> classiques, sur le plateau 3D, entre humains ou contre des IA de trois niveaux. La sauvegarde, le
> journal de partie et les variantes (missions secrètes, capitales) restent à faire. Avancement
> détaillé : [Feuille de route](#feuille-de-route).

## Le jeu

- **Règles classiques** : 42 territoires, 6 continents, renforts, attaques aux dés menées jusqu'à la
  conquête ou à l'épuisement de l'attaquant, fortification, cartes territoire.
- **2 à 6 joueurs**, avec une armée neutre à 2 joueurs.
- **Adversaires IA** en trois niveaux : facile, normal, difficile. Leur façon de jouer est décrite
  dans [`docs/ia.md`](docs/ia.md).
- **Réglages** : barème d'échange des cartes (progressif ou fixe), nombre de dés en attaque et en
  défense, fortification par chemin connexe ou adjacente, répartition des territoires aléatoire ou
  au choix, placement des armées aléatoire ou un par un.
- **Variantes** : missions secrètes, mode capitales (choix secret des capitales, bonus de défense).
- **Plateau 3D** façon jeu de société : territoires en relief, pions et compteurs d'armées, dés
  animés, vitesse d'animation réglable.
- **Sauvegarde automatique** dans le navigateur, journal de partie et statistiques de fin.

## Stack technique

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`) et [Vite](https://vite.dev/)
- TypeScript strict
- [TresJS](https://tresjs.org/) (Three.js pour Vue) pour le rendu WebGL
- [Tailwind CSS](https://tailwindcss.com/) pour l'interface
- [Vitest](https://vitest.dev/) pour les tests
- [pnpm](https://pnpm.io/) comme gestionnaire de paquets

Le moteur de règles est écrit en TypeScript pur, sans dépendance à Vue ni à Three.js. Il est
déterministe (même graine et mêmes actions donnent la même partie) et son état se sérialise
directement en JSON. L'interface, le plateau 3D et l'IA s'appuient tous sur ce moteur.

## Données de la carte

La carte classique (contours des territoires, adjacences, liaisons maritimes) se trouve dans
`data/maps/classic/`. Elle provient du projet [RISK](https://github.com/kopy-kat/risk) de Konrad Kopp ;
la géométrie est dérivée de
[`Risk_board.svg`](https://commons.wikimedia.org/wiki/File:Risk_board.svg) de Gr0gmint et reste sous
licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Provenance et licences en
détail : [`data/maps/classic/SOURCE.md`](data/maps/classic/SOURCE.md).

## Démarrage

Les commandes du projet :

```bash
pnpm install       # installer les dépendances
pnpm dev           # lancer l'application en développement
pnpm test          # lancer les tests
pnpm lint          # analyser le code
pnpm type-check    # vérifier les types
pnpm build         # construire la version de production
```

## Feuille de route

Le projet est planifié avec [OpenSpec](https://github.com/Fission-AI/OpenSpec). Chaque étape est un
change dans `openspec/changes/`, avec sa proposition, ses spécifications, son design et ses tâches.
Les changes doivent être appliqués dans l'ordre :

| # | Change | Contenu | État |
|---|---|---|---|
| 1 | `add-classic-rules-engine` | Socle du projet et moteur de règles classique | Terminé |
| 2 | `add-3d-board` | Plateau 3D : carte, pions, caméra, sélection | Terminé |
| 3 | `add-game-ui` | Écrans, interface de jeu, dés animés, cartes | Terminé |
| 4 | `add-heuristic-ai` | Adversaires IA à trois niveaux | Terminé |
| 5 | `add-save-and-journal` | Sauvegarde, reprise, journal et statistiques | À faire |
| 6 | `add-secret-missions` | Variante missions secrètes | À faire |
| 7 | `add-capitals-mode` | Variante capitales | À faire |

Les changes terminés sont archivés dans `openspec/changes/archive/`.

## Travailler avec OpenSpec

Le projet intègre les commandes OpenSpec pour [Claude Code](https://claude.com/claude-code) :

- `/opsx:explore` : réfléchir à une idée ou clarifier un besoin ;
- `/opsx:propose` : créer un nouveau change ;
- `/opsx:apply <change>` : implémenter les tâches d'un change ;
- `/opsx:archive <change>` : archiver un change terminé et mettre à jour les spécifications de
  référence dans `openspec/specs/`.

En ligne de commande, `openspec list` affiche l'avancement des changes et
`openspec validate --all --strict` vérifie leur format.

## Licence

Le code est distribué sous licence MIT, à l'exception des données de la carte
(`data/maps/classic/`), qui gardent leurs propres licences. Voir [`LICENSE.md`](LICENSE.md).

## Conventions

- Code, identifiants et messages de commit en anglais ; documentation et interface en français.
- Pas de commentaires dans le code (seule exception : JSDoc sur l'API exportée) ; le comportement
  est documenté par les tests.
- Logique de jeu développée en TDD.
