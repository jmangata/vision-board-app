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
