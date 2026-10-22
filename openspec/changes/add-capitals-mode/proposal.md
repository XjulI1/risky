## Why

Le mode capitales (« Capital Risk ») est la seconde variante retenue. Il remplace la conquête totale
par un objectif lisible et public : tenir toutes les capitales à la fois. Les parties sont plus
courtes et plus tendues, car chaque joueur doit à la fois protéger sa capitale et frapper celles des
autres.

## What Changes

- **Réglage « Mode capitales »** à la création (désactivé par défaut), incompatible avec les missions
  secrètes.
- **Choix des capitales** : après la mise en place, chaque joueur non neutre désigne, à tour de rôle,
  un de ses territoires comme capitale. Les capitales sont publiques ; le neutre n'en a pas.
- **Victoire** : le joueur courant gagne dès qu'il possède toutes les capitales en même temps, la
  sienne comprise. Perdre sa capitale n'élimine pas ; une capitale prise reste une capitale.
  L'élimination de tous les adversaires reste une victoire.
- **Interface** : option exclusive dans la création, phase de choix guidée sur le plateau, marqueur
  3D de capitale, décompte des capitales tenues dans le HUD, entrées de journal, motif de victoire
  sur l'écran de fin.
- **IA** : choix de capitale, défense de la sienne et attaque des capitales adverses (normal et
  difficile) ; choix simple pour le niveau facile.

## Capabilities

### New Capabilities

- `capitals-mode` : réglage, exclusivité avec les missions, phase de choix, victoire par les capitales.
- `capitals-interface` : option de création, choix guidé, marqueur sur le plateau, HUD, journal et fin de partie.
- `capitals-ai` : choix de capitale et stratégie des IA autour des capitales.

### Modified Capabilities

(aucune)

## Hors périmètre

- Bonus de défense ou de renforts liés à la capitale (variantes non officielles).
- Déplacement de capitale en cours de partie.
- Combinaison avec les missions secrètes.

## Impact

- Moteur : nouveau réglage, nouvelle phase `capitalChoice`, champ `capitals` dans l'état, victoire
  étendue (`winReason: 'capitals'`), nouveaux événements (capitale choisie, capitale prise).
- IA : décision pour la phase de choix, heuristiques normal et difficile ajustées.
- Plateau : marqueur de capitale.
- Interface : création, HUD, journal, écran de fin.
- Sauvegarde : `formatVersion` passe à 3.
- Aucune nouvelle dépendance.
- Dépend de tous les changes précédents, dont `add-secret-missions` pour la règle d'exclusivité et la
  généralisation de la vérification de victoire.
