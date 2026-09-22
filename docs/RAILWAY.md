# Déploiement complet sur Railway

Ce guide correspond à la configuration Railway actuelle du projet Vision Board. Il remplace les anciens fichiers `railway.toml`, désormais dépréciés et ignorés par les nouveaux services Railway.

## Architecture déployée

| Ressource Railway | Code source | Build / exécution |
|---|---|---|
| `postgres` | PostgreSQL managé | Provisionné par Railway IaC |
| `api` | `backend/` | Railpack, Node.js, Express, Prisma |
| `web` | `frontend/` | Docker multi-stage : build Vite puis Caddy |

L'ensemble de l'infrastructure est décrit dans `.railway/railway.ts` :

- création de PostgreSQL ;
- liaison automatique de `DATABASE_URL` à l'API ;
- commandes de build, migration, démarrage et healthcheck ;
- liaison au dépôt GitHub et à la branche `main` ;
- variables croisées entre les domaines API et frontend ;
- activation de **Wait for CI** avant chaque auto-déploiement ;
- conservation des secrets Railway sans les écrire dans Git.

## Pourquoi les anciens `railway.toml` ont été supprimés

Railway a déprécié « Config as Code » (`railway.toml` / `railway.json`) :

- les nouveaux services ne peuvent plus l'activer ;
- les fichiers existants cesseront d'être lus le **1er décembre 2026** ;
- le champ `publishDirectory` auparavant utilisé dans `frontend/railway.toml` n'existe pas dans le schéma Railway ;
- Railway ne possède pas le type « Static Site » de Render : un serveur HTTP doit servir le build frontend.

Le remplacement officiel est **Infrastructure as Code**, via `.railway/railway.ts`.

## Prérequis

- Compte Railway actif.
- Compte GitHub avec accès contributeur à `jmangata/vision-board-app`.
- Application GitHub Railway autorisée à accéder au dépôt.
- `backend/.env` renseigné avec les secrets applicatifs.
- Node.js et npm installés.

## Premier déploiement — procédure automatisée

Depuis la racine du dépôt :

```powershell
npm install
npm run railway:install
npm run railway:login
npm run railway:bootstrap
```

### 1. `npm install`

Installe le SDK officiel Infrastructure as Code `railway@3.11.0`, verrouillé dans `package-lock.json`.

### 2. `npm run railway:install`

Télécharge le binaire officiel Railway CLI 5.57.0 depuis la release GitHub vers `.tools/railway/`, puis vérifie son SHA-256 avant toute exécution. `.tools/` est ignoré par Git.

La CLI n'est volontairement pas installée comme dépendance npm : sa dépendance transitive `tar` contient des vulnérabilités critiques, tandis qu'un override vers la version corrigée casse le script d'installation de la CLI. Le binaire précompilé officiel évite entièrement cette dépendance.

### 3. `npm run railway:login`

Ouvre le navigateur et demande l'autorisation Railway. C'est la seule action d'authentification manuelle obligatoire. Ne communique jamais ton token à un tiers et ne l'ajoute pas au dépôt.

### 4. `npm run railway:bootstrap`

Le script `scripts/railway-bootstrap.mjs` :

1. vérifie l'authentification ;
2. crée le projet `vision-board-app` s'il n'existe pas, ou conserve le projet déjà lié ;
3. applique `.railway/railway.ts` et affiche le plan avant confirmation ;
4. crée PostgreSQL et les services `api` et `web` ;
5. génère leurs domaines publics `*.up.railway.app` ;
6. écrit les domaines réels dans `mobile/.env` pour Expo ;
7. charge les secrets de `backend/.env` vers le service `api` via `stdin` ;
8. redéploie les deux services après création des domaines et secrets ;
9. affiche les deux URLs finales.

Le script est réexécutable : il conserve le projet, les services et les domaines existants.

## Secrets envoyés à Railway

`scripts/railway-secrets.mjs` applique une liste blanche stricte :

- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UNSPLASH_ACCESS_KEY`
- `GROQ_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Les valeurs sont envoyées via l'entrée standard du processus (`railway variable set KEY --stdin`) : elles n'apparaissent pas dans les arguments, les logs ou Git.

Ces variables ne sont volontairement **pas** copiées depuis le `.env` local :

- `DATABASE_URL` : référence automatique à PostgreSQL Railway ;
- `NODE_ENV` : défini à `production` dans l'IaC ;
- `JWT_EXPIRES_IN` : défini à `7d` dans l'IaC ;
- `PORT` : injecté automatiquement par Railway ;
- `ALLOWED_ORIGINS` et `FRONTEND_URL` : référence automatique au domaine public du frontend.

Pour tester la détection sans envoyer de valeur :

```powershell
npm run railway:secrets -- --dry-run
```

## Frontend : Docker + Caddy

Railway exécute des conteneurs, pas des sites statiques au sens Render. Le frontend utilise donc :

- `frontend/Dockerfile` : build multi-stage ;
- étape 1 : Node.js exécute `npm ci` puis `npm run build` ;
- étape 2 : Caddy sert uniquement le dossier `dist` ;
- `frontend/Caddyfile` : écoute `$PORT`, compresse en gzip et applique le fallback SPA ;
- `try_files {path} /index.html` : un refresh sur `/forgot-password` ou `/goals/123` ne renvoie pas 404 ;
- `/health` : healthcheck Railway.

`VITE_API_URL` est une variable de **build**. Railway la construit automatiquement à partir du domaine public de l'API :

```text
https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api
```

Le Dockerfile la reçoit en `ARG`, puis Vite l'intègre au bundle. La modification de cette variable nécessite donc un rebuild, déclenché automatiquement par Railway.

## Backend : build, migration et démarrage

| Phase | Commande |
|---|---|
| Build | `npm run prisma:generate` |
| Pre-deploy | `npm run migrate:deploy` |
| Start | `node index.js` |
| Healthcheck | `/api/health` |

Les migrations ne tournent plus pendant le build. Elles s'exécutent en **pre-deploy**, lorsque `DATABASE_URL` et le réseau privé sont disponibles. Si une migration échoue, Railway interrompt le nouveau déploiement et l'ancienne instance reste active.

Les scripts passent par `npm run` plutôt que `npx`. Sans binaire local, `npx` peut télécharger une version inattendue depuis le registre ; ce comportement a été constaté avec `prisma@8.0.0-rc.15`. `npm run` garantit l'utilisation de la version Prisma verrouillée dans le lockfile.

## CI/CD

Le déploiement continu n'utilise plus un workflow custom avec `railway up`.

1. Les services sont liés au dépôt GitHub et à `main` par l'IaC.
2. `.github/workflows/ci.yml` s'exécute sur tous les pushes, y compris `main`.
3. `checkSuites: true` active **Wait for CI** sur `api` et `web`.
4. Railway attend le résultat de GitHub Actions avant de démarrer le déploiement.
5. Une CI en échec annule le déploiement.
6. Une CI réussie déclenche automatiquement les builds Railway.

Cela évite le double déploiement et supprime le besoin d'un secret GitHub `RAILWAY_TOKEN` pour les déploiements applicatifs ordinaires.

## Vérification automatique après déploiement

```powershell
npm run railway:verify
```

`scripts/railway-verify.mjs` récupère les vrais domaines depuis Railway et contrôle :

1. `/api/health` renvoie `200` et `{"status":"ok"}` ;
2. la racine du frontend sert l'application React ;
3. `/forgot-password` sert aussi `index.html` (fallback SPA) ;
4. l'API renvoie le bon en-tête CORS pour le domaine du frontend.

## Commandes d'administration

```powershell
# Voir l'état du projet lié
npm run railway -- status

# Prévisualiser une modification de l'infrastructure, sans l'appliquer
npm run railway:plan

# Appliquer l'infrastructure après vérification du plan
npm run railway:apply

# Voir les logs
npm run railway -- logs --service api
npm run railway -- logs --service web

# Voir les variables sans afficher leurs valeurs sensibles
npm run railway -- variable list --service api

# Ouvrir le dashboard
npm run railway -- open
```

## Dépannage

### `Not authenticated`

```powershell
npm run railway:login
```

### `No project linked`

Le bootstrap crée automatiquement le projet. Pour lier manuellement un projet existant :

```powershell
npm run railway -- link
```

### Le frontend appelle `localhost:5000`

Le frontend a été construit avant la génération du domaine API. Relance :

```powershell
npm run railway -- redeploy --service web --yes
```

Puis vérifie que `VITE_API_URL` référence bien `https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api` dans Railway.

### Erreur CORS

Relance l'application de l'IaC puis redéploie l'API :

```powershell
npm run railway:apply
npm run railway -- redeploy --service api --yes
```

`ALLOWED_ORIGINS` doit référencer `https://${{web.RAILWAY_PUBLIC_DOMAIN}}`.

### Erreur Prisma pendant le pre-deploy

Consulte les logs :

```powershell
npm run railway -- logs --service api
```

Vérifie que `DATABASE_URL` est une référence au service `postgres`, puis inspecte l'état des migrations :

```powershell
npm run railway -- run --service api npm run migrate:deploy
```

### 404 après refresh sur une route React

Le service `web` doit être construit depuis `frontend/Dockerfile`, et le `Caddyfile` doit contenir :

```caddyfile
try_files {path} /index.html
```

## Coût

Railway facture à l'usage. Surveille la consommation du service API et de PostgreSQL depuis le dashboard. Le frontend Caddy consomme peu de ressources, mais il s'agit malgré tout d'un conteneur actif et non d'un hébergement statique gratuit.
