## MODIFIED Requirements

### Requirement: Création d'une partie

Le moteur SHALL créer une partie à partir d'une liste de 2 à 6 joueurs (chacun avec un identifiant,
un nom, une couleur et un type humain ou IA), d'une graine aléatoire, de réglages optionnels et d'un
identifiant de carte optionnel, la carte classique par défaut. Toutes les règles de la partie SHALL
s'appuyer sur cette carte. Une configuration invalide, dont une carte absente du catalogue, SHALL
être refusée avec une erreur explicite.

#### Scenario: Partie valide

- **WHEN** on crée une partie avec 4 joueurs et une graine
- **THEN** la partie contient ces 4 joueurs dans l'ordre fourni et une pioche de cartes mélangée

#### Scenario: Carte classique par défaut

- **WHEN** on crée une partie sans préciser de carte
- **THEN** la partie se joue sur la carte classique

#### Scenario: Carte inconnue

- **WHEN** on crée une partie avec l'identifiant de carte « atlantide »
- **THEN** la création échoue avec une erreur indiquant que la carte est inconnue

#### Scenario: Nombre de joueurs invalide

- **WHEN** on crée une partie avec 1 joueur ou avec 7 joueurs
- **THEN** la création échoue avec une erreur indiquant le nombre de joueurs attendu

#### Scenario: Identifiants ou couleurs en double

- **WHEN** deux joueurs partagent le même identifiant ou la même couleur
- **THEN** la création échoue avec une erreur explicite
