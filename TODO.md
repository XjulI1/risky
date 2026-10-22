# TODO

Ce qu'il reste à faire pour livrer la V1. Le détail de chaque étape se trouve dans le `tasks.md` du
change correspondant ; ce fichier ne suit que les grandes étapes et les points transverses.

## Avant de commencer

- [ ] Relire les artefacts des 7 changes dans `openspec/changes/`.
- [ ] Valider chacune des [simplifications et adaptations de règles](#simplifications-et-adaptations-de-règles)
  ci-dessous, ou demander sa correction dans la spec concernée.
- [x] Trouver la source de la carte du plateau : données récupérées dans `data/maps/classic/`
  (voir `SOURCE.md`).
- [x] Adapter `add-classic-rules-engine` et `add-3d-board` à ces données.

## Simplifications et adaptations de règles

Écarts entre les specs et les règles officielles du Risk. Chaque point est à valider ; s'il est
refusé, corriger la spec indiquée avant d'implémenter le change.

### Mise en place (`add-classic-rules-engine`, spec `game-setup`)

- [ ] **Neutre à 2 joueurs** : ses 14 territoires sont tirés au hasard et ses armées réparties au
  hasard. Règle officielle : les joueurs placent eux-mêmes les armées neutres, à tour de rôle.
- [ ] **Placement aléatoire** : en plus des territoires, les armées restantes de chaque joueur sont
  réparties au hasard. Règle officielle : seuls les territoires sont distribués (par les cartes),
  chaque joueur place ensuite ses armées lui-même. Le placement manuel, lui, suit la règle officielle.
- [ ] **Premier joueur** tiré au sort par le générateur de la partie. Règle officielle : le joueur
  qui obtient le plus haut lancer de dé commence. Résultat équivalent.

### Combat (`add-classic-rules-engine`, spec `combat`)

- [ ] **Dés du défenseur choisis automatiquement** : il lance toujours le maximum autorisé.
  Règle officielle : le défenseur choisit de lancer 1 ou 2 dés. Lancer moins n'est presque jamais
  avantageux, mais c'est une décision qui disparaît.
- [ ] **Attaque blitz** (enchaîner les lancers jusqu'à la conquête ou à l'épuisement) : facilité
  propre aux versions numériques, absente de la règle officielle. Elle ne change pas les
  probabilités.

### Cartes (`add-classic-rules-engine`, spec `territory-cards`)

- [ ] **Bonus de +2 armées d'un échange** placé automatiquement sur le premier territoire éligible,
  dans l'ordre des cartes fournies. Règle officielle : si plusieurs cartes désignent des territoires
  possédés, le joueur choisit lequel reçoit le bonus.
- [ ] **Barème fixe** (4, 6, 8, 10) : variante européenne, proposée en option ; le barème progressif
  officiel reste la valeur par défaut. Une série avec joker vaut la meilleure valeur qu'elle permet
  de former.

### Fortification (`add-classic-rules-engine`, spec `fortification`)

- [ ] **Mode adjacent par défaut** : règle des éditions classiques (un seul déplacement vers un
  territoire voisin). Le mode « chemin connexe » des éditions récentes est proposé en option. Choix
  de version plutôt que simplification.

### Missions secrètes (`add-secret-missions`, spec `secret-missions`)

- [ ] **Missions d'élimination par joueur** : une mission « éliminer <joueur> » par joueur présent.
  Règle officielle : une mission par couleur (6), y compris les couleurs absentes de la partie, qui
  se convertissent alors en « 24 territoires ». La proportion de missions d'élimination est donc plus
  élevée avec peu de joueurs.
- [ ] **Déplacement minimal automatique** quand une mission est accomplie par une conquête, pour
  qu'aucun territoire ne reste sans armée. Ajout technique, sans équivalent dans la règle officielle.
- [ ] **Mission vérifiée seulement pour le joueur courant**, après chacune de ses actions : une
  situation qui remplit la mission d'un autre joueur pendant le tour d'un adversaire ne le fait pas
  gagner avant son propre tour.

### Mode capitales (`add-capitals-mode`, spec `capitals-mode`)

- [ ] **Choix des capitales à tour de rôle et public** : chaque joueur voit les capitales déjà
  choisies avant de désigner la sienne. Règle officielle de 1993 (à vérifier) : choix en secret puis
  révélation simultanée.
- [ ] **Déplacement minimal automatique** quand la dernière capitale est prise par une conquête,
  comme pour les missions.
- [ ] **Aucun avantage lié à la capitale** (ni bonus de défense ni renforts), conformément à la
  règle officielle ; les variantes non officielles qui en ajoutent sont écartées.

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

- [ ] Jouer plusieurs parties complètes sur ordinateur, tablette et téléphone, avec chaque variante.
- [ ] Mettre à jour le README : fonctionnalités réellement livrées, captures d'écran.
- [ ] Choisir un hébergement statique pour jouer depuis n'importe quel appareil.

## Pistes après la V1

Écartées du périmètre de la V1, à reconsidérer ensuite :

- Multijoueur en ligne.
- Sons et musique.
- Brouillard de guerre.
- IA par simulation (Monte-Carlo).
- Relecture pas à pas d'une partie terminée.
- Plusieurs emplacements de sauvegarde, export et import de partie.
- Interface en anglais.
