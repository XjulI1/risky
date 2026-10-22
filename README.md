# Risky

Jeu Risk en application web, avec un plateau en 3D vu du haut, jouable seul contre l'ordinateur
sur ordinateur, tablette ou téléphone.

> **État du projet** : en phase de conception. Le plan est rédigé sous forme de changes OpenSpec
> (voir [Feuille de route](#feuille-de-route)) ; l'implémentation n'a pas encore commencé.

## Le jeu

- **Règles classiques** : 42 territoires, 6 continents, renforts, attaques aux dés, fortification,
  cartes territoire.
- **2 à 6 joueurs**, avec une armée neutre à 2 joueurs.
- **Adversaires IA** en trois niveaux : facile, normal, difficile.
- **Réglages** : barème d'échange des cartes (progressif ou fixe), nombre de dés en attaque et en
  défense, fortification adjacente ou par chemin connexe, placement initial aléatoire ou manuel.
- **Variantes** : missions secrètes, mode capitales.
- **Plateau 3D** façon jeu de société : territoires en relief, pions et compteurs d'armées, dés
  animés, attaque « blitz », vitesse d'animation réglable.
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

## Démarrage

Une fois le socle du projet en place (premier change), les commandes seront :

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

| # | Change | Contenu |
|---|---|---|
| 1 | `add-classic-rules-engine` | Socle du projet et moteur de règles classique |
| 2 | `add-3d-board` | Plateau 3D : carte, pions, caméra, sélection |
| 3 | `add-game-ui` | Écrans, interface de jeu, dés animés, cartes |
| 4 | `add-heuristic-ai` | Adversaires IA à trois niveaux |
| 5 | `add-save-and-journal` | Sauvegarde, reprise, journal et statistiques |
| 6 | `add-secret-missions` | Variante missions secrètes |
| 7 | `add-capitals-mode` | Variante capitales |

## Travailler avec OpenSpec

Le projet intègre les commandes OpenSpec pour [Claude Code](https://claude.com/claude-code) :

- `/opsx:explore` : réfléchir à une idée ou clarifier un besoin ;
- `/opsx:propose` : créer un nouveau change ;
- `/opsx:apply <change>` : implémenter les tâches d'un change ;
- `/opsx:archive <change>` : archiver un change terminé et mettre à jour les spécifications de
  référence dans `openspec/specs/`.

En ligne de commande, `openspec list` affiche l'avancement des changes et
`openspec validate --all --strict` vérifie leur format.

## Conventions

- Code, identifiants et messages de commit en anglais ; documentation et interface en français.
- Pas de commentaires dans le code (seule exception : JSDoc sur l'API exportée) ; le comportement
  est documenté par les tests.
- Logique de jeu développée en TDD.
