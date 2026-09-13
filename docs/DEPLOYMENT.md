# Déploiement continu (CD) — Vision Board App

Ce document décrit la mise en place du déploiement continu (CD) pour l'application Vision Board sur [Render](https://render.com), avec orchestration par GitHub Actions.

## Table des matières

1. [Architecture retenue](#architecture-retenue)
2. [Composants déployés](#composants-déployés)
3. [Prérequis](#prérequis)
4. [Fichiers ajoutés / modifiés](#fichiers-ajoutés--modifiés)
5. [Mise en place pas à pas](#mise-en-place-pas-à-pas)
6. [Explication du Blueprint Render](#explication-du-blueprint-render)
7. [Explication du workflow GitHub Actions](#explication-du-workflow-github-actions)
8. [Application mobile](#application-mobile)
9. [Vérification et dépannage](#vérification-et-dépannage)
10. [Évolution vers le staging](#évolution-vers-le-staging)

---

## Architecture retenue

- **Infrastructure as Code (IaC)** : un fichier `render.yaml` à la racine du dépôt décrit la base PostgreSQL, le backend Node.js et le frontend statique.
- **CI** : le workflow existant `.github/workflows/ci.yml` reste utilisé ; il est aussi appelé par le workflow CD.
- **CD** : un nouveau workflow `.github/workflows/cd.yml` est déclenché à chaque push sur `main`. Il exécute la CI, puis appelle les *deploy hooks* Render pour déployer le backend puis le frontend.
- **Stratégie de déploiement** : le backend est déployé en premier (migrations Prisma incluses), puis le frontend. Le frontend est configuré manuellement avec l'URL du backend via les variables d'environnement Render.

> **Pourquoi Render Blueprint ?**
> Cela versionne l'infrastructure dans Git, permet de recréer l'environnement en quelques clics et évite la configuration manuelle répétitive.

> **Pourquoi GitHub Actions + deploy hooks plutôt que l'auto-deploy Render ?**
> Cela garantit que la CI passe avant tout déploiement, offre une traçabilité centralisée dans GitHub et permet de déployer conditionnellement plusieurs services.

---

## Composants déployés

| Composant | Type Render | Fichier source | Remarque |
|-----------|-------------|----------------|----------|
| Backend API | `web` runtime Node | `backend/` | Exécute `node index.js`, health check `/api/health` |
| Base de données | PostgreSQL | - | Gérée par Render, accessible uniquement depuis les services Render |
| Frontend web | `web` runtime static | `frontend/` | Build Vite publié depuis `./dist` |
| Application mobile | Hors scope du CD web | `mobile/` | Déployée via Expo / EAS (voir [Application mobile](#application-mobile)) |

---

## Prérequis

- Un compte [Render](https://dashboard.render.com).
- Le dépôt GitHub `jmangata/vision-board-app` connecté à Render (autorisation OAuth).
- Les clés / secrets applicatifs suivants disponibles :
  - `JWT_SECRET` (généré automatiquement par Render, peut être regénéré manuellement)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `UNSPLASH_ACCESS_KEY`
  - `GROQ_API_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

---

## Fichiers ajoutés / modifiés

- `render.yaml` *(nouveau)* : Blueprint Render.
- `.github/workflows/cd.yml` *(nouveau)* : pipeline de déploiement continu.
- `.github/workflows/ci.yml` *(modifié)* : ajout du déclencheur `workflow_call` pour être réutilisé par `cd.yml` ; le push sur `main` est ignoré pour éviter un double lancement.
- `docs/DEPLOYMENT.md` *(nouveau)* : ce document.
- `docs/CHANGELOG.md` *(modifié)* : entrée décrivant la mise en place du CD.

---

## Mise en place pas à pas

### 1. Pousser le Blueprint dans GitHub

Le fichier `render.yaml` est déjà dans le dépôt. Il suffit de le committer et pousser sur `main` :

```bash
git add render.yaml .github/workflows/cd.yml .github/workflows/ci.yml docs/DEPLOYMENT.md docs/CHANGELOG.md
git commit -m "cd: ajoute le déploiement continu sur Render via Blueprint"
git push origin main
```

### 2. Créer l'environnement dans Render

1. Ouvrir le [Render Dashboard](https://dashboard.render.com).
2. Cliquer sur **New > Blueprint**.
3. Sélectionner le dépôt `vision-board-app`.
4. Laisser Render détecter `render.yaml` à la racine.
5. Vérifier les ressources proposées (base de données, backend, frontend) puis cliquer sur **Apply**.

Render provisionne alors :
- `visionboard-db` (PostgreSQL)
- `visionboard-api` (service web Node)
- `visionboard-frontend` (site statique)

### 3. Configurer les secrets applicatifs

> **⚠️ Rotation des secrets obligatoire**
> Une version précédente du fichier `render.yaml` contenait des secrets en clair (`JWT_SECRET`, `CLOUDINARY_*`, `UNSPLASH_ACCESS_KEY`). Ces valeurs ont été retirées du Blueprint et doivent désormais être définies dans le dashboard Render. Même si elles n'ont jamais été réellement exploitées, il est fortement recommandé de les regénérer / renouveler avant la mise en production.

Dans le dashboard Render, aller dans **Environment** de chaque service.

Pour `visionboard-api`, renseigner :

```text
JWT_SECRET=<valeur générée par Render ou une chaîne aléatoire forte>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
UNSPLASH_ACCESS_KEY=...
GROQ_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

> `DATABASE_URL` est injecté automatiquement par le Blueprint via `fromDatabase`.

### 4. Récupérer les *deploy hooks*

1. Dans Render, ouvrir `visionboard-api` > **Settings > Deploy Hook**.
2. Copier l'URL du hook.
3. Dans GitHub, aller dans **Settings > Secrets and variables > Actions**.
4. Ajouter un secret `RENDER_DEPLOY_HOOK_BACKEND` contenant l'URL copiée.
5. Répéter l'opération pour `visionboard-frontend` avec le secret `RENDER_DEPLOY_HOOK_FRONTEND`.

### 5. Configurer l'URL du backend pour le frontend

Une fois le backend déployé au moins une fois, Render lui attribue une URL publique :

```text
https://visionboard-api-xxxxxxxx.onrender.com
```

1. Aller dans **Environment** du service `visionboard-frontend`.
2. Ajouter :

```text
VITE_API_URL=https://visionboard-api-xxxxxxxx.onrender.com/api
```

> Le `/api` final est obligatoire car `frontend/src/services/api.js` attend que l'URL de base contienne ce préfixe.

3. Relancer un déploiement du frontend (depuis le dashboard Render ou en poussant un commit).

### 6. Désactiver l'auto-deploy natif Render

Le Blueprint définit déjà `autoDeployTrigger: 'off'` pour les deux services. Vérifiez dans le dashboard que l'option **Auto-Deploy** est bien sur `No`. Cela évite que Render déploie tout seul avant que GitHub Actions n'ait validé la CI.

---

## Explication du Blueprint Render

Fichier : `render.yaml`.

```yaml
services:
  - type: web
    name: visionboard-api
    runtime: node
    region: frankfurt
    plan: starter
    branch: main
    rootDir: backend
    buildCommand: npm ci && npx prisma generate
    preDeployCommand: npx prisma migrate deploy
    startCommand: node index.js
    healthCheckPath: /api/health
    autoDeployTrigger: 'off'
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: visionboard-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      ...
```

| Champ | Rôle |
|-------|------|
| `runtime: node` | Utilise l'environnement Node.js natif de Render (pas besoin de Dockerfile). |
| `rootDir: backend` | Render exécute les commandes dans le dossier `backend/`. |
| `buildCommand` | Installe les dépendances et génère le client Prisma. |
| `preDeployCommand` | Applique les migrations avant de rendre le service disponible. |
| `startCommand` | Démarre l'API Express. |
| `healthCheckPath` | Render appelle `/api/health` pour vérifier que le service est prêt. |
| `autoDeployTrigger: 'off'` | Seuls les deploy hooks déclenchent un déploiement. |
| `fromDatabase` | Injecte automatiquement `DATABASE_URL` depuis la base provisionnée. |
| `generateValue: true` | Génère un secret JWT aléatoire. |
| `sync: false` | La variable n'est pas gérée par le Blueprint ; elle se définit dans le dashboard. |

Pour le frontend :

```yaml
  - type: web
    name: visionboard-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

- `runtime: static` indique que le résultat est un site statique.
- `staticPublishPath: ./dist` correspond au dossier de sortie par défaut de Vite.
- `routes` redirige toutes les routes vers `index.html` pour supporter le routing côté client React Router.

---

## Explication du workflow GitHub Actions

Fichier : `.github/workflows/cd.yml`.

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  ci:
    name: Run CI checks
    uses: ./.github/workflows/ci.yml

  deploy-backend:
    name: Deploy backend to Render
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy hook
        run: curl -X POST "$RENDER_DEPLOY_HOOK_BACKEND"
        env:
          RENDER_DEPLOY_HOOK_BACKEND: ${{ secrets.RENDER_DEPLOY_HOOK_BACKEND }}

  deploy-frontend:
    name: Deploy frontend to Render
    needs: [ci, deploy-backend]
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy hook
        run: curl -X POST "$RENDER_DEPLOY_HOOK_FRONTEND"
        env:
          RENDER_DEPLOY_HOOK_FRONTEND: ${{ secrets.RENDER_DEPLOY_HOOK_FRONTEND }}
```

Déroulement à chaque push sur `main` :

1. **CI** : le workflow `ci.yml` vérifie le backend (syntaxe, client Prisma) et build le frontend.
2. **Backend** : si la CI réussit, le hook Render du backend est appelé. Render construit le backend et exécute `preDeployCommand` (migrations Prisma).
3. **Frontend** : une fois le backend déployé, le hook du frontend est appelé.

Le workflow `ci.yml` a été modifié pour ajouter `workflow_call` et ignorer les push sur `main` :

```yaml
on:
  push:
    branches-ignore: [main]
  pull_request:
    branches: [main]
  workflow_call:
```

Ainsi :
- Les pushes sur les branches de fonctionnalités et les pull requests exécutent la CI.
- Les pushes sur `main` ne lancent pas la CI directement : c'est le workflow CD qui l'appelle une seule fois.

---

## Application mobile

Le dossier `mobile/` (Expo / React Native) n'est **pas** déployé par ce pipeline Render. Les applications mobiles nécessitent un processus différent :

- **Mises à jour Over-The-Air (OTA)** : utiliser [EAS Update](https://docs.expo.dev/eas-update/introduction/) pour pousser des mises à jour JS sans repasser par les stores.
- **Builds natifs** : utiliser [EAS Build](https://docs.expo.dev/build/introduction/) pour générer les fichiers `.apk` / `.ipa` et les soumettre aux stores.

Le mobile réutilise la même API backend déployée sur Render ; il suffit donc de pointer `mobile/` vers `VITE_API_URL` adapté (généralement via une variable d'environnement Expo comme `EXPO_PUBLIC_API_URL`).

---

## Vérification et dépannage

### Vérifier que tout fonctionne

1. Pousser un changement mineur sur `main`.
2. Aller dans l'onglet **Actions** de GitHub.
3. Vérifier que le workflow **CD** est vert :
   - `Run CI checks`
   - `Deploy backend to Render`
   - `Deploy frontend to Render`
4. Ouvrir l'URL du backend et tester :
   ```bash
   curl https://visionboard-api-xxxxxxxx.onrender.com/api/health
   # attendu : {"status":"ok"}
   ```
5. Ouvrir l'URL du frontend et vérifier le login / l'affichage des objectifs.

### Problèmes fréquents

#### Le backend retourne une erreur 500 au démarrage

**Cause probable** : une migration Prisma n'a pas été appliquée ou le client Prisma n'a pas été généré.

**Vérification** : consulter les logs Render du service `visionboard-api`.

**Solution** :
- S'assurer que `preDeployCommand` contient `npx prisma migrate deploy`.
- Si une migration est manquante en local, la créer avec `npx prisma migrate dev` avant de pousser.

#### Le frontend appelle `localhost:5000` en production

**Cause probable** : la variable `VITE_API_URL` n'est pas définie ou ne contient pas `/api`.

**Solution** : dans Render, aller dans **Environment** du frontend et vérifier :

```text
VITE_API_URL=https://visionboard-api-xxxxxxxx.onrender.com/api
```

Puis redéployer le frontend.

#### Les appels API échouent avec une erreur CORS

**Cause probable** : le backend n'autorise pas le domaine du frontend.

**Solution** : le backend utilise déjà `app.use(cors())` sans restriction. Si plus tard tu veux restreindre les origines, il faudra configurer `cors()` avec une liste blanche et utiliser une variable d'environnement `CORS_ORIGIN`.

#### Le workflow CD ne se déclenche pas

**Vérifications** :
- Le fichier `.github/workflows/cd.yml` est bien sur `main`.
- Le push a bien eu lieu sur `main` (pas sur une autre branche).
- Les secrets `RENDER_DEPLOY_HOOK_BACKEND` et `RENDER_DEPLOY_HOOK_FRONTEND` sont définis dans GitHub.

---

## Évolution vers le staging

Pour ajouter un environnement de **staging** :

1. Créer une branche `develop` dans GitHub.
2. Modifier `render.yaml` pour utiliser des noms de services suffixés (`visionboard-api-staging`, `visionboard-frontend-staging`, `visionboard-db-staging`) et la branche `develop`.
3. Créer un second Blueprint dans Render à partir de la branche `develop`.
4. Ajouter un workflow `.github/workflows/cd-staging.yml` déclenché par les push sur `develop`.
5. Utiliser des secrets GitHub distincts (`RENDER_DEPLOY_HOOK_BACKEND_STAGING`, etc.).

Cela permet de valider les modifications sur staging avant de les merger en production.
