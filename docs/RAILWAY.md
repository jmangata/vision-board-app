# Déploiement rapide sur Railway

Ce guide permet de déployer l’application Vision Board sur [Railway](https://railway.app) en quelques minutes. Il est utile si Render pose problème ou si tu cherches une alternative simple pour un projet Node.js + React + PostgreSQL.

## Stack déployée

| Composant | Type Railway | Dossier source |
|---|---|---|
| Backend API | Service Node.js | `backend/` |
| Base de données | PostgreSQL Railway | – |
| Frontend web | Static Site | `frontend/` |

L’application mobile Expo reste hors scope web : elle est compilée et installée sur le téléphone.

## Prérequis

- Un compte [Railway](https://railway.app).
- Le dépôt GitHub `jmangata/vision-board-app` connecté à Railway.
- Les secrets applicatifs suivants :
  - `JWT_SECRET` (chaîne aléatoire longue)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `UNSPLASH_ACCESS_KEY`
  - `GROQ_API_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `MAIL_FROM`

## 1. Créer le projet Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi.
2. Clique sur **New Project**.
3. Sélectionne **Deploy from GitHub repo**.
4. Choisis `jmangata/vision-board-app`.

## 2. Ajouter PostgreSQL

1. Dans le projet Railway, clique sur **New**.
2. Sélectionne **Database** puis **Add PostgreSQL**.
3. Attends que la base soit provisionnée.
4. Ouvre la base → onglet **Variables**.
5. Copie la valeur de `DATABASE_URL`.

## 3. Déployer le backend

1. Clique sur **New > GitHub Repo** et sélectionne à nouveau le repo.
2. Configure le service :
   - **Name** : `visionboard-api`
   - **Root Directory** : `backend`
   - **Start Command** : laisse vide (détecté via `railway.toml`)
3. Dans l’onglet **Variables**, ajoute :
   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | URL interne PostgreSQL copiée à l’étape 2 |
   | `JWT_SECRET` | Ta clé secrète JWT |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLOUDINARY_CLOUD_NAME` | Ton secret Cloudinary |
   | `CLOUDINARY_API_KEY` | Ton secret Cloudinary |
   | `CLOUDINARY_API_SECRET` | Ton secret Cloudinary |
   | `UNSPLASH_ACCESS_KEY` | Ta clé Unsplash |
   | `GROQ_API_KEY` | Ta clé Groq |
   | `SMTP_HOST` | Ton serveur SMTP |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | Ton utilisateur SMTP |
   | `SMTP_PASS` | Ton mot de passe SMTP |
   | `MAIL_FROM` | Ton adresse d’expédition |
   | `ALLOWED_ORIGINS` | URL du frontend (voir étape 5) |
   | `FRONTEND_URL` | Même URL que `ALLOWED_ORIGINS` |
4. Clique sur **Deploy**.
5. Attends la fin du build, puis vérifie l’URL publique avec `/api/health`.

## 4. Déployer le frontend

1. Clique sur **New > Static Site**.
2. Sélectionne le repo `jmangata/vision-board-app`.
3. Configure :
   - **Name** : `visionboard-frontend`
   - **Root Directory** : `frontend`
   - **Build Command** : `npm ci && npm run build`
   - **Publish Directory** : `dist`
4. Dans l’onglet **Variables**, ajoute :
   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `VITE_API_URL` | `https://visionboard-api.up.railway.app/api` |
5. Dans l’onglet **Settings**, ajoute une règle **SPA Redirect** :
   - Source : `/*`
   - Destination : `/index.html`
   - Status : `200 Rewrite`
6. Clique sur **Deploy**.

## 5. Mettre à jour ALLOWED_ORIGINS / FRONTEND_URL

1. Récupère l’URL publique du frontend Railway (ex. `https://visionboard-frontend.up.railway.app`).
2. Mets à jour les variables `ALLOWED_ORIGINS` et `FRONTEND_URL` du backend avec cette URL.
3. Redéploie le backend pour qu’il prenne la modification en compte.

## Vérification

- Backend : `https://visionboard-api.up.railway.app/api/health` doit retourner `{"status":"ok"}`.
- Frontend : l’URL publique affiche l’application React.
- Inscription/connexion fonctionnent et appellent bien le backend.

## Coût

- Railway facture à l’usage.
- Un petit projet avec un backend Node + PostgreSQL + static site coûte généralement entre 10 et 20 $/mois selon le trafic.
- Un crédit d’essai est souvent disponible pour les nouveaux comptes.

## Différences avec Render

- Railway déploie automatiquement à chaque push sur `main`.
- Le domaine par défaut est `.up.railway.app`.
- Les variables d’environnement sont gérées dans l’interface Railway.
- Pas besoin de `render.yaml` ni de deploy hooks.
