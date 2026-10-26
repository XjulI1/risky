# Source des données de la carte de France

Les contours de ce dossier sont dérivés des limites départementales de l'**IGN**, base
**ADMIN EXPRESS COG**, millésime 2018. Les limites des départements métropolitains n'ont pas changé
depuis.

Ils ont été repris de la version simplifiée publiée par le projet **france-geojson** de Grégoire
David, dont la seule transformation est une simplification automatique par mapshaper, qui conserve
une topologie cohérente :

- Dépôt : <https://github.com/gregoiredavid/france-geojson>
- Commit : `5d34ee6`
- Fichier : `departements-version-simplifiee.geojson`
- Récupéré le 26 octobre 2026

## Contenu

| Fichier | Origine | Contenu |
|---|---|---|
| `source/departements-version-simplifiee.geojson` | Copie à l'identique du fichier ci-dessus | Contours des 96 départements métropolitains, en longitude et latitude |
| `grouping.json` | Écrit à la main d'après la spec `world-map` | Régions, puis pour chaque territoire : identifiant, région et codes de ses départements |
| `territories.json` | Produit par le script | `viewBox` de la carte et, pour chaque territoire : identifiant, région (`continent`), point d'étiquette (`cx`, `cy`) et contour en données de chemin SVG (`d`) |
| `board.json` | Produit par le script | Régions, région de chaque territoire et adjacences, sans noms ni bonus (ceux-ci sont dans `src/engine/maps/france.ts`) |
| `sea-routes.json` | Produit par le script | Les deux liaisons maritimes de la Corse, avec le point le plus proche sur chaque côte ; aucune amorce de bord (`wrap` vide) |
| `region-outlines.json` | Produit par le script | Contour de chacune des 7 régions, en données de chemin SVG |
| `continent-labels.json` | Écrit à la main | Position des étiquettes de région, dans le repère du `viewBox` |

Toutes les coordonnées sont exprimées dans le repère du SVG produit (axe Y vers le bas), sur un
`viewBox` de 1000 unités de large.

## Régénération

```
pnpm build:map:france
```

Le script `scripts/build-france-map.ts` lit la source et `grouping.json`, puis, avec mapshaper :

1. vérifie que chaque département est rattaché à exactement un territoire ;
2. projette les contours en Lambert-93 (EPSG:2154) ;
3. fusionne les départements de chaque territoire en conservant la topologie ;
4. rend voisins deux territoires dont les frontières partagées mesurent au moins 1 km au total, sur
   les contours non simplifiés, et ajoute les liaisons Haute-Corse–Côte d'Azur et
   Corse-du-Sud–Provence ;
5. supprime les îles de moins de 40 km² (Ré, Oléron et Belle-Île restent) ;
6. bouche les trous, que le plateau ne sait pas extruder : l'étang de Berre et Llívia sont comblés,
   et les enclaves (Enclave des Papes, enclaves des Hautes-Pyrénées dans les Pyrénées-Atlantiques)
   sont dessinées comme une partie du territoire qui les entoure. Les adjacences, calculées à
   l'étape 4 sur les vrais départements, n'en dépendent pas ;
7. convertit les contours en chemins SVG, arrondis au dixième ;
8. place le point d'étiquette de chaque territoire au pôle d'inaccessibilité de son plus grand
   morceau ;
9. fusionne les territoires de chaque région pour en tracer le contour ;
10. relie les côtes les plus proches de chaque liaison maritime.

Le script affiche les 10 frontières partagées les plus courtes pour relire le seuil.
`continent-labels.json` n'est pas écrasé.

Vérifications faites à la production : 96 départements, chacun dans un seul territoire ;
42 territoires, 7 régions (2, 5, 5, 6, 7, 7 et 10 territoires) ; aucun territoire troué ;
94 adjacences, la plus courte frontière retenue mesurant 3,7 km (Anjou–Bretagne orientale), aucun
contact entre territoires n'étant plus court que le seuil ; adjacences et non-adjacences de la spec
respectées ; `territories.json` de 139 Ko.

## Licence

Les contours sont ceux de l'IGN, diffusés sous la
[Licence Ouverte / Open Licence version 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2.0)
d'Etalab, qui permet la réutilisation, y compris commerciale, sous réserve de mentionner la source et
la date de dernière mise à jour :

> Source : IGN, ADMIN EXPRESS COG, édition 2018 ; simplification par le projet france-geojson.

Le dépôt intermédiaire ne déclare pas de licence propre. Les fichiers produits par le script, le
regroupement et les positions d'étiquettes restent sous cette même mention de source.
