## Why

Avec le moteur (`add-classic-rules-engine`) et le plateau 3D (`add-3d-board`), il manque ce qui fait
un jeu : créer une partie, comprendre à qui c'est le tour et ce qu'on peut faire, agir sur le
plateau, voir les dés rouler et gérer ses cartes. Ce change rend le jeu jouable de bout en bout,
d'abord entre humains sur le même écran, ce qui permet de valider règles et ergonomie avant
d'ajouter l'IA.

## What Changes

- **Écrans** : accueil, création de partie, partie en cours, fin de partie.
- **Création de partie** : 2 à 6 joueurs humains (nom, couleur), réglages numériques du moteur,
  graine aléatoire.
- **Contrôles du tour** : bandeau indiquant joueur, phase et réserve ; parcours guidés sur le plateau
  pour chaque phase (revendication et placement initial, déploiement, attaque, déplacement après
  conquête, fortification), boutons de fin de phase, messages d'erreur du moteur.
- **Combat** : attaque confirmée puis menée jusqu'au bout, dés animés à chaque lancer, vitesse
  d'animation réglable (lente, normale, rapide, instantanée), animation de conquête.
- **Main de cartes** : affichage des cartes, sélection d'une série valide, échange, échange forcé.
- **Passage de main** entre humains : écran intermédiaire qui masque les informations privées
  quand plusieurs humains partagent l'écran.
- **Mise en page desktop et tablette** : conçue pour le paysage à partir de 1024 × 768, HUD en panneau
  latéral, commandes utilisables à la souris et au doigt. En dessous de 1024 px ou en portrait, un
  bandeau signale que l'écran n'est pas une cible, sans bloquer l'application.
- Remplacement de l'écran de démonstration du plateau.

## Capabilities

### New Capabilities

- `game-screens` : navigation entre accueil, création, partie et fin de partie.
- `game-creation` : formulaire de création d'une partie et validation de la configuration.
- `turn-controls` : HUD et parcours d'interaction de chaque phase, passage de main entre humains.
- `combat-display` : dés animés, enchaînement des lancers d'une attaque, vitesse d'animation et animation des conquêtes.
- `card-hand` : main de cartes, choix d'une série et échanges.

### Modified Capabilities

(aucune)

## Hors périmètre

- Joueurs IA : `add-heuristic-ai` (la création ne propose ici que des humains).
- Sauvegarde, reprise, journal et statistiques : `add-save-and-journal`.
- Missions secrètes et capitales : `add-secret-missions`, `add-capitals-mode`.
- Sons et musique : non retenus pour la V1.

## Impact

- Nouvelles dépendances à installer par l'utilisateur (`pnpm add`) : `tailwindcss`,
  `@tailwindcss/vite` ; en dev, `@vue/test-utils` et `happy-dom` pour les tests de composants.
- Nouveaux dossiers `src/game/` (session de jeu, contrôleur d'interaction) et `src/ui/`
  (écrans et composants du HUD).
- `src/App.vue` devient le routeur d'écrans ; l'écran de démonstration du plateau disparaît.
- Dépend de `add-classic-rules-engine` et `add-3d-board`. Ni le moteur ni le plateau ne changent
  de comportement.
