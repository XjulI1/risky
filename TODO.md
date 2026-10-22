# TODO

Ce qu'il reste à faire pour livrer la V1. Le détail de chaque étape se trouve dans le `tasks.md` du
change correspondant ; ce fichier ne suit que les grandes étapes et les points transverses.

## Avant de commencer

- [ ] Relire les artefacts des 7 changes dans `openspec/changes/`.
- [x] Valider les écarts de règles : voir [Décisions de règles](#décisions-de-règles) ci-dessous ;
  les specs concernées sont à jour.
- [x] Trouver la source de la carte du plateau : données récupérées dans `data/maps/classic/`
  (voir `SOURCE.md`).
- [x] Adapter `add-classic-rules-engine` et `add-3d-board` à ces données.

## Décisions de règles

Écarts entre les specs et les règles officielles du Risk, validés le 22 octobre 2026. Les specs
indiquées reflètent ces décisions.

### Mise en place (`add-classic-rules-engine`, spec `game-setup`)

- [x] **Neutre à 2 joueurs** : 14 territoires et armées tirés au hasard à la création (officiel :
  armées neutres placées par les joueurs).
- [x] **Répartition aléatoire** : territoires distribués au hasard, puis chaque joueur place ses
  armées restantes une à une, comme dans la règle officielle. La répartition au choix (revendication)
  reste proposée.
- [x] **Premier joueur** tiré au sort par la graine, sans animation (officiel : plus haut lancer de dé).

### Combat (`add-classic-rules-engine`, spec `combat`)

- [x] **Attaque toujours menée jusqu'au bout** : chaque attaque enchaîne les lancers avec le maximum
  de dés jusqu'à la conquête ou jusqu'à ce que l'attaquant n'ait plus qu'une armée. Ni lancer unique
  ni choix du nombre de dés (officiel : un lancer à la fois, dés au choix).
- [x] **Dés du défenseur automatiques** : toujours le maximum autorisé (officiel : 1 ou 2 au choix).

### Cartes (`add-classic-rules-engine`, spec `territory-cards`)

- [x] **Bonus de +2 armées d'un échange** placé automatiquement sur le premier territoire éligible
  voisin d'un adversaire, à défaut sur le premier éligible (officiel : au choix du joueur).
- [x] **Barème fixe** (4, 6, 8, 10) proposé en option ; progressif par défaut. Une série avec joker
  vaut sa meilleure valeur possible.

### Fortification (`add-classic-rules-engine`, spec `game-setup`)

- [x] **Chemin connexe par défaut** (éditions récentes), mode adjacent en option.

### Missions secrètes (`add-secret-missions`, spec `secret-missions`)

- [x] **Une mission « éliminer » par joueur présent** (officiel : une par couleur, six au total).
- [x] **Déplacement minimal automatique** quand une mission est accomplie par une conquête.
- [x] **Mission vérifiée pendant le tour de son détenteur seulement**, conforme à la règle officielle.

### Mode capitales (`add-capitals-mode`, spec `capitals-mode`)

- [x] **Choix secret puis révélation simultanée**, conforme à la règle officielle.
- [x] **Bonus de défense** : +1 au dé le plus haut du défenseur d'une capitale, quel qu'en soit le
  propriétaire. Ajout par rapport à la règle officielle.
- [x] **Déplacement minimal automatique** quand la dernière capitale est prise par une conquête.
- [x] **Pas de partie courte** (prendre 2 ou 3 capitales adverses seulement) : variante officielle
  écartée.

## Implémentation

Pour chaque change, dans l'ordre : `/opsx:apply <change>`, vérification complète
(`pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`), puis `/opsx:archive <change>`.
Un change ne doit être commencé qu'une fois le précédent archivé.

### 1. `add-classic-rules-engine` — socle et moteur de règles

- [ ] Cocher la tâche 1.1 (dépôt git et `.gitignore`), déjà réalisée lors du premier push.
- [ ] Lancer `pnpm install` après l'écriture du `package.json` (tâche 1.2).
- [ ] Implémenter les [tâches](openspec/changes/add-classic-rules-engine/tasks.md).
- [ ] Archiver le change.
- [ ] Retirer l'encadré « État du projet » du README et vérifier que la section « Démarrage » est
  exacte.

### 2. `add-3d-board` — plateau 3D

- [ ] Lancer `pnpm install` après l'ajout de three et TresJS (tâche 1.1).
- [ ] Implémenter les [tâches](openspec/changes/add-3d-board/tasks.md).
- [ ] Ajuster visuellement la teinte de l'océan et la palette des joueurs.
- [ ] Archiver le change.

### 3. `add-game-ui` — interface de jeu

- [ ] Lancer `pnpm install` après l'ajout de Tailwind, @vue/test-utils et happy-dom (tâche 1.1).
- [ ] Implémenter les [tâches](openspec/changes/add-game-ui/tasks.md).
- [ ] Archiver le change.

### 4. `add-heuristic-ai` — adversaires IA

- [ ] Implémenter les [tâches](openspec/changes/add-heuristic-ai/tasks.md).
- [ ] Ajuster les seuils et primes des niveaux jusqu'à ce que le tournoi de référence passe
  (victoires croissantes de facile à difficile, au moins 45 % pour le difficile).
- [ ] Archiver le change.

### 5. `add-save-and-journal` — sauvegarde, journal, statistiques

- [ ] Implémenter les [tâches](openspec/changes/add-save-and-journal/tasks.md).
- [ ] Archiver le change.

### 6. `add-secret-missions` — variante missions secrètes

- [ ] Implémenter les [tâches](openspec/changes/add-secret-missions/tasks.md).
- [ ] Archiver le change.

### 7. `add-capitals-mode` — variante capitales

- [ ] Implémenter les [tâches](openspec/changes/add-capitals-mode/tasks.md).
- [ ] Archiver le change.

## Fin de la V1

- [ ] Jouer plusieurs parties complètes sur ordinateur et sur tablette en paysage, avec chaque variante.
- [ ] Mettre à jour le README : fonctionnalités réellement livrées, captures d'écran.
- [ ] Déployer sur le serveur personnel : `pnpm build` en local, puis copie manuelle du dossier
  `dist/` ; régler l'option `base` de Vite si l'application est servie sous un sous-chemin.

## Pistes après la V1

Écartées du périmètre de la V1, à reconsidérer ensuite :

- Multijoueur en ligne.
- Sons et musique.
- Brouillard de guerre.
- IA par simulation (Monte-Carlo).
- Relecture pas à pas d'une partie terminée.
- Plusieurs emplacements de sauvegarde, export et import de partie.
- Interface en anglais.
