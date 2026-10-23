## Why

La conquête du monde entier rend les parties longues et prévisibles. La variante « missions
secrètes » du Risk donne à chaque joueur un objectif caché, raccourcit les parties et ajoute du
bluff. C'est l'une des deux variantes retenues pour le projet.

## What Changes

- **Réglage « Missions secrètes »** à la création (désactivé par défaut), refusé à 2 joueurs comme
  dans les règles officielles.
- **Paquet de missions** : 8 missions générales (paires de continents, 24 territoires, 18 territoires
  à 2 armées) et une mission « éliminer <joueur> » par joueur de la partie. Chaque joueur en tire une
  au hasard.
- **Règles** : une mission qui désigne son propre détenteur, ou dont la cible est éliminée par
  quelqu'un d'autre, devient « conquérir 24 territoires ». Le joueur courant gagne dès que sa
  mission est accomplie, même au milieu d'une attaque. Éliminer tous les adversaires reste une
  victoire.
- **Information cachée** : chaque joueur ne voit que sa mission ; toutes sont révélées en fin de
  partie.
- **Interface** : option dans la création, bouton « Ma mission » avec progression, notification
  privée en cas de conversion, révélation des missions et motif de victoire sur l'écran de fin,
  entrée de journal sans fuite.
- **IA** : les niveaux normal et difficile orientent leur stratégie vers leur mission ; le niveau
  facile l'ignore.

## Capabilities

### New Capabilities

- `secret-missions` : réglage, paquet, attribution, conversion, accomplissement et victoire par mission.
- `mission-interface` : option de création, affichage privé de la mission et de sa progression, révélation de fin.
- `mission-ai` : prise en compte de la mission par les IA normale et difficile.

### Modified Capabilities

(aucune)

## Hors périmètre

- Missions personnalisées ou paquet de missions alternatif.
- Combinaison avec le mode capitales : les deux variantes s'excluent ; l'exclusion est portée par
  `add-capitals-mode`.
- Missions à deux joueurs : exclues par les règles officielles.

## Impact

- Moteur : nouveau réglage, missions dans l'état, vérification de victoire étendue (point d'extension
  prévu dans `add-classic-rules-engine`), nouveaux événements (mission accomplie, mission convertie).
- IA : `PlayerView` inclut la propre mission du joueur et jamais celles des autres ; heuristiques
  normal et difficile ajustées.
- Interface : création, HUD, écran de fin, journal.
- Sauvegarde : `formatVersion` passe à 2, les anciennes sauvegardes sont rejetées proprement.
- Aucune nouvelle dépendance.
- Dépend de tous les changes précédents.
