# MVP - Vision Board App

Ce document décrit de manière exhaustive l'ensemble des étapes réalisées pour atteindre le MVP (Minimum Viable Product) du projet **Vision Board App**, ainsi que les difficultés rencontrées et les solutions apportées.

---

## 1. Objectif du projet

Créer une application de **tableau de vision numérique** permettant à un utilisateur de :
- S'inscrire et se connecter de manière sécurisée
- Créer des objectifs personnels classés par catégorie
- Décomposer chaque objectif en étapes concrètes
- Suivre sa progression via un tableau de bord
- Obtenir automatiquement des badges en fonction de ses actions

---

## 2. Stack technique

### Backend
| Technologie | Usage |
|-------------|-------|
| Node.js + Express | Serveur API REST |
| Prisma ORM v5.16.0 | Modélisation et accès aux données |
| PostgreSQL | Base de données relationnelle |
| Docker | Conteneurisation de PostgreSQL (`visionboard-db` sur port `5433`) |
| JWT | Authentification stateless |
| bcrypt | Hachage des mots de passe |
| CORS | Autorisation des requêtes cross-origin depuis le frontend |
| Cloudinary | Prévu pour le stockage d'images (objectifs) |
| Nodemailer | Prévu pour les rappels par email |

### Frontend
| Technologie | Usage |
|-------------|-------|
| React 18 | Interface utilisateur |
| Vite | Build tool et serveur de développement |
| Tailwind CSS | Styling utilitaire |
| React Router DOM v6 | Navigation entre pages |
| Axios | Requêtes HTTP vers le backend |
| Inter | Police principale |
| Material Symbols | Icônes |

Le design system est inspiré de la maquette **Clarion Vision** avec une palette Material 3 (surface, primary, secondary, tertiary).

---

## 3. Backend - Architecture et fonctionnalités

### 3.1 Modèles de données (Prisma)

Les modèles suivants ont été définis dans `backend/prisma/schema.prisma` :

- `User` : utilisateur (email, mot de passe hashé, prénom)
- `Category` : catégorie d'objectifs (Sport, Musique, Voyage, Finance, Lecture, Autre)
- `Goal` : objectif utilisateur (titre, description, date d'échéance, statut)
- `Step` : étape d'un objectif (titre, statut de complétion)
- `Badge` : badge déblocable (titre, description, clé de condition)
- `UserBadge` : relation many-to-many entre utilisateurs et badges
- `Reminder` : rappel programmé pour un objectif

### 3.2 Routes API

#### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

#### Catégories
- `GET /api/categories` - Liste des catégories

#### Objectifs
- `GET /api/goals` - Objectifs de l'utilisateur connecté
- `GET /api/goals/:id` - Détail d'un objectif
- `POST /api/goals` - Créer un objectif
- `PUT /api/goals/:id` - Modifier un objectif
- `DELETE /api/goals/:id` - Supprimer un objectif

#### Étapes
- `POST /api/goals/:id/steps` - Ajouter une étape
- `PATCH /api/steps/:id/toggle` - Basculer le statut d'une étape
- `DELETE /api/steps/:id` - Supprimer une étape

#### Tableau de bord et badges
- `GET /api/dashboard` - Statistiques utilisateur
- `GET /api/badges` - Liste de tous les badges
- `GET /api/badges/my` - Badges de l'utilisateur connecté

### 3.3 Logique métier clé

#### Attribution automatique des badges
Le fichier `backend/src/services/badgeService.js` contient la logique de vérification des conditions.

Les badges sont attribués automatiquement lorsque :
- L'utilisateur crée son premier objectif
- L'utilisateur termine un objectif

Cette vérification est déclenchée dans :
- `goalController.js` après la création ou modification d'un objectif
- `stepController.js` après le basculement d'une étape et la vérification de la complétion de l'objectif

### 3.4 Seed de la base de données

Le fichier `backend/prisma/seed.js` initialise :
- Les catégories (Sport, Musique, Voyage, Finance, Lecture, Autre)
- Les badges avec leurs conditions respectives

Commande d'exécution :
```bash
cd backend
npx prisma db seed
```

---

## 4. Frontend - Architecture et pages

### 4.1 Structure des fichiers

```
frontend/
├── index.html
├── index.css
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   └── BadgeCard.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Board.jsx
│   │   ├── CreateGoal.jsx
│   │   ├── GoalDetail.jsx
│   │   └── Dashboard.jsx
│   └── services/
│       ├── api.js
│       ├── authService.js
│       └── goalService.js
```

### 4.2 Pages

- **Login** : écran de connexion avec logo, champs email/mot de passe, boutons sociaux
- **Register** : formulaire d'inscription avec prénom, email et mot de passe
- **Board** : grille des objectifs de l'utilisateur avec barre de progression
- **CreateGoal** : formulaire de création avec titre, description, catégorie, date d'échéance
- **GoalDetail** : détail d'un objectif, barre de progression, étapes interactives
- **Dashboard** : statistiques (objectifs totaux, terminés, actifs, taux de complétion, badges)

### 4.3 Composants réutilisables

- **BottomNav** : navigation mobile avec 4 onglets (Board, Stats, Badges, Profil)
- **BadgeCard** : carte d'affichage d'un badge

### 4.4 Services

- `api.js` : instance Axios configurée avec l'URL de base et l'intercepteur JWT
- `authService.js` : appels API d'authentification
- `goalService.js` : appels API pour les objectifs et étapes

---

## 5. Difficultés rencontrées et solutions

### 5.1 Erreur PrismaClientInitializationError

**Problème** : L'exécution du seed ou du serveur backend échouait avec une erreur d'initialisation Prisma.

**Cause** : Les variables d'environnement dans `.env` n'étaient pas chargées avant l'import du client Prisma.

**Solution** : Ajouter `dotenv.config()` au tout début du fichier d'entrée (`backend/index.js`) et dans `seed.js`.

### 5.2 PostgreSQL non accessible (connection refused)

**Problème** : Le backend ne pouvait pas se connecter à la base de données.

**Cause** : Le conteneur Docker `visionboard-db` n'était pas démarré.

**Solution** : Démarrer explicitement le conteneur avec :
```bash
docker start visionboard-db
```

### 5.3 Erreur de chemin avec le script de test

**Problème** : Exécuter `node test-api.js` depuis la racine provoquait une erreur `module not found`.

**Cause** : Le script utilisait des chemins relatifs au dossier `backend/`.

**Solution** : Exécuter le script depuis le dossier backend :
```bash
cd backend
node test-api.js
```

### 5.4 Routes des étapes en 404

**Problème** : La création et modification des étapes retournaient une erreur 404.

**Cause** : Les routes `stepRoutes.js` étaient définies avec un chemin de base incorrect et mal montées dans `index.js`.

**Solution** :
- Corriger `stepRoutes.js` pour utiliser des chemins relatifs (`/:id/steps`, `/:id/toggle`)
- Monter `stepRoutes` à la fois sous `/api/goals` (création) et `/api/steps` (modification/suppression)

### 5.5 Erreur Prisma avec `findUnique` sur `conditionKey`

**Problème** : `badgeService.js` plantait avec une erreur Prisma car `findUnique` était utilisé sur `conditionKey` qui n'est pas un champ unique.

**Cause** : `conditionKey` n'était pas défini comme `@unique` dans le schéma.

**Solution** : Remplacer `prisma.badge.findUnique` par `prisma.badge.findFirst` dans `badgeService.js`.

### 5.6 Erreur d'import frontend (`main.jsx` introuvable)

**Problème** : Vite indiquait qu'il ne trouvait pas `src/main.jsx`.

**Cause** : Le fichier d'entrée React s'appelait `Main.jsx` (majuscule) alors que Vite cherchait `main.jsx` (minuscule).

**Solution** : Renommer `src/Main.jsx` en `src/main.jsx` et corriger l'import dans `index.html`.

### 5.7 Fichier `index.css` mal placé

**Problème** : Les styles Tailwind n'étaient pas appliqués et une erreur d'import apparaissait.

**Cause** : Le fichier CSS était à la racine de `frontend/` mais l'import le cherchait dans `src/`.

**Solution** : Déplacer `index.css` dans `src/` ou ajuster l'import dans `main.jsx`.

### 5.8 Fichier `App.jsx` corrompu

**Problème** : Erreur `Identifier 'App' has already been declared`.

**Cause** : Le contenu de `main.jsx` avait été collé dans `App.jsx`, créant une double déclaration du composant `App`.

**Solution** : Séparer proprement :
- `main.jsx` : point d'entrée React + `ReactDOM.createRoot`
- `App.jsx` : composant React avec les routes

### 5.9 Tailwind ne s'affichait pas

**Problème** : Après correction des imports, Tailwind ne produisait aucun style.

**Cause** : Le fichier `postcss.config.js` était absent. Vite ne savait donc pas traiter le CSS avec Tailwind.

**Solution** : Créer `frontend/postcss.config.js` avec les plugins `tailwindcss` et `autoprefixer`.

### 5.10 Création d'objectif impossible

**Problème** : Le formulaire de création d'objectif pouvait être rempli mais le bouton de validation ne fonctionnait pas.

**Cause** : Le bouton `type="submit"` était placé en dehors du formulaire avec l'attribut `form="goal-form"`, ce qui n'est pas toujours fiable selon les navigateurs.

**Solution** :
- Déplacer le bouton de validation à l'intérieur du `<form>`
- Ajouter un état de chargement
- Gérer les erreurs API
- Convertir la date saisie au format ISO avant envoi au backend

---

## 6. Tests automatisés

Le script `backend/test-api.js` permet de tester l'ensemble des endpoints API dans l'ordre suivant :

1. Inscription d'un utilisateur de test
2. Connexion et récupération du token JWT
3. Création d'un objectif
4. Récupération de l'objectif
5. Ajout d'une étape
6. Basculement de l'étape
7. Vérification de l'objectif complété
8. Récupération du tableau de bord
9. Vérification des badges attribués
10. Suppression de l'objectif et de l'utilisateur de test

Exécution :
```bash
cd backend
node test-api.js
```

---

## 7. Commandes utiles

### Démarrer l'environnement
```bash
# Démarrer PostgreSQL
docker start visionboard-db

# Démarrer le backend
cd backend
npm run dev

# Démarrer le frontend
cd frontend
npm run dev
```

### Base de données
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Tests
```bash
cd backend
node test-api.js
```

---

## 8. Fonctionnalités livrées dans le MVP

- [x] Inscription et connexion sécurisées (JWT)
- [x] CRUD complet des objectifs
- [x] CRUD complet des étapes
- [x] Suivi de la progression
- [x] Tableau de bord avec statistiques
- [x] Attribution automatique de badges
- [x] Seed de catégories et badges
- [x] Interface React avec routing
- [x] Design system Tailwind personnalisé
- [x] Tests API automatisés

---

## 9. Reste à faire

- [ ] Upload d'images de couverture pour les objectifs (Cloudinary)
- [ ] Envoi de rappels par email (Nodemailer)
- [ ] Page Profil complète
- [ ] Page Badges complète avec affichage des badges obtenus / non obtenus
- [ ] Navigation active et icônes remplies dans la bottom nav
- [ ] Responsive desktop (grille adaptable)
- [ ] État vide sur le Board quand aucun objectif n'existe
- [ ] Tests unitaires frontend
- [ ] Déploiement (Netlify pour le frontend, Render ou Railway pour le backend)
