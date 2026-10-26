## Why

Après des parties sur la carte du monde, une carte de la France métropolitaine renouvelle le jeu sur
un terrain familier. Elle garde le format du plateau classique (42 territoires) pour que les règles,
les armées de départ, le paquet de cartes et les missions chiffrées restent valables tels quels.
`support-multiple-maps` a rendu le jeu indépendant de la carte ; ce change ajoute la France.

## What Changes

- **Carte de France** de 42 territoires, chacun formé de 1 à 4 départements regroupés, répartis en
  **7 régions** qui jouent le rôle des continents. Les régions sont de grandes zones et non les 13
  régions administratives, pour retrouver la dynamique de la carte classique (peu de continents, de
  tailles variées) :

  | Région | Territoires | Bonus provisoire |
  |---|---|---|
  | Île-de-France | 2 | 3 |
  | Nord | 5 | 3 |
  | Ouest | 5 | 3 |
  | Centre | 6 | 4 |
  | Sud-Ouest | 7 | 4 |
  | Est | 7 | 4 |
  | Sud-Est | 10 | 5 |

  L'Île-de-France est une petite région très exposée, au contact de trois autres : son bonus est
  volontairement élevé pour rendre son attaque attractive. Les bonus sont ajustés par des parties
  entre IA avant d'être figés dans la spec.
- **Adjacences** déduites des frontières réelles des départements ; la Corse est reliée au continent
  par deux liaisons maritimes (Haute-Corse–Côte d'Azur, Corse-du-Sud–Provence).
- **Six missions de régions** propres à la France pour la variante missions secrètes ; les textes
  parlent de « région » au féminin (« une troisième région au choix »).
- **Géométrie** produite une fois par un script à partir des contours des départements de l'IGN
  (Licence Ouverte), versionnée dans `data/maps/france/` avec sa provenance.
- **Plateau** : les limites entre régions sont tracées d'un trait plus épais ; les noms des régions
  sont placés en mer quand la région touche le bord de la carte, sinon sur terre sans masquer de pion.
- **Création de partie** : choix de la carte (« Monde » ou « France »), « Monde » par défaut.
  Toutes les variantes et tous les niveaux d'IA restent disponibles sur les deux cartes.
- **IA** : vérification de la robustesse et de la progression de difficulté sur la carte de France.

## Capabilities

### New Capabilities

(aucune)

### Modified Capabilities

- `world-map` : composition, adjacences, missions et vocabulaire de la carte de France.
- `game-creation` : choix de la carte dans le formulaire.
- `board-rendering` : limites de régions et placement des noms de continent quand une région ne
  touche pas la mer.
- `ai-players` : le test de robustesse couvre la carte de France.
- `ai-strategy` : la progression de difficulté est vérifiée sur la carte de France.

## Hors périmètre

- Les pays voisins dessinés en décor autour de la France : l'océan entoure la carte, comme sur la
  carte classique.
- La Corse placée en encart : elle garde sa position réelle.
- La carte des 13 régions administratives comme continents, et l'outre-mer.
- La mention de la carte dans le résumé de reprise de l'accueil.
- Un tournoi de supériorité de l'IA experte sur la carte de France : la spec ne l'exige que sur la
  carte classique ; un tournoi est seulement lancé à titre indicatif.

## Impact

- Données : `data/maps/france/` (`board.json`, `territories.json`, `sea-routes.json`,
  `continent-labels.json`, `region-outlines.json`, `grouping.json`, source GeoJSON des départements,
  `SOURCE.md`).
- Outillage : script `scripts/build-france-map.ts` et ses fonctions testées, script
  `pnpm build:map:france`. **Nouvelle dépendance de développement : `mapshaper`**, à installer par
  l'utilisateur (`pnpm add -D mapshaper`).
- Moteur : `MapId` gagne `'france'`, carte `src/engine/maps/france.ts` au catalogue.
- Plateau : données de rendu de la France au catalogue, tracé des limites de régions.
- Interface : sélecteur de carte dans `CreateGameScreen`, `GameSetup.mapId`.
- IA : carte de France ajoutée au test de robustesse et au tournoi de progression.
- Documentation : `README.md` et `LICENSE.md` mentionnent la source et la licence des données IGN.
- Dépend de `support-multiple-maps`, qui doit être archivé avant de commencer.
