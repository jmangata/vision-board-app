# Vision Board App

Application de suivi d'objectifs personnels avec gamification. L'utilisateur crée des
objectifs classés par catégorie, les découpe en étapes, suit sa progression sur un
tableau de bord et débloque des badges. Disponible en **web** (React) et **mobile**
(React Native / Expo), adossés à une **API REST** commune (Express + Prisma + PostgreSQL).

## Architecture

```
vision-board-app/
├── backend/     # API REST — Node.js, Express, Prisma, PostgreSQL
├── frontend/    # Application web — React 18, Vite, Tailwind CSS
├── mobile/      # Application mobile — React Native, Expo
├── docs/        # Conception (MCD), MVP, déploiement, troubleshooting
└── .github/     # CI/CD GitHub Actions → Render
```

## Prérequis

- Node.js 20+
- Docker (pour PostgreSQL) ou une instance PostgreSQL existante

## Installation

```bash
# 1. Base de données PostgreSQL via Docker (port 5433)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # renseigner les clés (JWT_SECRET, Cloudinary, ...)
npm install
npx prisma migrate deploy   # applique les migrations
npx prisma db seed          # catégories + badges
npm run dev                 # API sur http://localhost:5000

# 3. Frontend web
cd ../frontend
npm install
npm run dev                 # http://localhost:5173

# 4. Mobile (optionnel)
cd ../mobile
npm install
npm start                   # Expo
```

## Tests

```bash
cd backend
npm test               # Vitest : unitaires (badges, streak) + intégration API (Supertest)
npm run test:coverage  # avec couverture de code
```

Les tests couvrent :
- la logique de streak de connexion (`computeStreakUpdate`),
- l'attribution automatique des badges (`checkBadges`, Prisma mocké),
- la validation des entrées et l'authentification des routes protégées.

## Sécurité

- Mots de passe hachés avec **bcrypt** (10 rounds)
- Authentification stateless par **JWT** (`Authorization: Bearer <token>`)
- **helmet** : en-têtes HTTP sécurisés
- **rate limiting** : 200 req/15 min global, 20 req/15 min sur `/api/auth`
- **CORS** restreint en production via `ALLOWED_ORIGINS`
- Validation des entrées (format email, complexité du mot de passe)
- ORM **Prisma** paramétré → protection contre les injections SQL
- Secrets dans `.env` (jamais commités, `.env` ignoré par git)

## API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion (JWT) |
| POST | `/api/auth/forgot-password` | Lien de réinitialisation par email |
| POST | `/api/auth/reset-password` | Nouveau mot de passe via token |
| GET/PUT/DELETE | `/api/users/me` | Profil + suppression compte (RGPD) |
| GET/POST/PUT/DELETE | `/api/goals` | CRUD objectifs |
| POST | `/api/goals/:id/steps` | Ajouter une étape |
| PATCH | `/api/steps/:id/toggle` | Basculer une étape |
| GET | `/api/dashboard` | Statistiques |
| GET | `/api/badges/my` | Badges de l'utilisateur |
| POST | `/api/suggestions/steps` | Suggestion d'étapes par IA (Groq) |
| GET | `/api/health` | Sonde de santé |

## Déploiement

CI/CD via GitHub Actions : la CI (syntaxe, tests, build frontend) s'exécute sur chaque
push/PR, puis le CD déploie le backend et le frontend sur **Render** via deploy hooks.
Voir `docs/DEPLOYMENT.md` et `render.yaml`.

## Documentation

- `docs/conception.md` — dossier de conception (architecture, MCD, choix techniques)
- `docs/MCD-vision-board.md` — modèle conceptuel de données
- `docs/MVP.md` — périmètre et réalisation du MVP
- `docs/DEPLOYMENT.md` — procédure de déploiement Render
- `docs/TROUBLESHOOTING.md` — problèmes rencontrés et solutions
- `docs/CHANGELOG.md` — historique des évolutions
