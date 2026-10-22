## Why

Le mode capitales (« Capital Risk ») est la seconde variante retenue. Il remplace la conquête totale
par un objectif lisible : tenir toutes les capitales à la fois. Les parties sont plus courtes et plus
tendues, car chaque joueur doit à la fois protéger sa capitale et frapper celles des autres.

## What Changes

- **Réglage « Mode capitales »** à la création (désactivé par défaut), incompatible avec les missions
  secrètes.
- **Choix secret des capitales**, comme dans la règle officielle : après le placement, chaque joueur
  non neutre désigne à son tour un de ses territoires sans voir les choix des autres ; toutes les
  capitales sont révélées en même temps. Le neutre n'en a pas.
- **Bonus de défense** : lors d'un lancer contre une capitale, le dé le plus haut du défenseur compte
  +1, quel que soit le propriétaire du territoire. Ajout par rapport à la règle officielle, pour que
  les capitales ne tombent pas trop vite.
- **Victoire** : le joueur courant gagne dès qu'il possède toutes les capitales en même temps, la
  sienne comprise. Perdre sa capitale n'élimine pas ; une capitale prise reste une capitale.
  L'élimination de tous les adversaires reste une victoire.
- **Interface** : option exclusive dans la création, choix secret guidé sur le plateau, annonce de
  révélation, marqueur 3D de capitale, dé bonifié signalé, décompte des capitales tenues, entrées de
  journal, motif de victoire sur l'écran de fin.
- **IA** : choix de capitale sans voir ceux des autres, probabilités tenant compte du bonus, défense
  de sa capitale et attaque des capitales adverses (normal et difficile) ; choix simple pour le
  niveau facile.

## Capabilities

### New Capabilities

- `capitals-mode` : réglage, exclusivité avec les missions, choix secret et révélation, bonus de défense, victoire par les capitales.
- `capitals-interface` : option de création, choix secret guidé, révélation, marqueur sur le plateau, bonus visible, HUD, journal et fin de partie.
- `capitals-ai` : choix de capitale, probabilités avec bonus et stratégie des IA autour des capitales.

### Modified Capabilities

(aucune)

## Hors périmètre

- Partie courte officielle (prendre seulement 2 ou 3 capitales adverses) : écartée.
- Renforts supplémentaires liés aux capitales.
- Déplacement de capitale en cours de partie.
- Combinaison avec les missions secrètes.

## Impact

- Moteur : nouveau réglage, nouvelle phase `capitalChoice` avec choix cachés, champ `capitals` dans
  l'état, bonus de défense dans la résolution des lancers, victoire étendue (`winReason: 'capitals'`),
  nouveaux événements (capitale choisie, capitales révélées, capitale prise).
- IA : décision pour la phase de choix, table de probabilités avec bonus, heuristiques normal et
  difficile ajustées.
- Plateau : marqueur de capitale.
- Interface : création, HUD, dés, journal, écran de fin.
- Sauvegarde : `formatVersion` passe à 3.
- Aucune nouvelle dépendance.
- Dépend de tous les changes précédents, dont `add-secret-missions` pour la règle d'exclusivité et la
  généralisation de la vérification de victoire.
