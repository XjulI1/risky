# Spec Delta

## Purpose

Garder une trace lisible de tout ce qui se passe dans la partie, pour suivre les tours des IA et
comprendre l'évolution de la partie.

## ADDED Requirements

### Requirement: Entrées du journal

Chaque événement du moteur SHALL produire une entrée en français dans le journal, rattachée au
joueur qui en est l'auteur et au numéro de tour. Les formulations SHALL être les suivantes :

| Événement | Entrée |
|---|---|
| Début de tour | « Tour <n> — <joueur> » (en-tête de groupe) |
| Déploiement | « <joueur> place <n> armée(s) en <territoire> » |
| Échange de cartes | « <joueur> échange une série contre <n> armées » |
| Attaque (tous ses lancers) | « <joueur> attaque <territoire> depuis <territoire> : <n> lancer(s) — <bilan des pertes> » |
| Conquête | « <joueur> conquiert <territoire> » |
| Déplacement après conquête | « <joueur> avance <n> armée(s) en <territoire> » |
| Fortification | « <joueur> déplace <n> armée(s) de <territoire> vers <territoire> » |
| Carte piochée | « <joueur> pioche une carte » |
| Élimination | « <joueur> est éliminé par <joueur> » |
| Victoire | « <joueur> remporte la partie » |

#### Scenario: Attaque en un lancer

- **WHEN** Alice attaque le Brésil depuis l'Afrique du Nord et l'emporte en un seul lancer, 6, 5, 1 contre 4, 4 de Bob
- **THEN** le journal contient « Alice attaque Brésil depuis Afrique du Nord : 1 lancer — Bob perd 2 armées »

#### Scenario: Accord du pluriel

- **WHEN** Alice place 1 armée en Ukraine
- **THEN** l'entrée est « Alice place 1 armée en Ukraine »

### Requirement: Attaque condensée

Les lancers d'une même attaque SHALL être regroupés en une seule entrée résumant le nombre de lancers
et les pertes totales de chaque camp, dépliable en une ligne par lancer de la forme « <dés> contre
<dés> — <bilan des pertes> ».

#### Scenario: Attaque de quatre lancers

- **WHEN** une attaque d'Alice sur le Brésil dure 4 lancers où Alice perd 3 armées et Bob 5
- **THEN** le journal contient une entrée « Alice attaque Brésil depuis Afrique du Nord : 4 lancers — Alice perd 3 armées, Bob perd 5 armées », dépliable en 4 lignes de lancer

#### Scenario: Détail d'un lancer

- **WHEN** l'utilisateur déplie l'entrée d'une attaque dont un lancer a donné 6, 5, 1 contre 4, 4
- **THEN** ce lancer apparaît sous la forme « 6-5-1 contre 4-4 — Bob perd 2 armées »

### Requirement: Pas de fuite d'information

Le journal SHALL NOT révéler le territoire ou le symbole des cartes piochées, ni le contenu des mains.
Une entrée SHALL n'apparaître qu'une fois l'animation correspondante jouée.

#### Scenario: Carte piochée anonyme

- **WHEN** Bob pioche la carte Pérou
- **THEN** le journal indique seulement « Bob pioche une carte »

#### Scenario: Pas de spoiler des dés

- **WHEN** un lancer est en cours d'animation
- **THEN** son entrée n'est pas encore visible dans le journal

### Requirement: Panneau du journal

Le HUD SHALL offrir un panneau de journal repliable, regroupé par tour, où chaque entrée porte la
couleur de son auteur. Le panneau SHALL défiler automatiquement vers la dernière entrée, sauf si
l'utilisateur a fait défiler vers le haut. Le journal SHALL être conservé dans la sauvegarde.

#### Scenario: Défilement automatique

- **WHEN** une nouvelle entrée arrive alors que le panneau affiche la fin du journal
- **THEN** le panneau défile pour montrer la nouvelle entrée

#### Scenario: Lecture de l'historique

- **WHEN** l'utilisateur a remonté le journal et qu'une nouvelle entrée arrive
- **THEN** la position de lecture ne bouge pas et un indicateur « Nouvelles actions » apparaît
