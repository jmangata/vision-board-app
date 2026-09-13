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
