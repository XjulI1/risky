# Tasks

## 1. Dépendances

- [x] 1.1 **À lancer par l'utilisateur** : `pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator`, puis `pnpm add -D workbox-window` (dépendance « peer » de `vite-plugin-pwa`, requise par le module d'enregistrement du service worker). Si pnpm signale le script d'installation de `sharp` comme bloqué, le déclarer dans `allowBuilds` sans l'autoriser (binaires précompilés suffisants). Vérifier que `vite-plugin-pwa` (2.x) et `@vite-pwa/assets-generator` figurent dans les `devDependencies` et que `pnpm type-check` passe toujours.

## 2. Icônes

- [x] 2.1 Dessiner `public/icon.svg` aux couleurs du thème (fond océan, motif encre et parchemin, accent doré), avec le motif dans la zone de sécurité centrale de 80 % pour la variante « maskable » ; vérifier son rendu dans un navigateur.
- [x] 2.2 Ajouter `pwa-assets.config.ts` (préréglage `minimal2023Preset`, source `public/icon.svg`), l'inclure dans `tsconfig.json` et ajouter le script `generate-pwa-assets` au `package.json` ; vérifier que `pnpm generate-pwa-assets` produit dans `public/` les PNG 64, 192, 512, maskable 512, Apple 180 et `favicon.ico`, puis les versionner.

## 3. Manifeste et service worker

- [x] 3.1 Écrire les tests de `src/pwa/manifest.ts` : nom et nom court « Risky », langue `fr`, `start_url`, `scope` et `id` relatifs, affichage `standalone`, orientation `landscape`, couleurs de fond et de thème, icônes 192 et 512 dont une `maskable` dont chaque fichier existe dans `public/`.
- [x] 3.2 Implémenter `src/pwa/manifest.ts` ; vérifier que les tests 3.1 passent.
- [x] 3.3 Configurer `VitePWA` dans `vite.config.ts` : `registerType: 'prompt'`, `injectRegister: false`, manifeste de `src/pwa/manifest.ts`, `includeManifestIcons: false` et `workbox.globPatterns` sans le manifeste (le plugin les ajoute déjà, sinon ils sont en double), et `maximumFileSizeToCacheInBytes` à 4 Mo, `devOptions` désactivé ; ajouter `vite-plugin-pwa/client` aux `types` de `tsconfig.json`. Vérifier avec `pnpm build` que `dist/` contient `sw.js` et `manifest.webmanifest`, et que la liste de précache de `sw.js` contient `index.html`, le script et la feuille de style hachés, le manifeste et chaque icône.
- [x] 3.4 Compléter `index.html` : `theme-color`, `favicon.ico`, icône SVG, `apple-touch-icon` et `apple-mobile-web-app-title` ; vérifier avec `pnpm build` que les liens de `dist/index.html` pointent vers des fichiers présents dans `dist/`.

## 4. Mise à jour

- [x] 4.1 Écrire les tests de `src/pwa/updateState.ts` avec une fonction d'enregistrement factice : `updateReady` faux au départ, vrai après `onNeedRefresh`, inchangé après `onOfflineReady` ou `onRegisterError`, `applyUpdate()` appelle la fonction de mise à jour avec rechargement, et un état qui reste faux sans enregistrement (développement ou navigateur sans service worker).
- [x] 4.2 Implémenter `src/pwa/updateState.ts` et le brancher dans `main.ts` / `App.vue`, seulement en production et si `'serviceWorker' in navigator` ; vérifier que les tests 4.1 passent et que `pnpm dev` n'enregistre aucun service worker (onglet Application des DevTools).
- [x] 4.3 Ajouter à `HomeScreen.test.ts` : bandeau « Nouvelle version disponible » avec bouton « Recharger » affiché quand `updateReady` est vrai, absent sinon, clic qui émet `reload`.
- [x] 4.4 Ajouter la prop `updateReady` et l'événement `reload` à `HomeScreen`, relier `reload` à `applyUpdate()` dans `App.vue` ; vérifier que les tests 4.3 passent.

## 5. Vérification de bout en bout

- [x] 5.1 Avec `pnpm build` puis `pnpm preview` : première visite en ligne, puis DevTools hors ligne et rechargement ; vérifier que l'accueil s'affiche, qu'une partie contre deux IA se joue sur plusieurs tours, et qu'après fermeture et réouverture hors ligne « Reprendre la partie » fonctionne.
- [x] 5.2 Mise à jour : modifier un texte, reconstruire et relancer `pnpm preview` pendant qu'une partie est ouverte ; vérifier qu'aucun bandeau n'apparaît pendant la partie, que le bandeau apparaît au retour à l'accueil, que « Recharger » affiche la nouvelle version avec la partie toujours reprenable, puis, dans un second essai, que sans clic la nouvelle version se lance après fermeture de tous les onglets.
- [x] 5.3 Installabilité : vérifier dans l'onglet Application des DevTools que le manifeste ne signale aucune erreur, installer l'application depuis Chrome sur ordinateur et vérifier qu'elle s'ouvre dans sa propre fenêtre sans barre d'adresse.
- [x] 5.4 Lancer `pnpm lint`, `pnpm type-check`, `pnpm test` et `pnpm build` ; vérifier qu'ils passent sans erreur.

## 6. Documentation du projet

- [x] 6.1 Mettre à jour le README (fonctionnalité « jouable hors ligne et installable », ligne du change dans la feuille de route, commande `pnpm generate-pwa-assets`) et le `TODO.md` (étape de déploiement : HTTPS, `Cache-Control: no-cache` sur `sw.js`, `index.html` et `manifest.webmanifest`, test d'installation sur iPad en paysage) ; vérifier que les commandes citées existent dans `package.json`.
