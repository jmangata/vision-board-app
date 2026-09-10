# MCD - Vision Board App

## Entités

### USER
- **id** (PK, UUID)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- firstname (VARCHAR)
- avatar_url (VARCHAR, nullable)
- created_at (DATETIME)
- last_login_at (DATETIME, nullable)
- streak_days (INT)

### CATEGORY
- **id** (PK, UUID)
- name (VARCHAR, UNIQUE)
- color (VARCHAR)
- icon (VARCHAR)

### GOAL
- **id** (PK, UUID)
- title (VARCHAR)
- description (TEXT, nullable)
- image_url (VARCHAR, nullable)
- target_date (DATETIME, nullable)
- status (VARCHAR, default: 'active')
- created_at (DATETIME)

### STEP
- **id** (PK, UUID)
- title (VARCHAR)
- is_completed (BOOLEAN)
- order (INT)
- completed_at (DATETIME, nullable)

### REMINDER
- **id** (PK, UUID)
- frequency (VARCHAR)
- next_trigger_at (DATETIME)

### BADGE
- **id** (PK, UUID)
- name (VARCHAR, UNIQUE)
- icon (VARCHAR)
- description (TEXT)
- condition_key (VARCHAR)

---

## Relations et Cardinalités

```
USER ──(0,N)── CREER ──(1,1)──> GOAL
  Un utilisateur crée 0 à N objectifs.
  Un objectif est créé par exactement 1 et 1 seul utilisateur.

CATEGORY ──(0,N)── CLASSER ──(1,1)──> GOAL
  Une catégorie classe 0 à N objectifs.
  Un objectif est classé dans exactement 1 et 1 seule catégorie.

GOAL ──(0,N)── DECOMPOSER ──(1,1)──> STEP
  Un objectif est décomposé en 0 à N étapes.
  Une étape appartient à exactement 1 et 1 seul objectif.

USER ──(0,N)── PLANIFIER ──(1,1)──> REMINDER
  Un utilisateur planifie 0 à N rappels.
  Un rappel est planifié par exactement 1 et 1 seul utilisateur.

GOAL ──(0,N)── DECLENCHER ──(1,1)──> REMINDER
  Un objectif déclenche 0 à N rappels.
  Un rappel concerne exactement 1 et 1 seul objectif.

USER ──(0,N)── OBTENIR ──(0,N)──> BADGE
  Un utilisateur obtient 0 à N badges.
  Un badge est obtenu par 0 à N utilisateurs.
  (Table associative : USER_BADGE avec attribut earned_at)
```

---

## Schéma résumé des cardinalités

```
                      ┌──────────┐
                      │ CATEGORY │
                      └────┬─────┘
                      0,N  │
                           │ CLASSER
                           │
                      1,1  │
┌──────┐  0,N    ┌─────────┴───┐  0,N    ┌──────┐
│ USER ├─────────┤    GOAL     ├─────────┤ STEP │
└──┬───┘  CREER  └──────┬──────┘ DECOMP. └──────┘
   │      1,1           │          1,1
   │                    │ 0,N
   │               DECLENCHER
   │                    │
   │  0,N          1,1  │
   ├──── PLANIFIER ─────┤ REMINDER │
   │        1,1         └──────────┘
   │
   │  0,N              0,N
   ├───── OBTENIR ──────┤ BADGE │
   │                    └───────┘
   │  (table associative USER_BADGE: earned_at)
```

---

## Règles de gestion

1. Un **utilisateur** peut créer plusieurs **objectifs**, chaque objectif appartient à un seul utilisateur.
2. Chaque **objectif** est rattaché à exactement une **catégorie**.
3. Un **objectif** peut être découpé en plusieurs **étapes** ordonnées.
4. Un **rappel** est lié à la fois à un **utilisateur** et à un **objectif**.
5. Un **utilisateur** peut obtenir plusieurs **badges** (relation N:N via USER_BADGE).
6. Un utilisateur ne peut obtenir qu'une seule fois chaque badge (contrainte UNIQUE sur user_id + badge_id).
7. La suppression d'un utilisateur entraîne la suppression en cascade de ses objectifs, rappels et badges obtenus.
8. La suppression d'un objectif entraîne la suppression en cascade de ses étapes et rappels.
