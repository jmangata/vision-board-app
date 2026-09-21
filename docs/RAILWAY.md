# Déploiement sur Railway

Ce guide décrit comment héberger l'application Vision Board sur [Railway](https://railway.app). Il remplace l'infrastructure Render précédente.

## Stack déployée

| Composant | Type Railway | Dossier source | Fichier de config |
|---|---|---|---|
| Backend API | Service Node.js | `backend/` | `backend/railway.toml` |
| Base de données | PostgreSQL Railway | – | Dashboard Railway |
| Frontend web | Static Site | `frontend/` | `frontend/railway.toml` |

L'application mobile Expo reste hors scope web : elle est compilée et installée sur le téléphone. Les liens web intégrés (`forgot-password`, etc.) pointent vers le frontend Railway.

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
- Un token Railway pour le déploiement continu : `RAILWAY_TOKEN` dans les secrets GitHub du repo.

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

1. Clique sur **New > GitHub Repo** et sélectionne le repo.
2. Configure le service :
   - **Name** : `visionboard-api`
   - **Root Directory** : `backend`
   - Laisse les commandes Build / Start vides (`backend/railway.toml` les fournit).
3. Dans l'onglet **Variables**, ajoute :
   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | URL interne PostgreSQL copiée à l'étape 2 |
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
   | `MAIL_FROM` | Ton adresse d'expédition |
   | `ALLOWED_ORIGINS` | URL du frontend (voir étape 5) |
   | `FRONTEND_URL` | Même URL que `ALLOWED_ORIGINS` |
4. Clique sur **Deploy**.
5. Attends la fin du build, puis vérifie l'URL publique avec `/api/health`.

> **Note sur les migrations** : `backend/railway.toml` applique `npx prisma migrate deploy` pendant le build. Cela requiert que `DATABASE_URL` soit défini **avant** le premier déploiement, sinon le build échouera.

## 4. Déployer le frontend

1. Clique sur **New > Static Site**.
2. Sélectionne le repo `jmangata/vision-board-app`.
3. Configure :
   - **Name** : `visionboard-frontend`
   - **Root Directory** : `frontend`
   - Laisse les commandes Build / Publish vides (`frontend/railway.toml` les fournit).
4. Dans l'onglet **Variables**, ajoute :
   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `VITE_API_URL` | `https://visionboard-api.up.railway.app/api` |
5. Dans l'onglet **Settings**, ajoute une règle **SPA Redirect** :
   - Source : `/*`
   - Destination : `/index.html`
   - Status : `200 Rewrite`
6. Clique sur **Deploy**.

## 5. Mettre à jour ALLOWED_ORIGINS / FRONTEND_URL

1. Récupère l'URL publique du frontend Railway (ex. `https://visionboard-frontend.up.railway.app`).
2. Mets à jour les variables `ALLOWED_ORIGINS` et `FRONTEND_URL` du backend avec cette URL.
3. Redéploie le backend pour qu'il prenne la modification en compte.

## 6. Déploiement continu (optionnel)

Le fichier `.github/workflows/cd-railway.yml` déploie automatiquement backend puis frontend sur Railway après chaque push sur `main`, une fois la CI passée.

Prérequis :
1. Dans Railway, ouvre **Account Settings > Tokens** et crée un token d'accès.
2. Dans GitHub, ajoute ce token dans **Settings > Secrets and variables > Actions** sous le nom `RAILWAY_TOKEN`.
3. Dans Railway, désactive l'auto-deploy natif GitHub pour `visionboard-api` et `visionboard-frontend` si tu veux que seul le workflow CD déclenche les déploiements.

Ordre de déploiement :
1. CI (tests + build)
2. Backend (avec migrations Prisma)
3. Frontend

## Vérification

- Backend : `https://visionboard-api.up.railway.app/api/health` doit retourner `{"status":"ok"}`.
- Frontend : l'URL publique affiche l'application React.
- Inscription/connexion fonctionnent et appellent bien le backend.

## Coût

- Railway facture à l'usage.
- Un petit projet avec un backend Node + PostgreSQL + static site coûte généralement entre 10 et 20 $/mois selon le trafic.
- Un crédit d'essai est souvent disponible pour les nouveaux comptes.

## Migration depuis Render

- Suppression de `render.yaml` : Railway ne l'utilise pas.
- Suppression du workflow `.github/workflows/cd.yml` (Render) au profit de `.github/workflows/cd-railway.yml`.
- Le domaine par défaut est `.up.railway.app`.
- Les variables d'environnement sont gérées dans l'interface Railway.
- Les liens web de l'application mobile ont été mis à jour vers `visionboard-frontend.up.railway.app`.
