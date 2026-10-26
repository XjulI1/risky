## MODIFIED Requirements

### Requirement: Géométrie complète de la carte

Chaque territoire de la carte de la partie SHALL avoir exactement une forme dans la géométrie de
cette carte, identifiée par l'identifiant de territoire du moteur, et aucune forme ne SHALL désigner
un territoire inconnu de cette carte. Chaque territoire SHALL être rendu comme un volume en relief
au-dessus de l'océan. Le plateau SHALL afficher la géométrie, les liaisons maritimes et les
étiquettes de continent de la carte de la partie qu'il reçoit, et cadrer la caméra sur cette carte.

#### Scenario: Correspondance avec le moteur

- **WHEN** on charge la géométrie de chaque carte du catalogue
- **THEN** elle contient exactement une forme pour chacun des territoires de cette carte dans le moteur et aucune autre

#### Scenario: Territoire en plusieurs morceaux

- **WHEN** un territoire est composé de plusieurs îles (par exemple l'Indonésie)
- **THEN** tous ses morceaux sont rendus et réagissent comme un seul territoire
