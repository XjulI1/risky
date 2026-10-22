# Source des données de la carte classique

Les fichiers de ce dossier proviennent du projet open source **RISK** de Konrad Kopp :

- Dépôt : <https://github.com/kopy-kat/risk>
- Commit : `616aefa0933cb5476c18df4465c634ac689608f2` (28 septembre 2026)
- Récupérés le 22 octobre 2026

Ce projet contient aussi un second jeu (Kessel) avec ses propres cartes ; seules les données de la
carte classique du Risk ont été reprises.

## Contenu

| Fichier | Origine dans le projet source | Contenu |
|---|---|---|
| `board.json` | `data/board.json`, copie à l'identique | Continents (nom anglais, bonus), noms anglais des territoires, adjacences |
| `territories.json` | `data/territories.json`, copie à l'identique | `viewBox` de la carte et, pour chaque territoire : identifiant, continent, point d'ancrage d'étiquette (`cx`, `cy`) et contour en données de chemin SVG (`d`) |
| `sea-routes.json` | `data/sea-routes.json`, copie à l'identique | Liaisons maritimes entre territoires adjacents sans frontière terrestre, avec le point le plus proche sur chaque côte ; amorces de bord de carte pour la liaison Alaska–Kamtchatka (`wrap`) |
| `continent-labels.json` | Constante `CONTINENT_LABEL_POS` de `src/engine/board.ts`, extraite en JSON | Position des étiquettes de continent, en pleine mer |
| `LICENSE-map-geometry.md` | `data/LICENSE`, copie à l'identique | Licence CC BY-SA 3.0 de la géométrie |

Toutes les coordonnées sont exprimées dans le repère du SVG d'origine (axe Y vers le bas).

Vérifications faites à la récupération : 42 territoires, 6 continents (9, 4, 7, 6, 12 et 4
territoires), identifiants identiques dans les trois fichiers, adjacences symétriques sans boucle,
graphe connexe de 83 liaisons, toutes les liaisons maritimes correspondant à une adjacence.

## Licences

### Géométrie : CC BY-SA 3.0

`territories.json` et `sea-routes.json` sont dérivés de
[`Risk_board.svg`](https://commons.wikimedia.org/wiki/File:Risk_board.svg) de **Gr0gmint**, publié
sur Wikimedia Commons sous licence
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Ils restent sous cette licence :
toute copie ou modification doit conserver cette attribution et être distribuée sous la même
licence. Voir `LICENSE-map-geometry.md`.

### Topologie et étiquettes : licence MIT

`board.json` (topologie du plateau, qui relève du fait et non de l'œuvre) et `continent-labels.json`
proviennent du projet source, distribué sous licence MIT :

```
MIT License

Copyright (c) 2026 Konrad Kopp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Marque

« RISK » est une marque de Hasbro. Aucune illustration de Hasbro n'est utilisée ici ; le nom ne doit
pas être repris pour une diffusion autre que personnelle.
