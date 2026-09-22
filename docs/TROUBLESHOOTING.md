---

### 24. Configuration Railway initiale invalide et dépréciée

### Contexte
La première tentative de migration depuis Render utilisait `backend/railway.toml` et `frontend/railway.toml`. Le frontend était présenté comme un « Static Site » avec `publishDirectory = "dist"`, et les migrations Prisma étaient exécutées pendant le build du backend.

### Erreur constatée
Plusieurs erreurs empêchaient un nouveau déploiement Railway fiable :

- `publishDirectory` ne fait pas partie du schéma `railway.toml` officiel ;
- Railway ne possède pas le type « Static Site » de Render et nécessite un serveur HTTP pour le build Vite ;
- Config as Code (`railway.toml`) est déprécié, les nouveaux services ne peuvent plus l'activer et les fichiers existants cessent d'être lus le 1er décembre 2026 ;
- `npx prisma generate` exécuté sans dépendances locales a tenté de télécharger `prisma@8.0.0-rc.15`, incompatible avec la version 5 du projet ;
- les services Railway n'obtiennent pas automatiquement de domaine public ;
- les URLs mobiles codées en dur supposaient des domaines Railway prévisibles, alors que les domaines réels sont générés par la plateforme.

### Cause
La configuration initiale reprenait à tort des concepts propres à Render (site statique, publish directory, rewrite depuis le dashboard) et s'appuyait sur l'ancien système Config as Code sans vérifier la documentation Railway actuelle. Elle utilisait également `npx`, dont le repli vers le registre npm n'était pas maîtrisé.

### Solution
- Fichiers supprimés : `backend/railway.toml`, `frontend/railway.toml`, `.github/workflows/cd-railway.yml`.
- Fichiers ajoutés : `.railway/railway.ts`, `frontend/Dockerfile`, `frontend/Caddyfile`, `frontend/.dockerignore`, `scripts/railway-bootstrap.mjs`, `scripts/railway-secrets.mjs`, `scripts/railway-verify.mjs`, `package.json`, `package-lock.json`, `mobile/.env.example`.
- Fichiers modifiés : `backend/package.json`, `.github/workflows/ci.yml`, `mobile/src/screens/LoginScreen.js`, `mobile/src/screens/ProfileScreen.js`, `docs/RAILWAY.md`, `docs/TROUBLESHOOTING.md`, `docs/CHANGELOG.md`.
- Migration vers Railway Infrastructure as Code, système officiellement supporté : PostgreSQL, API et frontend sont décrits dans un fichier projet unique.
- Frontend servi par un conteneur Caddy multi-stage avec fallback SPA et healthcheck.
- Migrations déplacées en pre-deploy, lorsque `DATABASE_URL` et le réseau privé sont disponibles.
- Remplacement de `npx prisma` par des scripts `npm run`, qui résolvent la version du lockfile.
- Activation de Wait for CI (`checkSuites`) au lieu d'un workflow de déploiement concurrent.
- Scripts Node multiplateformes pour créer les domaines, envoyer les secrets par stdin et vérifier le déploiement.

### Vérification
- Build Docker frontend : réussi avec `npm ci`, Vite 6.4.3 et Caddy 2.
- Conteneur local : `/`, `/health` et `/goals/123` renvoient 200 ; l'asset JS renvoie `text/javascript`, pas `index.html`.
- Le bundle Vite contient bien la valeur de test `VITE_API_URL` et ne contient plus le fallback `localhost:5000`.
- Backend : `npm run prisma:generate` utilise Prisma 5.22.0 du lockfile.
- Tests backend : 3 fichiers et 21 tests passent.
- `npm audit` à la racine : 0 vulnérabilité. La CLI npm vulnérable a été remplacée par le binaire officiel Railway 5.57.0, dont le SHA-256 est vérifié avant installation locale dans `.tools/`.
- `npm run railway:secrets -- --dry-run` détecte 11 secrets sans afficher leurs valeurs.
- Les trois scripts `.mjs` passent `node --check`.
- `npm run railway:bootstrap` s'arrête proprement avec l'instruction `npm run railway:login` tant que l'utilisateur n'est pas authentifié.

### Points de vigilance
- L'application réelle ne peut pas être provisionnée sans authentification au compte Railway. Après `npm run railway:login`, exécuter `npm run railway:bootstrap`, confirmer le plan puis `npm run railway:verify`.
- `VITE_API_URL` est injecté au build : tout changement de domaine API exige un redeploy du frontend.
- Les fichiers `.env` restent hors Git. Le script n'envoie qu'une liste blanche de secrets et exclut explicitement le `DATABASE_URL` local.
- Omettre une ressource de `.railway/railway.ts` peut la supprimer lors du prochain `config apply` : toujours relire le plan.

---

### 23. Session mobile conservée après un refus JWT 401

### Contexte
Au démarrage dans Expo Go, Board restaurait le JWT présent dans AsyncStorage puis appelait `GET /api/goals`.

### Erreur constatée
La console affichait `Erreur lors du chargement des objectifs [AxiosError: Request failed with status code 401]` et l’application restait sur l’espace authentifié. Le comportement attendu est de supprimer la session refusée et de revenir à la connexion.

### Cause
Le backend a rejeté le JWT restauré. Un token peut être expiré, signé avec un ancien `JWT_SECRET`, associé à un compte supprimé ou autrement invalide. Le client Axios injectait bien ce token, mais ne traitait que les requêtes sortantes : aucun intercepteur de réponse ne supprimait une session refusée.

### Solution
- Fichiers concernés : `mobile/src/services/api.js`, `mobile/src/context/AuthContext.js`, `mobile/src/screens/BoardScreen.js`, `docs/TROUBLESHOOTING.md`.
- Ajout d’un intercepteur Axios qui traite uniquement les réponses 401 provenant d’une requête ayant envoyé un header `Authorization`.
- Suppression du token AsyncStorage et notification du contexte d’authentification, qui remonte automatiquement l’écran de connexion.
- Le formulaire de connexion n’est pas concerné par cette déconnexion globale, car ses requêtes ne portent pas encore de token Bearer.
- Board ne journalise plus comme erreur de chargement un 401 déjà pris en charge globalement.

### Vérification
- Relancer depuis `mobile` avec `npx expo start`, puis présenter un token expiré ou invalide : l’application doit revenir à la connexion.
- Se reconnecter et vérifier que `GET /api/goals` répond 200 et que les objectifs s’affichent.
- Exécuter `npx expo export --platform android --output-dir dist-check`.

### Points de vigilance
- Lancer Expo depuis `mobile`, pas depuis la racine du monorepo où le package `expo` n’est pas installé.
- Un changement de `JWT_SECRET` invalide toutes les sessions existantes ; les utilisateurs devront se reconnecter.
- Le warning Expo Go sur le push distant est indépendant de l’authentification et non bloquant pour les notifications locales.

---

### 22. Expo Doctor signale trois écarts de patch SDK 57

### Contexte
Après la finalisation des écrans mobiles, la vérification `npx expo-doctor` a été exécutée en complément de l’export Android obligatoire.

### Erreur constatée
`20/21 checks passed` avec des versions attendues `expo ~57.0.24`, `expo-image-picker ~57.0.19` et `expo-notifications ~57.0.20`, alors que le projet utilise respectivement `57.0.22`, `57.0.17` et `57.0.18`.

### Cause
De nouvelles révisions patch compatibles avec le SDK 57 sont proposées par le registre depuis la dernière stabilisation du manifeste mobile.

### Solution
- Fichiers concernés : `docs/TROUBLESHOOTING.md`.
- Aucune mise à niveau automatique n’a été appliquée : la mission interdit une mise à jour Expo sans nécessité démontrée et l’export Android fonctionne avec les versions verrouillées actuelles.
- Conserver ce diagnostic pour décider séparément d’une montée de patch via `npx expo install` après recette.

### Vérification
`npx expo export --platform android --output-dir dist-check` termine avec succès et génère le bundle Android malgré cet avertissement de versions patch.

### Points de vigilance
Ne pas utiliser `npm update` ni `npm audit fix --force`. Si les patchs sont adoptés ultérieurement, exécuter `npx expo install expo expo-image-picker expo-notifications`, puis refaire Expo Doctor, l’export Android et la recette des notifications locales.

---

### 21. React Navigation refuse le composant Dashboard

### Contexte
Après une inscription réussie, React Navigation tentait de monter les quatre onglets de l’espace authentifié.

### Erreur constatée
```text
Got an invalid value for 'component' prop for the screen 'Dashboard'. It must be a valid React Component.
```

### Cause
`DashboardScreen.js`, `BadgesScreen.js` et `ProfileScreen.js` étaient des fichiers vides. Leurs imports retournaient donc une valeur invalide au navigateur.

### Solution
Ajouter un composant React Native exporté par défaut dans chacun des trois fichiers. Des écrans transitoires documentés sont utilisés jusqu’à leur harmonisation fonctionnelle complète.

### Vérification
`npx expo export --platform ios --output-dir dist-check` génère désormais le bundle iOS sans erreur de composant React Navigation.

### Points de vigilance
Un écran référencé par la propriété `component` d’un `Stack.Screen` ou d’un `Tab.Screen` doit toujours exporter un composant React valide, même avant son implémentation finale.

---

### 20. Inscription Expo bloquée sur le chargement

### Contexte
Le formulaire d’inscription mobile restait en chargement lorsqu’Expo Go ne parvenait pas à joindre le backend local.

### Erreur constatée
Aucune réponse ni erreur visible n’apparaissait rapidement après la soumission.

### Cause
Le client Axios n’avait pas de délai maximal et utilisait une ancienne adresse IP locale ne correspondant plus à celle annoncée par Metro.

### Solution
- Configurer l’API avec `EXPO_PUBLIC_API_URL` ou utiliser l’adresse locale de secours actuelle.
- Ajouter un délai Axios de 10 secondes.
- Afficher un message dédié lorsque le serveur est inaccessible ou que le délai est dépassé.

Exemple PowerShell avant `npm start` :
```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.15:5000/api"
```

### Vérification
Lancer le backend sur le port 5000, démarrer Expo sur le même réseau Wi-Fi puis vérifier `http://ADRESSE_IP:5000/api/health` depuis le navigateur du téléphone.

### Points de vigilance
L’adresse IP locale peut changer après une reconnexion Wi-Fi. Une variable `EXPO_PUBLIC_*` est intégrée au bundle client et ne doit jamais contenir de secret.

---

### 19. Dépendances requises par Expo SDK 57

### Contexte
Après l’installation du dossier `mobile`, `expo-doctor` a été exécuté avant l’harmonisation des écrans avec le responsive web.

### Erreur constatée
Expo signalait l’absence des dépendances directes `react` et `react-native`, une régression Hermes sur une ancienne révision d’Expo et des versions incompatibles d’Expo Notifications et AsyncStorage.

### Cause
Le manifeste mobile ne déclarait pas les pairs React obligatoires et utilisait plusieurs versions ne correspondant pas à celles attendues par Expo SDK 57.

### Solution
Exécuter les installations via `npx expo install` afin d’utiliser les versions compatibles du SDK, notamment `react`, `react-native`, Expo, Expo Notifications et AsyncStorage.

### Vérification
- `npx expo-doctor` doit afficher `21/21 checks passed`.
- `npx expo export --platform android` doit terminer la génération du bundle sans erreur Metro.

### Points de vigilance
Ne pas appliquer `npm audit fix --force` automatiquement : cette commande peut installer des versions majeures incompatibles avec le SDK Expo courant.

---

### 18. Configuration locale des variables d'environnement

### Contexte
Le lancement local du backend et du frontend nécessitait une configuration manuelle de PostgreSQL et de l'URL d'API.

### Erreur constatée
Le frontend Vite ne démarrait pas lorsque ses dépendances locales étaient incomplètes (`ERR_MODULE_NOT_FOUND` sur un fichier interne de Vite). Le backend devait également charger `.env` avant l'évaluation des modules utilisant les variables d'environnement.

### Cause
Le fichier `.env` local était absent et les scripts backend lançaient Node sans l'option `--env-file`.

### Solution
- Ajouter `backend/.env` avec la connexion PostgreSQL locale, le JWT et des valeurs de développement pour les intégrations externes.
- Ajouter `frontend/.env` avec `VITE_API_URL=http://localhost:5000/api`.
- Modifier les scripts `start` et `dev` du backend pour charger `.env` avec Node.
- Réinstaller les dépendances frontend avec `npm ci` afin de restaurer l'installation Vite.

### Vérification
- `docker compose up -d postgres`
- `npx prisma generate`
- `npx prisma db push`
- `npm run dev` dans `backend` puis `frontend`
- `GET http://localhost:5000/api/health` retourne `{"status":"ok"}` et Vite répond sur le port `5173`.

### Points de vigilance
Les fichiers `.env` sont ignorés par Git. Remplacer les valeurs `local-placeholder` par de vraies clés pour activer Unsplash, Groq et Cloudinary. Ne jamais publier de clés d'API dans le dépôt.
# Troubleshooting — Backend Vision Board

## 1. `SyntaxError: Named export 'PrismaClient' not found`

### Contexte
```
file:///.../backend/src/prisma.js:3
import { PrismaClient } from '@prisma/client';
         ^^^^^^^^^^^^
SyntaxError: Named export 'PrismaClient' not found. The requested module '@prisma/client' is a CommonJS module...
```

### Cause
Le `backend/package.json` déclare `"type": "module"` (ESM). Le client généré par Prisma (`@prisma/client`) est un module **CommonJS**. Node ne peut pas faire d'interop automatique pour les imports nommés (`import { X } from ...`) sur un module CommonJS dans ce contexte.

### Solution
Importer le module par défaut, puis destructurer :

```js
// ❌ Ne fonctionne pas en ESM strict
import { PrismaClient } from '@prisma/client';

// ✅ Fonctionne
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
```

Fichiers corrigés :
- `backend/src/prisma.js`
- `backend/prisma/seed.js`

---

## 2. `Error: Cannot find module '.prisma/client/default'`

### Contexte
```
Error: Cannot find module '.prisma/client/default'
Require stack:
- .../node_modules/@prisma/client/default.js
```

### Cause
Le client Prisma n'a jamais été généré (ou généré avec une version incompatible) pour le schéma courant. `node_modules/@prisma/client` seul ne suffit pas : il faut aussi le dossier `node_modules/.prisma/client` généré à partir de `prisma/schema.prisma`.

Cause secondaire rencontrée : version de `prisma`/`@prisma/client` installée (7.8.0) incompatible avec le schéma écrit pour Prisma 5.x (`url = env("DATABASE_URL")` dans le bloc `datasource`, syntaxe supprimée en v7).

### Solution
1. Vérifier que `package.json` fixe une version cohérente :
   ```json
   "dependencies": { "@prisma/client": "^5.16.0" },
   "devDependencies": { "prisma": "^5.16.0" }
   ```
2. Réinstaller proprement si un décalage de version est détecté :
   ```bash
   rm -r node_modules package-lock.json   # ou Remove-Item sous PowerShell
   npm install
   ```
3. Générer le client Prisma :
   ```bash
   npx prisma generate
   ```

---

## 3. `Error: @prisma/client did not initialize yet`

### Contexte
```
Error: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
```

### Cause
Conséquence directe du point 2 : le code essaie d'instancier `new PrismaClient()` avant que `prisma generate` ait produit un client valide pour la bonne version.

### Solution
Identique au point 2 : réinstaller les dépendances avec la bonne version, puis relancer `npx prisma generate` avant `npm run dev`.

---

## 4. `Error: listen EADDRINUSE: address already in use :::5000`

### Contexte
```
Error: listen EADDRINUSE: address already in use :::5000
```

### Cause
Un process Node (souvent une instance précédente de `npm run dev` / `nodemon`) tourne déjà et occupe le port 5000.

### Solution
- **Windows (PowerShell)** :
  ```powershell
  Get-Process -Name node | Stop-Process -Force
  ```
- Ou trouver le PID précis puis le tuer :
  ```powershell
  netstat -ano | findstr :5000
  taskkill /PID <pid> /F
  ```
- Alternative : changer le `PORT` dans `backend/.env` si plusieurs instances doivent tourner en parallèle.

---

## Checklist de démarrage backend

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Si le port 5000 est occupé, libérer le port (voir point 4) avant de relancer.

---

## 5. Frontend — `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin`

### Contexte
```
[plugin:vite:css] [postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS
you'll need to install `@tailwindcss/postcss`...
```

### Cause
Même schéma que le point 2 (Prisma) : `frontend/package.json` fixe `"tailwindcss": "^3.4.4"`, mais `node_modules` contenait **Tailwind v4** (décalage entre lockfile/installation réelle et le `package.json`). Tailwind v4 a changé son intégration PostCSS (plugin déplacé vers `@tailwindcss/postcss`), ce qui casse `postcss.config.js` écrit pour la v3 (`tailwindcss: {}` directement en plugin).

### Solution
Réinstaller proprement pour forcer la résolution de la version déclarée dans `package.json` :
```bash
cd frontend
rm -r node_modules package-lock.json   # ou Remove-Item sous PowerShell
npm install
npm list tailwindcss   # doit afficher 3.x, pas 4.x
```
`postcss.config.js` reste inchangé (`tailwindcss: {}` fonctionne bien en v3).

### Checklist de démarrage frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Frontend — Erreurs 401 (Unauthorized) sur toutes les routes protégées

### Contexte
Dans la console navigateur, plusieurs requêtes échouent avec `401 (Unauthorized)` en même temps, sur des routes différentes :
```
Failed to load resource: the server responded with a status of 401
  :5000/api/unsplash/search?query=...
  :5000/api/groq/suggestions
  :5000/api/badges/me
  :5000/api/dashboard
  :5000/api/goals
  :5000/api/users/me
```
Cela ressemble à un problème de dépendances, mais n'en est pas un.

### Cause
Ces routes sont toutes protégées par `backend/src/middlewares/authMiddleware.js`, qui vérifie le token JWT envoyé par le frontend (`frontend/src/services/api.js`) via `jwt.verify(token, process.env.JWT_SECRET)`.

Le token stocké dans `localStorage` avait été **généré par une session backend antérieure**, alors que le fichier `.env` du backend a été recréé/déplacé entre-temps (voir points précédents : le `backend/.env` était quasiment vide avant d'être remplacé par le `.env` complet déplacé depuis la racine). Si le `JWT_SECRET` utilisé pour signer le token diffère de celui utilisé pour le vérifier, `jwt.verify` échoue systématiquement → 401 sur toutes les routes authentifiées, même si l'utilisateur "semble" connecté côté frontend (le token est présent mais invalide).

### Solution
Se déconnecter puis se reconnecter (nouveau `login`) pour régénérer un token signé avec le `JWT_SECRET` actuellement chargé par le backend :
```js
// frontend/src/pages/Login.jsx
localStorage.setItem('token', data.token); // nouveau token valide
```

### Point de vigilance
Après toute modification du fichier `.env` (valeur de `JWT_SECRET` changée, fichier déplacé/recréé, ou backend redémarré avec un `.env` différent), **tous les tokens JWT existants deviennent invalides**. Il faut se reconnecter pour en obtenir un nouveau.

---

## 7. API Groq — `500` sur `/api/groq/suggestions` : `model_not_found`

### Contexte
La route `POST /api/groq/suggestions` (protégée, appelée depuis `CreateGoal.jsx` via `suggestSteps`) renvoie une erreur 500 côté frontend. Le code semblait pourtant correctement implémenté (clé API présente, routes bien câblées, middleware d'auth OK).

En testant directement l'appel à l'API Groq :
```json
{"error":{"message":"The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}}
```

### Cause
Le modèle `llama-3.3-70b-versatile` utilisé dans `backend/src/services/groqService.js` a été **retiré du catalogue Groq** (dépréciation côté fournisseur, indépendante du code de l'application). La clé API (`GROQ_API_KEY`) était valide, mais le modèle demandé n'existe plus pour ce compte.

### Diagnostic
Lister les modèles disponibles pour la clé API :
```bash
curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
```

### Solution
Remplacer le modèle par un modèle actuellement disponible sur Groq (ex. `openai/gpt-oss-20b`, qui supporte `response_format: json_object`) :
```js
// backend/src/services/groqService.js
body: JSON.stringify({
  model: 'openai/gpt-oss-20b', // anciennement 'llama-3.3-70b-versatile' (déprécié)
  ...
})
```

### Point de vigilance
Les fournisseurs d'IA (Groq, OpenAI, etc.) déprécient et retirent régulièrement des modèles. Si une intégration IA se met à échouer sans changement de code applicatif, toujours vérifier en premier la liste des modèles disponibles via l'API du fournisseur avant de chercher un bug côté code.

---

## Problèmes identifiés lors de l'analyse globale du code (2026-08-24)

Les points ci-dessous n'ont pas encore été corrigés ; ils sont documentés ici pour être traités ultérieurement.

### 8. `backend/src/middlewares/errorMiddleware.js` vide et non branché

**Erreur** : Le middleware de gestion d'erreurs centralisée existe (`backend/src/middlewares/errorMiddleware.js`) mais est vide et n'est pas importé dans `backend/index.js`.

**Cause** : Le fichier a été créé sans implémentation et son appel a été omis.

**Impact** : Toutes les erreurs inattendues (erreurs Prisma non catchées, `TypeError`, etc.) ne sont pas capturées et peuvent faire planter le process ou fuir des stacks sensibles.

**Solution préconisée** :
- Remplir `errorMiddleware.js` avec un middleware Express à quatre arguments `(err, req, res, next)`.
- Logger l'erreur côté serveur sans exposer de détails sensibles en production.
- Importer et monter le middleware à la fin de `backend/index.js` après toutes les routes.

---

### 9. Le statut d'un objectif ne repasse pas à `active` quand une étape est décochée

**Erreur** : Si toutes les étapes d'un objectif sont cochées, le statut passe à `completed`. En décochant ensuite une étape, le statut reste `completed`.

**Cause** : Dans `backend/src/controllers/stepController.js` (`toggle`), la mise à jour du statut du `goal` n'est effectuée que dans le cas `if (updated.isCompleted)`.

**Impact** : Données incohérentes : un objectif peut apparaître comme terminé alors qu'une de ses étapes ne l'est plus.

**Solution préconisée** :
- Après chaque toggle, recalculer si toutes les étapes sont terminées.
- Si toutes sont terminées → `status: 'completed'`.
- Sinon → `status: 'active'`.

---

### 10. Le badge `streak_7` n'est jamais attribué

**Erreur** : Le badge de streak 7 jours (`streak_7`) est documenté dans `docs/conception.md` mais n'est pas vérifié dans `backend/src/services/badgeService.js`.

**Cause** : La logique de streak n'a pas été implémentée ; le modèle `User` ne stocke pas non plus de date de dernière connexion ni de streak.

**Impact** : Les utilisateurs ne peuvent jamais débloquer ce badge.

**Solution préconisée** :
- Ajouter les champs nécessaires au schéma Prisma (`lastLoginAt`, `streakDays`, etc.).
- Mettre à jour ces champs lors du login.
- Ajouter `awardBadge('streak_7')` dans `checkBadges` quand `streakDays >= 7`.

---

### 11. Routes dupliquées pour les suggestions Groq

**Erreur** : Deux endpoints différents (`POST /api/groq/suggestions` et `POST /api/suggestions/steps`) appellent la même fonction `suggestSteps`.

**Cause** : Un router a été laissé en place après la création de l'autre.

**Impact** : Maintenance double et risque de divergence. Le frontend n'utilise qu'un seul endpoint (`/groq/suggestions`), l'autre est mort.

**Solution préconisée** :
- Supprimer `backend/src/routes/suggestionRoutes.js` et son montage dans `backend/index.js`.
- Ou fusionner les deux routes et ne garder qu'un seul endpoint documenté.

---

### 12. Fichiers vides dans le projet mobile

**Erreur** : De nombreux fichiers du dossier `mobile/` sont entièrement vides :
- écrans : `BoardScreen.js`, `GoalDetailScreen.js`, `CreateGoalScreen.js`, `DashboardScreen.js`, `BadgesScreen.js`, `ProfileScreen.js`
- composants : `GoalCard.js`, `BadgeCard.js`
- services : `goalService.js`, `notificationService.js`

**Cause** : Le projet mobile a été scaffoldé sans implémentation des écrans et services.

**Impact** : L'application mobile ne compile pas / ne fonctionne pas (imports vides, routes sans composants).

**Solution préconisée** :
- Implémenter chaque écran et service en s'inspirant du frontend web.
- Vérifier que `mobile/package.json` déclare bien `react` et `react-native` (actuellement absents).

---

### 13. Composant `BadgeCard.jsx` vide côté frontend web

**Erreur** : `frontend/src/components/BadgeCard.jsx` est vide.

**Cause** : Le composant a été créé mais jamais implémenté ; la page `Badges.jsx` gère l'affichage directement.

**Impact** : Code mort / fichier inutile qui prête à confusion.

**Solution préconisée** :
- Soit supprimer le fichier s'il n'est pas utilisé, soit en extraire le rendu du badge depuis `Badges.jsx`.

---

### 14. Casse incohérente du point d'entrée React

**Erreur** : Le fichier s'appelle `frontend/src/Main.jsx` (M majuscule) alors que `frontend/index.html` charge `/src/main.jsx` (m minuscule).

**Cause** : Renommage partiel lors d'une correction précédente.

**Impact** : Sur Windows le système de fichiers est insensible à la casse, donc le build fonctionne, mais cela peut casser sur Linux/macOS ou dans certains environnements CI.

**Solution préconisée** :
- Renommer `frontend/src/Main.jsx` en `frontend/src/main.jsx` (et ajuster l'import CSS si nécessaire).

---

### 15. Gestion d'erreur absente sur certaines actions frontend

**Erreur** : Dans `frontend/src/pages/GoalDetail.jsx`, les fonctions `handleAddStep`, `handleToggle` et `handleDelete` ne gèrent pas les erreurs.

**Cause** : Les appels API sont faits sans `try/catch`.

**Impact** : En cas d'erreur réseau ou serveur, l'utilisateur ne reçoit aucun retour et l'état local peut rester figé.

**Solution préconisée** :
- Ajouter des blocs `try/catch` autour des appels API.
- Afficher un message d'erreur à l'utilisateur et/ou dans la console.

---

### 16. Création de catégorie personnalisée non protégée contre les doublons

**Erreur** : Dans `frontend/src/pages/CreateGoal.jsx`, lorsque l'utilisateur choisit "Autre" et saisit un nom, le frontend tente de créer une catégorie sans vérifier si le nom existe déjà.

**Cause** : Le champ `name` de `Category` est marqué `@unique` dans Prisma ; une tentative de création avec un nom existant lève une erreur Prisma `P2002`.

**Impact** : Erreur 500 côté backend si la catégorie existe déjà.

**Solution préconisée** :
- Vérifier l'existence du nom avant la création (`GET /api/categories`).
- Ou gérer proprement l'erreur `P2002` côté backend avec un retour 409.

---

### 17. Dépendances au mauvais niveau dans `package.json` racine

**Erreur** : Le `package.json` à la racine du monorepo contient des dépendances de production (`express`, `prisma`, `react-native-*`, etc.) qui devraient être dans `backend/package.json`, `frontend/package.json` ou `mobile/package.json`.

**Cause** : Installation initiale sans séparer les workspaces.

**Impact** : Installation confuse, risque de conflits de versions, et `node_modules` à la racine inutile.

**Solution préconisée** :
- Nettoyer le `package.json` racine pour ne garder que des scripts globaux éventuels.
- Supprimer `node_modules` à la racine et réinstaller dans chaque sous-dossier.

---

## 19. Frontend — `npm run dev` : `ERR_MODULE_NOT_FOUND` sur un chunk interne de Vite

### Contexte
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'C:\developpement\vision-board-app\frontend\node_modules\vite\dist\node\chunks\dep-BK3b2jBa.js'
    at finalizeResolution (node:internal/modules/esm/resolve:274:11)
    ...
```

### Cause
Installation `node_modules` du frontend corrompue/incomplète : le dossier `node_modules/vite` ne contenait pas tous les fichiers attendus par la version verrouillée dans `frontend/package-lock.json` (`vite@5.4.21`). Le fichier chunk interne référencé n'existait tout simplement pas sur le disque, alors que le `package.json`/lockfile étaient cohérents.

### Solution
Réinstaller proprement les dépendances du frontend :
```bash
cd frontend
rm -r node_modules, package-lock.json   # ou Remove-Item -Recurse -Force sous PowerShell
npm install
npm run dev
```

### Point de vigilance
Comme pour les points 2 et 5, une erreur `ERR_MODULE_NOT_FOUND`/`Cannot find module` pointant vers un fichier interne d'un package (chunk, `.prisma/client`, etc.) est généralement le signe d'une installation `node_modules` incomplète ou corrompue, pas d'un bug de code. Réflexe : supprimer `node_modules` + lockfile puis `npm install` avant de chercher plus loin.

---

## 20. APIs protégées — réponses `401 Unauthorized` après un changement de configuration

### Contexte
Depuis le formulaire de création, l'upload d'image, la recherche Unsplash, les suggestions Groq et la création d'objectif retournaient tous `401 Unauthorized`.

### Erreur constatée
Les requêtes `POST /api/upload/image`, `POST /api/groq/suggestions`, `POST /api/goals` et `GET /api/unsplash/search` échouaient avec le statut HTTP `401`. Le formulaire restait néanmoins accessible et continuait d'envoyer le même token invalide.

### Cause
Un JWT ancien était encore présent dans `localStorage`. Après expiration du token ou modification de `JWT_SECRET`, sa signature n'est plus acceptée par `authMiddleware`. Le frontend injectait correctement ce token, mais ne supprimait pas la session après une réponse `401`.

### Solution
- Fichier modifié : `frontend/src/services/api.js`.
- Ajout d'un intercepteur Axios de réponse qui détecte les `401` hors endpoints de connexion.
- Suppression automatique du token invalide et redirection vers `/login` afin d'obtenir un nouveau JWT.
- Les erreurs `401` de `/auth/login` et `/auth/register` restent affichées normalement sans boucle de redirection.

### Vérification
1. Placer un token invalide dans `localStorage`, puis appeler une route protégée.
2. Vérifier que le token est supprimé et que l'application redirige vers `/login`.
3. Se reconnecter, puis tester Unsplash, Groq, l'upload et la création d'un objectif.
4. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- Après une modification de `JWT_SECRET`, tous les tokens émis précédemment deviennent invalides et les utilisateurs doivent se reconnecter.
- Le backend doit être lancé depuis `backend/` afin que son fichier `.env` soit chargé.

---

## 21. Inscription — erreur `500 Internal Server Error` après l'ajout du streak

### Contexte
Après la reconnexion imposée par l'invalidation du JWT, `POST /api/auth/register` retournait systématiquement une erreur `500`.

### Erreur constatée
Le contrôleur d'inscription tentait de créer l'utilisateur avec `lastLoginAt` et `streakDays`, mais Prisma signalait `Unknown field lastLoginAt` et la migration correspondante était indiquée comme non appliquée.

### Cause
La migration `20260824162729_add_streak_fields` existait dans le dépôt mais n'avait pas été appliquée à la base locale. Le client Prisma présent dans `node_modules` avait également été généré avant l'ajout de ces champs.

### Solution
- Application de la migration additive avec `npx prisma migrate deploy`.
- Régénération du client avec `npx prisma generate`.
- Redémarrage du backend afin de libérer puis recharger le moteur Prisma sous Windows.
- Aucune ligne utilisateur existante n'a été supprimée ; les nouvelles colonnes sont ajoutées avec des valeurs compatibles.

### Vérification
1. Exécuter `npx prisma migrate status` dans `backend/` et vérifier que le schéma est à jour.
2. Lire `lastLoginAt` et `streakDays` via Prisma sans erreur de champ inconnu.
3. Créer un compte depuis `/register` et vérifier une réponse HTTP `201`.
4. Vérifier que le backend redémarre sur le port `5000`.

### Points de vigilance
- Sous Windows, arrêter le backend avant `npx prisma generate` si `query_engine-windows.dll.node` est verrouillé avec une erreur `EPERM`.
- Après chaque modification de `schema.prisma`, appliquer les migrations puis régénérer le client avant de relancer le serveur.

---

## Secrets exposés dans l'historique Git

### Contexte
Audit de sécurité avant déploiement : le fichier `backend/.env` est bien ignoré
par `.gitignore`, mais il avait été commité dans le premier commit (`5116dc4c`)
avant l'ajout du `.gitignore`.

### Erreur constatée
`git show 5116dc4c:backend/.env` affiche les secrets en clair (JWT_SECRET,
DATABASE_URL, clés Cloudinary, Unsplash, SMTP, Groq). Le dépôt étant hébergé
sur GitHub, tout clone permet de récupérer ces valeurs.

### Cause
Le `.env` a été créé et commité avant que le `.gitignore` ne l'exclue. Le commit
`ee2b0bbf` l'a ensuite retiré du suivi, mais l'historique conserve le contenu.

### Solution
- **Rotation de tous les secrets** : nouveau JWT_SECRET, régénération des clés
  Cloudinary / Groq / Unsplash / SMTP, mise à jour du `.env` local et des
  variables d'environnement Render.
- Création de `backend/.env.example` documentant chaque variable sans valeur.
- Option non retenue : réécriture de l'historique (`git filter-repo` /
  BFG + force-push) — la rotation reste nécessaire si le dépôt a été public,
  et la réécriture casse les clones existants.

### Vérification
- `git show 5116dc4c:backend/.env` affiche toujours les anciennes valeurs,
  mais elles sont désormais révoquées et inutilisables.
- `git status` ne liste plus `backend/.env` (ignoré).

### Points de vigilance
- Toute clé ayant été commitée doit être considérée comme compromise, même
  après suppression du fichier.
- En cas de régénération du JWT_SECRET, tous les tokens en cours sont
  invalidés : les utilisateurs devront se reconnecter.

---

## EADDRINUSE : port 5000 déjà occupé

### Contexte
Démarrage du backend en développement avec `npm run dev` (nodemon).

### Erreur constatée
```
Error: listen EADDRINUSE: address already in use :::5000
    at Server.listen (node:net:...)
[nodemon] app crashed - waiting for file changes before starting...
```

### Cause
Un processus `node.exe` d'une exécution précédente du serveur (lancé en
arrière-plan pour un test de `/api/health`) était resté actif et conservait
le port 5000. Nodemon ne peut pas démarrer tant que le port n'est pas libéré.

### Solution
Identifier puis terminer le processus qui écoute sur le port :

```bash
netstat -ano | findstr :5000 | findstr LISTENING   # récupère le PID
tasklist //FI "PID eq <pid>"                        # vérifie le processus (Git Bash : //FI)
taskkill //PID <pid> //F                            # le termine (Git Bash : //PID et //F)
```

En PowerShell (pas de double slash nécessaire) :

```powershell
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

### Vérification
`netstat -ano | findstr :5000 | findstr LISTENING` ne retourne rien, puis
`npm run dev` démarre normalement (`Server running on port 5000`).

### Points de vigilance
- Sous Git Bash, les options Windows (`/FI`, `/PID`, `/F`) doivent être écrites
  avec un double slash (`//FI`) pour éviter la conversion en chemin MSYS.
- Un serveur lancé en arrière-plan pour un test doit toujours être terminé
  explicitement (kill du PID ou du shell qui l'héberge).

---

## Unknown argument `resetToken` après ajout d'un champ Prisma

### Contexte
Test du parcours « Mot de passe oublié » sur le frontend web : la requête
`POST /api/auth/forgot-password` échoue côté backend après l'ajout des champs
`resetToken` / `resetTokenExpiry` au schéma Prisma.

### Erreur constatée
```
Invalid `prisma.user.update()` invocation.
Unknown argument `resetToken`. Available options are marked with ?.
```

### Cause
Double problème :
1. Le **client Prisma généré** (`node_modules/.prisma/client`) datait d'avant
   l'ajout des champs : il ne connaissait pas `resetToken`.
2. La **migration SQL** `add_password_reset` n'avait pas encore été appliquée
   à la base locale.
3. Bonus : `npx prisma generate` échouait avec `EPERM: rename ...query_engine
   -windows.dll.node` car le serveur nodemon tournait et verrouillait la DLL.
   Une tentative dans `frontend/` installait `prisma@8.0.0-rc` via npx (le
   package n'existe que dans `backend/`).

### Solution
1. Arrêter le serveur de dev (le processus node qui écoute sur :5000).
2. `cd backend && npx prisma generate` — régénère le client avec les nouveaux champs.
3. `npx prisma migrate deploy` — applique `20260919193000_add_password_reset`.
4. Relancer `npm run dev` et retester le parcours.

### Vérification
```bash
node -e "import('@prisma/client').then(m=>new m.PrismaClient().user
  .findFirst({select:{resetToken:true}}))"  # → pas d'erreur = champ connu
```
Le formulaire « Mot de passe oublié » répond alors 200 et l'email part via Mailjet.

### Points de vigilance
- **Toujours exécuter `prisma generate` et `migrate deploy` après avoir modifié
  `schema.prisma`**, et depuis le dossier `backend/` (Prisma n'est pas installé
  à la racine ni dans `frontend/`).
- Arrêter nodemon avant `prisma generate` sous Windows : la DLL du query engine
  est verrouillée par le processus en cours (erreur `EPERM`).
- En production aucune action n'est requise : `buildCommand` de `render.yaml`
  exécute déjà `prisma generate && prisma migrate deploy`.
