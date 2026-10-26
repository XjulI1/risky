# Design

## Context

Après `support-multiple-maps`, une carte s'ajoute en trois points : une `GameMap` au catalogue du
moteur (`src/engine/maps/`), des données de rendu au catalogue du plateau (`src/board/maps/`), et une
valeur de `MapId`. La carte classique vient de données toutes faites ; pour la France, il faut
produire la géométrie et la topologie à partir des contours réels des départements, puis les
regrouper. Le plateau lit des chemins SVG (`M`, `L`, `C`, `Z`) dans un repère à axe Y vers le bas et
en déduit pions, cadrage et liaisons maritimes. Motivation : proposal.md ; exigences : `specs/`.

## Goals / Non-Goals

**Goals :**

- Une géométrie reconnaissable de la France, reproductible par un script, et une topologie
  déduite des frontières réelles plutôt que saisie à la main.
- Un plateau aussi lisible que la carte classique au zoom minimal sur une tablette 1024 × 768.
- Des bonus validés par des parties entre IA plutôt que fixés à l'intuition.

**Non-Goals :**

- Pas de génération à la volée : le script tourne une fois, son résultat est versionné ; ni le
  build ni l'application ne l'exécutent.
- Pas de dessin des pays voisins ni d'encart pour la Corse.

## Decisions

### Source des contours

`departements-version-simplifiee.geojson` du dépôt `gregoiredavid/france-geojson` (commit
`5d34ee6`, 570 Ko) : départements 2018 de l'IGN ADMIN EXPRESS COG, déjà simplifiés par mapshaper
avec une topologie cohérente (frontières partagées identiques des deux côtés). Les limites
départementales n'ont pas changé depuis. Le fichier est versionné dans `data/maps/france/source/`
pour que le script soit reproductible hors ligne ; l'application ne l'importe pas.

Licence : les contours sont ceux de l'IGN, sous Licence Ouverte Etalab, qui n'impose que la
mention de la source et de la date. Le dépôt intermédiaire ne déclare pas de licence propre ; sa
seule transformation est une simplification automatique. `SOURCE.md` cite l'IGN, le millésime et le
dépôt intermédiaire.

Alternative écartée : télécharger ADMIN EXPRESS directement auprès de l'IGN. Plus propre sur la
provenance, mais des centaines de Mo de shapefiles pour un résultat identique après simplification.

### Données d'entrée écrites à la main

- `data/maps/france/grouping.json` : pour chaque territoire, son identifiant, sa région et ses codes
  de département. C'est la seule entrée du script en plus de la source.
- `data/maps/france/continent-labels.json` : position des étiquettes de région, placée à la main
  dans le repère du `viewBox` produit, comme pour la carte classique. Le script ne l'écrase pas.
- `src/engine/maps/france.ts` : noms affichables des territoires, noms et noms avec article des
  régions, bonus, missions et `continentTerm: { singular: 'région', feminine: true }`. Les bonus
  vivent ici et non dans les données générées, pour que l'équilibrage ne demande pas de relancer le
  script.

Identifiants des régions : `ile_de_france`, `nord`, `ouest`, `centre`, `sud_ouest`, `est`,
`sud_est`. Identifiants des territoires, dans l'ordre de la spec : `paris`, `brie_hurepoix`,
`flandre`, `artois`, `picardie`, `haute_normandie`, `basse_normandie`, `bretagne_occidentale`,
`bretagne_orientale`, `pays_nantais`, `maine`, `anjou`, `beauce`, `touraine`, `berry`, `limousin`,
`bourbonnais`, `haute_auvergne`, `poitou`, `charentes`, `guyenne`, `landes_bearn`, `gascogne`,
`toulousain`, `quercy_rouergue`, `champagne`, `aube_haute_marne`, `lorraine`, `alsace`,
`bourgogne_nord`, `bourgogne_sud`, `franche_comte`, `lyonnais`, `savoie`, `dauphine`,
`alpes_du_sud`, `provence`, `cote_d_azur`, `languedoc`, `roussillon`, `haute_corse`,
`corse_du_sud`.

### Script de production

`scripts/build-france-map.ts`, lancé par `pnpm build:map:france` (`node` exécute le TypeScript
directement depuis Node 24). Il enchaîne, avec l'API de mapshaper :

1. Lecture de la source, rattachement de chaque département à son territoire et à sa région via
   `grouping.json` ; arrêt en erreur si un département manque, est en double ou est inconnu.
2. Projection en Lambert-93 (chaîne proj4 explicite) : distances en mètres, formes conformes à
   celles des cartes françaises usuelles.
3. Fusion par territoire en conservant la topologie, export TopoJSON en mémoire.
4. **Adjacences** : deux territoires sont voisins si les arcs qu'ils partagent mesurent au moins
   1 km au total, calculé avant toute simplification supplémentaire. Le seuil écarte les contacts
   ponctuels entre départements. Les deux liaisons maritimes corses sont ajoutées depuis une
   constante du script.
5. Simplification supplémentaire (pourcentage réglé pour que `territories.json` reste sous 250 Ko)
   avec conservation des formes, et suppression des îles de moins de 40 km² (Ré, Oléron et
   Belle-Île restent ; les îlots disparaissent).
6. Conversion en chemins SVG : mise à l'échelle sur un `viewBox` de 1000 unités de large, axe Y
   inversé, un sous-chemin `M … L … Z` par anneau, coordonnées arrondies au dixième. Arrêt en erreur
   si un territoire comporte un trou : le plateau n'extrude pas de formes trouées, et aucun
   regroupement de la spec n'en crée.
7. Point d'étiquette `cx`/`cy` de chaque territoire au pôle d'inaccessibilité de son plus grand
   morceau, comme le calcul déjà fait par le plateau, pour garder le format de la carte classique.
8. Contours de région par fusion des territoires de chaque région, simplifiés de la même façon.
9. Points les plus proches entre les côtes de chaque paire de la liaison maritime.

Sorties : `territories.json` (même format que la carte classique), `board.json` (régions de chaque
territoire et adjacences, sans noms ni bonus), `sea-routes.json` (`wrap` vide), `region-outlines.json`.

Les étapes 1, 4, 6, 7 et 9 sont des fonctions pures dans `scripts/map-builder/`, testées par Vitest
(nouveau projet `scripts` dans `vitest.config.ts`, `scripts/**/*.ts` ajouté à `tsconfig.json`). Le
script lui-même n'est pas testé : son résultat l'est, par les tests de la carte.

Alternative écartée : saisir les adjacences à la main. 42 territoires et environ 100 frontières :
le risque d'oubli est réel, et le script le rend vérifiable.

### Moteur

`france.ts` n'importe que `board.json` (quelques Ko), pas `territories.json` : le worker de l'IA
n'embarque ainsi pas la géométrie de la France. La carte classique, qui lit encore sa géométrie pour
connaître ses territoires, n'est pas modifiée.

### Plateau

- `src/board/maps/index.ts` ajoute l'entrée `france` (`territories.json`, `sea-routes.json`,
  `continent-labels.json`, `region-outlines.json`). `BoardMap` gagne `regionOutlines`, vide pour la
  carte classique.
- Les limites de région utilisent `Line2` et `LineMaterial` des modules d'exemple de three.js
  (déjà dans la dépendance `three`) : `LineBasicMaterial` ignore toute épaisseur supérieure à 1
  pixel en WebGL. Trait d'environ 3 pixels, plus opaque que les frontières de territoire, tracé
  juste au-dessus d'elles ; la largeur de `LineMaterial` suit la résolution du canvas.
- Étiquettes : Ouest, Nord, Sud-Ouest et Sud-Est en mer, Est au-delà de la frontière est (zone vide
  de la carte). Centre et Île-de-France sur terre ; un test vérifie qu'aucune étiquette n'est à moins
  d'une distance de sécurité d'un pion, et la position est validée visuellement au zoom minimal.
- La carte de France est presque carrée : la profondeur du monde avoisine sa largeur. Le cadrage
  calculé par `support-multiple-maps` s'en charge ; l'étendue des ombres (60 unités de part et
  d'autre) couvre encore toute la carte.

### Interface

Un groupe de deux boutons radio « Monde » / « France » en tête des réglages de `CreateGameScreen`,
lié à `GameSetup.mapId`. Rien d'autre ne dépend de la carte dans le formulaire.

### Équilibrage des bonus

Un test lancé à la demande (`pnpm test:balance:france`, sur le modèle de `test:expert`) joue
120 parties à trois IA difficiles sur la carte de France et affiche pour chaque région : part des
parties où elle a été tenue entière au moins une fois, tour moyen de la première prise complète,
part des victoires du premier joueur à la tenir, nombre moyen de changements de propriétaire de
l'Île-de-France. Objectifs :

- chaque région est tenue entière dans au moins 20 % des parties ;
- aucune région ne donne la victoire à son premier détenteur dans plus de 60 % des parties ;
- l'Île-de-France change de mains plus souvent que toute autre région (elle doit attirer les
  attaques).

Les bonus sont ajustés d'une unité à la fois jusqu'à atteindre ces objectifs, puis reportés dans
la spec `world-map` du change et dans `france.ts`. Le tournoi de progression de difficulté
(spec `ai-strategy`) est relancé avec les bonus définitifs.

## Risks / Trade-offs

- [Paris (4 départements, environ 3 800 km²) est le plus petit territoire : pion, compteur et
  marqueur de capitale peuvent y être serrés] → les tests de placement existants s'appliquent à la
  France ; si le marqueur de capitale ne tient pas, le regroupement de l'Île-de-France sera revu
  avant l'implémentation du plateau.
- [La France flotte dans l'océan, sans pays voisins : la frontière est paraît être une côte] →
  accepté pour cette version, noté hors périmètre.
- [Le seuil de 1 km rend adjacents deux territoires à peine en contact, ou en sépare deux qu'on
  attendrait voisins] → le script affiche les 10 frontières partagées les plus courtes ; elles sont
  relues et le seuil ajusté avant de figer `board.json`.
- [Le bundle principal (1,3 Mo) grossit d'environ 250 Ko et approche la limite de précache du
  service worker] → vérifier la sortie de `pnpm build` ; si la limite est franchie, la relever dans
  `vite.config.ts`.
- [La mention « Mode classique uniquement pour le niveau Expert » peut se lire comme « carte
  classique » sur la carte de France] → l'expert reste disponible sur la France ; la mention n'est
  affichée que lorsqu'une variante est cochée, ce qui lève l'ambiguïté. Pas de changement de texte.

## Migration Plan

Aucune migration : les sauvegardes existantes portent `mapId: 'classic'`. L'installation de
`mapshaper` (`pnpm add -D mapshaper`) est à lancer par l'utilisateur avant le script de production.
