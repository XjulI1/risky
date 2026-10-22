# Spec Delta

## Purpose

Déterminer combien d'armées un joueur reçoit au début de son tour et lui permettre de les déployer
sur ses territoires.

## ADDED Requirements

### Requirement: Calcul des renforts

Au début de son tour, le joueur SHALL recevoir une réserve égale au nombre de territoires qu'il
possède divisé par 3 (arrondi à l'inférieur), avec un minimum de 3, plus le bonus de chaque continent
qu'il possède entièrement. Les armées obtenues par échange de cartes s'ajoutent à cette réserve.

#### Scenario: Minimum de trois

- **WHEN** un joueur commence son tour avec 7 territoires et aucun continent
- **THEN** sa réserve est de 3 armées

#### Scenario: Division par trois

- **WHEN** un joueur commence son tour avec 14 territoires et aucun continent
- **THEN** sa réserve est de 4 armées

#### Scenario: Bonus de continent

- **WHEN** un joueur commence son tour avec 12 territoires dont toute l'Océanie et toute l'Amérique du Sud
- **THEN** sa réserve est de 4 + 2 + 2 = 8 armées

### Requirement: Déploiement

Pendant la phase de renforts, le joueur SHALL pouvoir déployer tout ou partie de sa réserve sur un
de ses territoires, en une ou plusieurs actions, jusqu'à épuisement de la réserve.

#### Scenario: Déploiement valide

- **WHEN** le joueur déploie 2 armées de sa réserve de 5 sur un de ses territoires
- **THEN** le territoire gagne 2 armées et la réserve passe à 3

#### Scenario: Territoire adverse

- **WHEN** le joueur tente de déployer sur un territoire qu'il ne possède pas
- **THEN** l'action est rejetée

#### Scenario: Dépassement de la réserve

- **WHEN** le joueur tente de déployer plus d'armées que sa réserve ou un nombre inférieur à 1
- **THEN** l'action est rejetée
