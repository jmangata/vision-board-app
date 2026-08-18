# Dossier de conception — Vision Board App

---

## 1. Contexte et objectifs

### 1.1 Description du projet

Vision Board App est une application de suivi d'objectifs personnels avec gamification. Elle permet à un utilisateur de définir des objectifs, de les découper en micro-étapes, de suivre visuellement sa progression via un tableau de bord, et de gagner des badges pour rester motivé.

L'application est disponible sur deux supports : une version web (React) et une version mobile (React Native), partageant la même API backend.

### 1.2 Public cible

Toute personne souhaitant structurer et suivre ses objectifs personnels ou professionnels avec une approche visuelle et ludique.

### 1.3 Fonctionnalités principales (MVP)

- Inscription et connexion sécurisée (email + mot de passe)
- Création, modification et suppression d'objectifs
- Ajout de micro-étapes par objectif avec suivi de progression
- Vision board : vue en grille des objectifs avec filtres
- Tableau de bord avec statistiques (taux de réussite, objectifs urgents)
- Système de badges (5 badges différents)
- Rappels par email pour les objectifs sans progression récente

---

## 2. Architecture du projet

### 2.1 Organisation en monorepo

```
vision-board-app/
├── backend/                  # API REST — Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma     # Modèle de données
│   ├── src/
│   │   ├── controllers/      # Logique métier par ressource
│   │   ├── middlewares/      # Authentification, gestion d'erreurs
│   │   ├── routes/           # Définition des endpoints REST
│   │   ├── services/         # Services externes (email, upload, badges)
│   │   └── prisma.js         # Singleton PrismaClient
│   ├── index.js              # Point d'entrée du serveur
│   ├── package.json          # Dépendances backend
│   └── .env                  # Variables d'environnement
├── frontend/                 # Application web — React + Vite
│   └── src/
│       ├── components/       # Composants réutilisables
│       ├── pages/            # Pages (Dashboard, Board, Login, etc.)
│       └── services/         # Appels API vers le backend
├── mobile/                   # Application mobile — React Native + Expo
│   └── src/
│       ├── components/       # Composants réutilisables
│       ├── screens/          # Écrans (Dashboard, Board, Login, etc.)
│       ├── services/         # Appels API vers le backend
│       └── navigation/       # Navigation entre écrans
├── docker-compose.yml        # Conteneur PostgreSQL
└── docs/
    └── conception.md         # Ce document
```

### 2.2 Flux de données

```
Navigateur / Mobile
       │
       ▼
   Frontend (React / React Native)
       │  Requête HTTP (JSON)
       ▼
   Backend (Express API)
       │  Requête Prisma
       ▼
   PostgreSQL (Docker)
```

### 2.3 Communication frontend ↔ backend

- Le frontend envoie des requêtes HTTP au backend sur `http://localhost:5000`
- Les routes protégées nécessitent un header `Authorization: Bearer <token>`
- Le backend répond en JSON avec les codes HTTP standards (200, 201, 400, 401, 404, 409, 500)

---

## 3. Stack technique et justifications

### 3.1 Choix technologiques

| Technologie | Rôle | Justification |
|-------------|------|---------------|
| **Node.js + Express** | Serveur backend | Écosystème JavaScript unifié front/back, rapide à prototyper, large communauté |
| **PostgreSQL** | Base de données | Base relationnelle robuste, adaptée aux relations complexes entre entités |
| **Prisma** | ORM | Requêtes type-safe, migrations automatiques, gestion des relations et cascades, protection contre les injections SQL |
| **Docker** | Conteneurisation PostgreSQL | Isolation de l'environnement, pas d'installation native de PostgreSQL, reproductible |
| **JWT** | Authentification | Stateless, pas de session serveur, adapté aux APIs REST et aux apps mobiles |
| **bcrypt** | Hashage des mots de passe | Algorithme éprouvé avec salt automatique, résistant aux attaques par force brute |
| **Cloudinary** | Hébergement d'images | CDN intégré, transformations d'images à la volée, plan gratuit généreux |
| **Unsplash API** | Recherche d'images | Grande bibliothèque d'images gratuites pour illustrer les objectifs |
| **Nodemailer** | Envoi d'emails | Solution standard Node.js pour l'envoi d'emails SMTP |
| **React + Vite** | Frontend web | Vite offre un démarrage rapide et un HMR performant, TailwindCSS pour le style utilitaire |
| **React Native + Expo** | Application mobile | Codebase partagée avec le web (logique JS), Expo simplifie le déploiement |
| **Recharts** | Graphiques dashboard | Librairie React légère pour les graphiques de statistiques |

### 3.2 Pourquoi Prisma plutôt que du SQL brut ?

- Le schéma comporte 6 modèles avec des relations imbriquées (User → Goal → Step, User → Goal → Reminder, User → UserBadge → Badge)
- Prisma gère automatiquement les `JOIN` via `include`, les suppressions en cascade, et les migrations versionnées
- La protection contre les injections SQL est intégrée
- La productivité est supérieure pour un MVP

### 3.3 Pourquoi Docker pour PostgreSQL ?

- Pas besoin d'installer PostgreSQL nativement sur la machine
- Configuration reproductible via le fichier `docker-compose.yml`
- Isolation : la base de données ne pollue pas le système hôte
- Facile à démarrer/arrêter (`docker compose up -d` / `docker compose down`)

---

## 4. Base de données

### 4.1 Configuration Docker

Le conteneur PostgreSQL est défini dans `docker-compose.yml` à la racine du projet.

```yaml
services:
  postgres:
    image: postgres:16
    container_name: visionboard-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
      POSTGRES_DB: visionboard
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Le port **5433** a été choisi car le port 5432 était déjà occupé par une autre instance PostgreSQL sur la machine de développement.

### 4.2 Chaîne de connexion

```
DATABASE_URL="postgresql://postgres:root@localhost:5433/visionboard?schema=public"
```

Cette variable est stockée dans `backend/.env` et lue automatiquement par Prisma.

### 4.3 Modèle de données complet

#### Table `users`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| email | VARCHAR | UNIQUE, NOT NULL | Email de connexion |
| password_hash | VARCHAR | NOT NULL | Mot de passe hashé (bcrypt) |
| firstname | VARCHAR | NOT NULL | Prénom de l'utilisateur |
| avatar_url | VARCHAR | NULLABLE | URL de la photo de profil |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création du compte |

#### Table `categories`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| name | VARCHAR | UNIQUE, NOT NULL | Nom de la catégorie |
| color | VARCHAR | NOT NULL | Code couleur hexadécimal |
| icon | VARCHAR | NOT NULL | Nom de l'icône (librairie d'icônes) |

#### Table `goals`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| user_id | UUID | FK → users, CASCADE | Propriétaire de l'objectif |
| category_id | UUID | FK → categories | Catégorie de l'objectif |
| title | VARCHAR | NOT NULL | Titre de l'objectif |
| description | TEXT | NULLABLE | Description détaillée |
| image_url | VARCHAR | NULLABLE | Image d'illustration |
| target_date | TIMESTAMP | NULLABLE | Date limite |
| status | VARCHAR | DEFAULT 'active' | active, completed ou abandoned |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

#### Table `steps`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| goal_id | UUID | FK → goals, CASCADE | Objectif parent |
| title | VARCHAR | NOT NULL | Titre de l'étape |
| is_completed | BOOLEAN | DEFAULT false | État de complétion |
| order | INT | NOT NULL | Ordre d'affichage |
| completed_at | TIMESTAMP | NULLABLE | Date de complétion |

#### Table `reminders`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| goal_id | UUID | FK → goals, CASCADE | Objectif concerné |
| user_id | UUID | FK → users, CASCADE | Utilisateur à notifier |
| frequency | VARCHAR | NOT NULL | daily, weekly ou monthly |
| next_trigger_at | TIMESTAMP | NOT NULL | Prochaine date de déclenchement |

#### Table `badges`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| name | VARCHAR | UNIQUE, NOT NULL | Nom du badge |
| icon | VARCHAR | NOT NULL | Icône représentant le badge |
| description | VARCHAR | NOT NULL | Description du badge |
| condition_key | VARCHAR | NOT NULL | Clé identifiant la condition d'obtention |

#### Table `user_badges`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, auto-généré | Identifiant unique |
| user_id | UUID | FK → users, CASCADE | Utilisateur |
| badge_id | UUID | FK → badges, CASCADE | Badge obtenu |
| earned_at | TIMESTAMP | DEFAULT NOW() | Date d'obtention |

Contrainte unique : `UNIQUE(user_id, badge_id)` — un utilisateur ne peut obtenir un badge qu'une seule fois.

### 4.4 Relations et intégrité référentielle

```
User (1) ──── (N) Goal ──── (N) Step
  │                │
  │                └──── (N) Reminder
  │
  └──── (N) UserBadge ──── (1) Badge

Category (1) ──── (N) Goal
```

Toutes les relations sont configurées avec `onDelete: Cascade` :
- Supprimer un utilisateur → supprime ses goals, reminders, badges
- Supprimer un goal → supprime ses steps et reminders
- Supprimer un badge → supprime les UserBadge associés

### 4.5 Migration

La migration initiale a été créée et appliquée :

```bash
npx prisma migrate dev --name init
```

Cela a généré le dossier `backend/prisma/migrations/` contenant le SQL de création des tables, et le client Prisma dans `node_modules/@prisma/client`.

---

## 5. Règles métier

| Règle | Description |
|-------|-------------|
| Titre obligatoire | Un objectif ne peut pas être créé sans titre |
| Badge unique | Un badge ne peut être obtenu qu'une seule fois par utilisateur (contrainte DB) |
| Cascade delete | Supprimer un objectif supprime ses étapes et rappels |
| Rappel conditionnel | Un rappel ne se déclenche que si l'objectif est au statut "actif" |
| Isolation des données | Un utilisateur ne peut accéder qu'à ses propres objectifs, étapes et badges |
| Date limite valide | La date limite d'un objectif ne peut pas être antérieure à sa date de création |
| Streak | Le streak de connexion se réinitialise après 24h sans activité |
| Progression | La progression d'un objectif est calculée automatiquement : (étapes cochées / total étapes) × 100 |

---

## 6. Spécifications des badges

| Badge | Condition | condition_key |
|-------|-----------|---------------|
| Premier objectif créé | L'utilisateur crée son premier objectif | `first_goal` |
| Premier objectif terminé | L'utilisateur passe un objectif en "completed" | `first_completed` |
| 5 objectifs terminés | L'utilisateur a 5 objectifs au statut "completed" | `five_completed` |
| Streak 7 jours | L'utilisateur se connecte 7 jours consécutifs | `streak_7` |
| Explorateur | L'utilisateur a des objectifs dans 3 catégories différentes | `explorer` |

---

## 7. Charte graphique

| Élément | Valeur | Usage |
|---------|--------|-------|
| Primaire | `#2E5797` (bleu) | Boutons, liens, en-têtes |
| Accent / Succès | `#1D9E75` (vert) | Badges, progression, succès |
| Alerte | `#D85A30` (corail) | Erreurs, dates dépassées |
| Fond | `#F5F7FA` (gris clair) | Arrière-plan général |
| Texte | `#333333` (gris foncé) | Texte principal |
| Typographie | Inter ou Poppins | Police sans-serif |
| Style | Cartes arrondies, ombres légères, icônes line-style | Interface moderne et épurée |

---

## 8. Authentification — Spécifications détaillées

### 8.1 Flux d'inscription (Register)

```
Client                    Serveur                     Base de données
  │                          │                              │
  │  POST /api/auth/register │                              │
  │  {email, password,       │                              │
  │   firstname}             │                              │
  │─────────────────────────►│                              │
  │                          │  Vérifie champs requis       │
  │                          │  Vérifie email unique ──────►│
  │                          │                    ◄─────────│
  │                          │  Hash password (bcrypt, 10)  │
  │                          │  Crée user ─────────────────►│
  │                          │                    ◄─────────│
  │                          │  Génère JWT (userId, 7j)     │
  │  {token, user}           │                              │
  │◄─────────────────────────│                              │
```

### 8.2 Flux de connexion (Login)

```
Client                    Serveur                     Base de données
  │                          │                              │
  │  POST /api/auth/login    │                              │
  │  {email, password}       │                              │
  │─────────────────────────►│                              │
  │                          │  Vérifie champs requis       │
  │                          │  Cherche user par email ────►│
  │                          │                    ◄─────────│
  │                          │  Compare password (bcrypt)   │
  │                          │  Génère JWT (userId, 7j)     │
  │  {token, user}           │                              │
  │◄─────────────────────────│                              │
```

### 8.3 Structure du token JWT

```json
{
  "userId": "uuid-de-l-utilisateur",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Signé avec `JWT_SECRET` (variable d'environnement), algorithme HS256, expiration 7 jours.

### 8.4 Codes HTTP retournés

| Code | Situation |
|------|-----------|
| 201 | Inscription réussie |
| 200 | Connexion réussie |
| 400 | Champs manquants (email, password, firstname) |
| 401 | Identifiants invalides |
| 409 | Email déjà utilisé |
| 500 | Erreur interne du serveur |

### 8.5 Middleware JWT (à implémenter)

Le middleware `authenticate` sera placé avant chaque route protégée. Il :
1. Extrait le token du header `Authorization: Bearer <token>`
2. Vérifie la signature avec `jwt.verify`
3. Cherche l'utilisateur en base pour confirmer son existence
4. Injecte `req.user` (id, email, firstname) pour les controllers suivants
5. Retourne 401 si le token est absent, invalide ou expiré

---

## 9. Structure des endpoints API

### 9.1 Endpoints implémentés

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | `/api/health` | Non | Vérifie que le serveur répond |
| POST | `/api/auth/register` | Non | Inscription |
| POST | `/api/auth/login` | Non | Connexion |
| GET | `/api/categories` | Non | Liste des catégories |
| POST | `/api/categories` | Non | Créer une catégorie |
| GET | `/api/goals` | Oui | Objectifs de l'utilisateur |
| POST | `/api/goals` | Oui | Créer un objectif |
| GET | `/api/goals/:id` | Oui | Détail d'un objectif |
| PUT | `/api/goals/:id` | Oui | Modifier un objectif |
| DELETE | `/api/goals/:id` | Oui | Supprimer un objectif |
| POST | `/api/goals/:id/steps` | Oui | Ajouter une étape |
| PUT | `/api/steps/:id` | Oui | Modifier une étape |
| DELETE | `/api/steps/:id` | Oui | Supprimer une étape |
| PATCH | `/api/steps/:id/toggle` | Oui | Cocher/décocher une étape |
| GET | `/api/dashboard` | Oui | Statistiques du tableau de bord |
| GET | `/api/badges` | Non | Liste de tous les badges |
| GET | `/api/badges/me` | Oui | Badges de l'utilisateur |
| GET | `/api/reminders` | Oui | Rappels de l'utilisateur |
| POST | `/api/reminders` | Oui | Créer un rappel |
| DELETE | `/api/reminders/:id` | Oui | Supprimer un rappel |

### 9.2 Endpoints à implémenter

Aucun. L'ensemble du backend MVP est fonctionnel.

---

## 10. État d'avancement

### 10.1 Ce qui est fait

| Étape | Statut | Détail |
|-------|--------|--------|
| Schéma Prisma | ✅ Terminé | 6 modèles, relations, cascade delete |
| Docker PostgreSQL | ✅ Terminé | Conteneur sur port 5433, données persistantes |
| Package.json backend | ✅ Terminé | Dépendances installées, scripts configurés |
| Variables d'environnement | ✅ Terminé | .env avec DB, JWT, Cloudinary, Unsplash |
| Serveur Express | ✅ Terminé | Port 5000, CORS, JSON parsing |
| Singleton Prisma | ✅ Terminé | Optimisé pour nodemon (globalThis) |
| Controller auth | ✅ Terminé | Register + Login avec bcrypt et JWT |
| Routes auth | ✅ Terminé | POST /api/auth/register et /api/auth/login |
| Tests Thunder Client | ✅ Terminé | Register et Login testés avec succès |
| Migration BDD | ✅ Terminé | Tables créées dans PostgreSQL |
| Middleware JWT | ✅ Terminé | authMiddleware.js protecteur de routes |
| CRUD Catégories | ✅ Terminé | categoryController.js + categoryRoutes.js |
| CRUD Objectifs | ✅ Terminé | goalController.js + goalRoutes.js protégés |
| CRUD Micro-étapes | ✅ Terminé | stepController.js + stepRoutes.js, toggle inclus |
| Dashboard | ✅ Terminé | dashboardController.js + dashboardRoutes.js |
| Système de badges | ✅ Terminé | badgeController.js + badgeRoutes.js |
| Rappels | ✅ Terminé | reminderController.js + reminderRoutes.js |
| Seed | ✅ Terminé | prisma/seed.js pour catégories et badges par défaut |
| Tests automatisés API | ✅ Terminé | test-api.js teste les 10 étapes clés |

### 10.2 Reste à faire

| Étape | Priorité |
|-------|----------|
| Attribution automatique des badges | Moyenne |
| Rappels email (Nodemailer) | Basse |
| Frontend web (React + Vite) | Haute |
| Application mobile (React Native) | Après frontend |

---

## 11. Commandes de référence

```bash
# === Docker ===
docker compose up -d          # Démarrer PostgreSQL
docker compose down           # Arrêter PostgreSQL
docker ps                     # Voir les conteneurs actifs
docker start visionboard-db   # Démarrer le conteneur s'il est arrêté

# === Backend ===
cd backend
npm install                   # Installer les dépendances
npm run dev                   # Lancer le serveur en mode développement (nodemon)
npm start                     # Lancer le serveur en mode production

# === Prisma ===
npx prisma migrate dev --name init   # Créer et appliquer une migration
npx prisma generate                  # Régénérer le client Prisma
npx prisma studio                    # Interface web pour explorer les données
npx prisma db push                   # Synchroniser le schéma sans migration

# === Tests ===
# Utiliser Thunder Client (extension VS Code) ou Postman
# URL de base : http://localhost:5000
# Endpoints disponibles : /api/health, /api/auth/register, /api/auth/login
```

---

## 12. Tests automatisés API

Un script de test automatique a été créé : `backend/test-api.js`. Il enchaîne les appels suivants :

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/categories`
4. `GET /api/badges`
5. `POST /api/goals`
6. `GET /api/goals`
7. `POST /api/goals/:goalId/steps`
8. `PATCH /api/steps/:id/toggle`
9. `GET /api/dashboard`
10. `POST /api/reminders`

Pour lancer les tests depuis le dossier `backend` :

```bash
node test-api.js
```

### Correction apportée sur les routes steps

Lors du premier test, la route `POST /api/goals/:goalId/steps` retournait une erreur 404 car les routes steps étaient mal montées dans `index.js`. Les routes steps ont été corrigées de la manière suivante :

- `stepRoutes.js` définit des routes relatives (`/:goalId/steps`, `/:id/toggle`, etc.)
- `index.js` monte le même `stepRoutes` à deux endroits :
  - `app.use('/api/goals', stepRoutes)` pour les créations d'étapes (`POST /api/goals/:goalId/steps`)
  - `app.use('/api/steps', stepRoutes)` pour les opérations sur une étape existante (`PUT`, `PATCH`, `DELETE`)

---

## 13. Environnement de développement

- **OS** : Windows
- **IDE** : VS Code
- **Docker** : v28.4.0
- **Node.js** : via npm
- **PostgreSQL** : 16 (conteneur Docker)
- **Test API** : Thunder Client (extension VS Code) + `test-api.js`
- **Gestion de version** : Git (https://github.com/jmangata/vision-board-app)
