# Plan de soutenance — Titre Professionnel CDA (RNCP37873)

Document de préparation pour l'examen du titre professionnel **Concepteur Développeur d'Applications**, appuyé sur le projet Vision Board App.

Ce document est le support de travail principal. Pour les sessions d'entraînement avec Devin, voir `.devin/skills/preparation-soutenance/SKILL.md`.

---

## 1. Format officiel de l'épreuve

| Épreuve | Forme | Durée |
|---|---|---|
| Présentation d'un projet réalisé en amont | Orale | **40 min** |
| Entretien technique | Orale | **45 min** |
| Questionnaire professionnel | Écrite | 30 min |
| Entretien final | Orale | 20 min |
| **Total** | | **2 h 15** |

Le jury est composé de 2 à 3 professionnels du métier. Il prend connaissance du **dossier de projet imprimé avant** la présentation. Le support attendu est un diaporama.

---

## 2. Les 3 blocs de compétences à couvrir

Le jury doit pouvoir cocher les 11 compétences du référentiel. Toute compétence non couverte par le projet sera testée par un **questionnement complémentaire** en entretien technique.

### BC01 — Développer une application sécurisée

| Compétence | Couverture dans Vision Board |
|---|---|
| Installer et configurer son environnement de travail | Node.js, PostgreSQL via Docker (`visionboard-db`, port 5433), VS Code, Git, `.env.example` |
| Développer des interfaces utilisateur | Web React 18 + Vite + Tailwind (`frontend/src/pages/`, `frontend/src/components/`) ; mobile Expo/React Native (`mobile/src/screens/`) |
| Développer des composants métier | `backend/src/services/badgeService.js`, `backend/src/jobs/reminderJob.js`, `backend/src/controllers/` |
| Contribuer à la gestion d'un projet informatique | Git/GitHub, GitHub Actions, `docs/MVP.md`, `docs/CHANGELOG.md`, `docs/TROUBLESHOOTING.md` |

### BC02 — Concevoir et développer une application sécurisée organisée en couches

| Compétence | Couverture dans Vision Board |
|---|---|
| Analyser les besoins et maquetter une application | `docs/MVP.md`, maquette Clarion Vision, design system Material 3 |
| Définir l'architecture logicielle | Architecture 3 couches : clients (web/mobile) → API REST Express → PostgreSQL via Prisma. Séparation routes / controllers / services |
| Concevoir et mettre en place une base de données relationnelle | `docs/MCD-vision-board.md`, `backend/prisma/schema.prisma`, 3 migrations versionnées |
| Développer des composants d'accès aux données SQL et NoSQL | Prisma ORM (requêtes paramétrées), `backend/src/prisma.js`. **Point faible : pas de NoSQL** — voir §6 |

### BC03 — Préparer le déploiement d'une application sécurisée

| Compétence | Couverture dans Vision Board |
|---|---|
| Préparer et exécuter les plans de tests | Vitest + Supertest, 21 tests (`backend/tests/api.test.js`, `badgeService.test.js`, `streak.test.js`) |
| Préparer et documenter le déploiement | `docs/RAILWAY.md`, `.railway/railway.ts`, `frontend/Dockerfile`, `frontend/Caddyfile` |
| Contribuer à la mise en production dans une démarche DevOps | `.github/workflows/ci.yml`, Wait for CI Railway (`checkSuites`), migrations Prisma en pre-deploy |

---

## 3. Plan minuté de la présentation (40 min)

| # | Section | Durée | Cumul | Compétence visée |
|---|---|---|---|---|
| 1 | Ouverture et présentation personnelle | 2 min | 2 | — |
| 2 | Contexte et expression des besoins | 4 min | 6 | BC02 |
| 3 | Gestion de projet et méthode | 3 min | 9 | BC01 |
| 4 | Maquettage et parcours utilisateur | 3 min | 12 | BC02 |
| 5 | Architecture logicielle en couches | 4 min | 16 | BC02 |
| 6 | Modèle de données et base relationnelle | 4 min | 20 | BC02 |
| 7 | **Démonstration fonctionnelle** | 6 min | 26 | BC01 |
| 8 | Focus interfaces utilisateur | 3 min | 29 | BC01 |
| 9 | Focus composants métier et accès données | 3 min | 32 | BC01 / BC02 |
| 10 | Sécurité (ANSSI, RGPD) | 3 min | 35 | Transverse |
| 11 | Tests et qualité | 2 min | 37 | BC03 |
| 12 | Déploiement et DevOps | 2 min | 39 | BC03 |
| 13 | Bilan et perspectives | 1 min | 40 | — |

### Détail de chaque section

#### 1. Ouverture (2 min)
- Nom, parcours, contexte de la formation.
- Annonce du plan de la présentation.
- Une phrase de pitch : *« Vision Board est une application de suivi d'objectifs personnels avec gamification, déclinée en web et mobile, adossée à une API REST sécurisée. »*

#### 2. Contexte et expression des besoins (4 min)
- Le problème résolu : beaucoup de personnes fixent des objectifs mais abandonnent faute de visualisation et de suivi.
- Cible : particuliers souhaitant structurer leurs projets personnels.
- Besoins fonctionnels : compte sécurisé, objectifs par catégorie, décomposition en étapes, suivi de progression, rappels, gamification.
- Besoins non fonctionnels : sécurité, disponibilité web et mobile, conformité RGPD.
- Contraintes : projet individuel, budget nul (services gratuits), délais de formation.

#### 3. Gestion de projet et méthode (3 min)
- Découpage en lots : MVP d'abord (auth + CRUD objectifs + étapes + dashboard + badges), puis enrichissements (Cloudinary, Unsplash, Groq, emails, mobile).
- Git avec branches de fonctionnalité, PR vers `main`.
- Traçabilité écrite : `docs/MVP.md` pour le périmètre, `docs/CHANGELOG.md` pour les évolutions, `docs/TROUBLESHOOTING.md` pour les incidents.
- Automatisation : la CI bloque tout merge si les tests échouent.

#### 4. Maquettage et parcours utilisateur (3 min)
- Design system : Material 3, police Inter, Material Symbols.
- Montrer 2 ou 3 maquettes et leur rendu final côte à côte.
- Parcours principal : inscription → création d'objectif → ajout d'étapes → progression → badge.
- Adaptations mobile : tabs natives, Safe Areas, cibles tactiles 44 px, `KeyboardAvoidingView`.

#### 5. Architecture logicielle en couches (4 min)

Schéma à afficher :

```
┌──────────────────┐   ┌──────────────────┐
│  Client web      │   │  Client mobile   │   COUCHE PRÉSENTATION
│  React 18 + Vite │   │  Expo / RN       │
│  Tailwind        │   │  React Navigation│
└────────┬─────────┘   └────────┬─────────┘
         │  HTTPS / REST / JWT Bearer
         └────────────┬──────────┘
                      ▼
      ┌────────────────────────────────┐
      │  API REST Node.js / Express    │   COUCHE MÉTIER
      │  routes → controllers → services│
      │  helmet, CORS, rate-limit, JWT │
      └───────────────┬────────────────┘
                      │  Prisma Client
                      ▼
      ┌────────────────────────────────┐
      │  PostgreSQL                    │   COUCHE DONNÉES
      │  7 tables, 3 migrations        │
      └────────────────────────────────┘

Services externes : Cloudinary (images), Unsplash (recherche),
Groq (suggestions IA), SMTP (rappels email)
```

Points à justifier :
- **Pourquoi une API REST séparée ?** Un seul backend sert le web et le mobile ; la logique métier n'est écrite qu'une fois.
- **Séparation routes / controllers / services** : les routes déclarent les endpoints, les controllers valident et orchestrent, les services portent la règle métier réutilisable.
- **Pourquoi `app.js` séparé de `index.js` ?** `app.js` construit l'application Express sans démarrer le serveur, ce qui permet les tests d'intégration Supertest.

#### 6. Modèle de données et base relationnelle (4 min)
- Afficher le MCD (`docs/MCD-vision-board.md`).
- 7 entités : `User`, `Category`, `Goal`, `Step`, `Reminder`, `Badge`, `UserBadge`.
- Relations clés :
  - `User` 1–N `Goal` avec `onDelete: Cascade`
  - `Goal` 1–N `Step` avec `onDelete: Cascade`
  - `User` N–N `Badge` via la table de jointure `UserBadge`
  - Contrainte `@@unique([userId, badgeId])` : un badge ne peut être gagné qu'une fois
- Choix du relationnel : données fortement liées, intégrité référentielle nécessaire, requêtes d'agrégation pour le dashboard.
- Migrations versionnées dans Git : `20260710173317_init`, `20260824162729_add_streak_fields`, `20260919193000_add_password_reset`.

#### 7. Démonstration fonctionnelle (6 min)

Scénario chronométré, à répéter avant le jour J :

1. **Inscription** — montrer la validation du mot de passe fort (12 caractères, lettre, chiffre, caractère spécial).
2. **Création d'objectif** — titre, catégorie, image (Unsplash ou upload Cloudinary).
3. **Suggestion IA** — génération d'étapes via Groq.
4. **Progression** — cocher des étapes, barre de progression, objectif terminé.
5. **Badge** — badge débloqué automatiquement.
6. **Dashboard** — statistiques et streak.
7. **Mobile** — même compte sur Expo, notification locale planifiée.

Prévoir un **plan B** : captures d'écran de chaque écran et une vidéo courte enregistrée la veille.

#### 8. Focus interfaces utilisateur (3 min)
- Web : React Router pour la navigation, composants réutilisables (`GoalCard`, `ProgressBar`, `StepItem`, `CategorySelector`, `ImagePicker`).
- Mobile : React Navigation, `TopBar` commune qui centralise Safe Area et cibles tactiles, `FlatList` pour virtualiser la grille de badges.
- Gestion d'état : `AuthContext` côté mobile, services côté web.
- Instance Axios centralisée (`services/api.js`) avec intercepteur qui injecte le JWT.
- Accessibilité (RGAA) : labels de formulaire, contrastes, libellés d'accessibilité sur les actions mobiles.

#### 9. Focus composants métier et accès aux données (3 min)

Choisir **un** exemple et le dérouler en profondeur. Recommandé : l'attribution des badges.

- `badgeService.checkBadges` est appelé après chaque création ou complétion d'objectif ou d'étape.
- Il compare les compteurs de l'utilisateur aux `conditionKey` des badges.
- Il insère dans `user_badges` sans risque de doublon grâce à la contrainte unique.
- Accès aux données : Prisma génère des requêtes **paramétrées**, ce qui neutralise l'injection SQL.

Second exemple possible : le job de rappels (`reminderJob.js`) avec `node-cron` toutes les 2 h, qui cherche les rappels échus (`nextTriggerAt <= now`), envoie via Nodemailer et recalcule la prochaine échéance.

#### 10. Sécurité (3 min)

À présenter comme une préoccupation constante, référence ANSSI et RGPD.

| Risque | Mesure mise en place | Fichier |
|---|---|---|
| Vol de mots de passe | Hash bcrypt, jamais de clair en base | `authController.js` |
| Fuite des liens de reset | Le token est stocké en SHA-256, pas en clair, expiration 1 h | `schema.prisma`, `authController.js` |
| Énumération de comptes | `forgot-password` répond 200 identique que le compte existe ou non ; login renvoie une erreur générique | `authController.js` |
| Brute-force | `express-rate-limit` : 20 tentatives / 15 min sur `/api/auth`, 200 req / 15 min globalement | `app.js` |
| Injection SQL | Requêtes paramétrées générées par Prisma | `prisma.js` |
| XSS / clickjacking | `helmet` (CSP, X-Frame-Options, nosniff) | `app.js` |
| Requêtes cross-origin non autorisées | CORS restreint à `ALLOWED_ORIGINS` en production | `app.js` |
| Payload volumineux | `express.json({ limit: '1mb' })` | `app.js` |
| Accès aux ressources d'autrui | `authMiddleware` vérifie le JWT, les controllers filtrent par `userId` | `authMiddleware.js` |
| Secrets exposés | `.env` hors Git, `.env.example` documenté, rotation après incident | `.env.example` |

**RGPD** :
- Droit à l'oubli : `DELETE /api/users/me` avec confirmation par mot de passe, cascades Prisma qui effacent toutes les données liées.
- Politique de confidentialité publique sur `/privacy`.
- Minimisation : seuls email, prénom et avatar sont collectés.

#### 11. Tests et qualité (2 min)
- Vitest + Supertest, 21 tests.
- **Tests unitaires** : logique de streak, attribution des badges avec Prisma mocké.
- **Tests d'intégration** : endpoint `/api/health`, validations 400, accès non autorisé 401.
- Exécution automatique en CI sur chaque push et chaque PR.
- Audit de sécurité des dépendances : `npm audit --audit-level=moderate` à 0 vulnérabilité après montée de version de bcrypt, vite, react-router-dom, nodemailer.

#### 12. Déploiement et DevOps (2 min)
- Environnements : local (Docker PostgreSQL port 5433) et production (Railway).
- Infrastructure as Code : `.railway/railway.ts` provisionne PostgreSQL, l'API et le frontend ; `frontend/Dockerfile` décrit le build multi-stage Vite/Caddy.
- Pipeline : push sur `main` → CI (tests backend + build frontend) → Wait for CI Railway → migrations Prisma en pre-deploy → auto-déploiement des services.
- Gestion des secrets : variables d'environnement côté plateforme, jamais dans Git.
- Healthcheck `/api/health` pour valider le démarrage avant routage du trafic.

#### 13. Bilan et perspectives (1 min)
- Compétences consolidées : conception en couches, sécurisation, tests, CI/CD, mobile natif.
- Évolutions identifiées : refresh tokens, Redis pour le rate limiting partagé, notifications push distantes via APNs/FCM, tests end-to-end.

---

## 4. Banque de questions — Entretien technique (45 min)

### 4.1 Environnement de travail (BC01)

**Comment as-tu configuré ton environnement de développement ?**
Node.js 20, PostgreSQL en conteneur Docker (`visionboard-db`, port 5433 pour ne pas entrer en conflit avec une instance locale), Prisma CLI pour les migrations, VS Code, Git. Les variables sensibles sont dans `.env`, non versionné, avec un `.env.example` qui documente chaque clé.

**Pourquoi Docker pour la base ?**
Pour isoler la base, reproduire la version de PostgreSQL utilisée en production et pouvoir réinitialiser l'environnement sans désinstaller quoi que ce soit.

**Comment un nouveau développeur démarre-t-il le projet ?**
Cloner, copier `.env.example` vers `.env`, `docker start visionboard-db`, `npm ci` dans `backend` et `frontend`, `npx prisma migrate dev`, `npx prisma db seed`, puis `npm run dev` de chaque côté.

### 4.2 Interfaces utilisateur (BC01)

**Pourquoi ne pas réutiliser directement les composants React web dans le mobile ?**
React Native rend des vues natives et n'interprète pas le DOM : les composants doivent être dédiés. En revanche l'API, les règles métier et le design system sont partagés.

**Comment gères-tu l'état d'authentification ?**
Le token est stocké dans `localStorage` sur le web et dans `AsyncStorage` sur mobile. Un `AuthContext` expose l'utilisateur et les actions de connexion/déconnexion côté mobile. Un intercepteur Axios ajoute l'en-tête `Authorization: Bearer`.

**Comment protèges-tu les routes côté client ?**
Redirection vers la page de connexion si aucun token n'est présent. C'est une protection d'ergonomie uniquement : la véritable autorisation est côté serveur via `authMiddleware`.

**Qu'as-tu fait pour l'accessibilité ?**
Labels explicites sur les champs, contrastes conformes, cibles tactiles de 44 à 48 px sur mobile, libellés d'accessibilité sur les actions de suppression, navigation clavier sur le web.

**Pourquoi Tailwind ?**
Cohérence du design system via la configuration, pas de CSS mort, rapidité de prototypage. La palette Material 3 est déclarée une fois dans `tailwind.config.js`.

### 4.3 Composants métier (BC01)

**Explique la logique d'attribution des badges.**
`badgeService.checkBadges(userId)` est invoqué après chaque action significative. Il calcule les compteurs de l'utilisateur, compare aux `conditionKey` des badges et crée les lignes manquantes dans `user_badges`. La contrainte `@@unique([userId, badgeId])` garantit l'idempotence.

**Pourquoi avoir mis ça dans un service plutôt que dans un controller ?**
La règle est appelée depuis plusieurs controllers (`goalController`, `stepController`). L'isoler évite la duplication et la rend testable unitairement avec un Prisma mocké.

**Comment fonctionne le calcul du streak ?**
À la connexion, on compare `lastLoginAt` à la date du jour : même jour, on ne change rien ; jour suivant, on incrémente ; au-delà, on réinitialise à 1. C'est couvert par `streak.test.js`.

**Comment les rappels par email sont-ils envoyés ?**
`node-cron` déclenche `reminderJob.js` toutes les 2 h. Le job sélectionne les rappels dont `nextTriggerAt` est passé, envoie l'email via Nodemailer/SMTP, puis recalcule la prochaine échéance selon la fréquence.

**Que se passe-t-il si l'envoi SMTP échoue ?**
L'échec est journalisé sans bloquer la réponse HTTP. C'est un choix assumé : l'indisponibilité d'un service tiers ne doit pas casser le parcours utilisateur.

### 4.4 Gestion de projet (BC01)

**Comment as-tu organisé ton travail ?**
Périmètre MVP défini dans `docs/MVP.md`, puis lots d'enrichissement. Une branche par fonctionnalité, PR vers `main`, CI bloquante.

**Comment assures-tu la traçabilité ?**
Chaque correction ou évolution donne lieu à une entrée documentée : `docs/CHANGELOG.md` pour le fonctionnel, `docs/TROUBLESHOOTING.md` pour les incidents techniques, avec contexte, cause racine, solution, fichiers touchés et méthode de vérification.

**Quelle difficulté t'a le plus appris ?**
Des secrets s'étaient retrouvés dans l'historique Git. J'ai effectué une rotation complète des clés, ajouté `.env` au `.gitignore` et créé `.env.example`. Cela m'a appris à traiter la gestion des secrets dès l'initialisation d'un projet.

### 4.5 Analyse des besoins et maquettage (BC02)

**Comment as-tu identifié les besoins ?**
À partir du constat d'abandon des objectifs personnels, j'ai formalisé les cas d'usage prioritaires, puis je les ai traduits en fonctionnalités MVP et en écrans.

**Comment as-tu priorisé ?**
Par valeur pour l'utilisateur et dépendance technique : authentification d'abord, puis CRUD des objectifs, puis les étapes, puis le suivi, enfin la gamification et les intégrations tierces.

### 4.6 Architecture logicielle (BC02)

**Décris l'architecture de ton application.**
Trois couches. Présentation : clients web React et mobile React Native. Métier : API REST Express organisée en routes, controllers et services, avec les middlewares de sécurité. Données : PostgreSQL accédé exclusivement via Prisma.

**Pourquoi une architecture en couches ?**
Séparation des responsabilités, testabilité, et possibilité de remplacer une couche sans toucher aux autres. Concrètement, ajouter le client mobile n'a demandé aucune modification du backend.

**Pourquoi REST et pas GraphQL ?**
Le besoin est un CRUD avec des agrégations simples. REST est suffisant, plus simple à sécuriser et à mettre en cache, et mieux maîtrisé dans le temps imparti.

**Pourquoi JWT plutôt qu'une session serveur ?**
Authentification stateless : aucun stockage de session côté serveur, et le même token fonctionne pour le web et le mobile. Cela simplifie une éventuelle montée en charge horizontale.

**Quelle est la limite du JWT dans ton implémentation ?**
Il n'y a ni refresh token ni révocation : un token volé reste valable jusqu'à expiration. La correction serait des tokens courts associés à un refresh token, ou une liste de révocation en base.

### 4.7 Base de données relationnelle (BC02)

**Présente ton modèle de données.**
7 tables. `users`, `categories`, `goals`, `steps`, `reminders`, `badges` et la table de jointure `user_badges`. Les clés primaires sont des UUID générés applicativement.

**Pourquoi des UUID plutôt que des entiers auto-incrémentés ?**
Ils ne révèlent ni le volume ni l'ordre de création, ils évitent l'énumération des ressources par incrémentation, et ils peuvent être générés côté client sans aller-retour.

**Comment garantis-tu l'intégrité lors d'une suppression ?**
Par `onDelete: Cascade` sur les relations `User → Goal`, `Goal → Step`, `Goal → Reminder`, `User → Reminder` et sur `UserBadge`. Supprimer un compte efface donc toutes ses données, ce qui sert aussi la conformité RGPD.

**Es-tu en 3e forme normale ?**
Oui. Chaque attribut dépend de la clé primaire de sa table, il n'y a pas de dépendance transitive, et les données répétables sont sorties dans leurs propres tables (`categories`, `badges`).

**Comment gères-tu les évolutions de schéma ?**
Par migrations Prisma versionnées dans Git. En développement `prisma migrate dev`, en production `prisma migrate deploy`, qui applique uniquement les migrations non encore jouées.

**Quels index as-tu ?**
Les clés primaires et les contraintes uniques (`users.email`, `categories.name`, `badges.name`, `user_badges(user_id, badge_id)`) créent des index. Les clés étrangères sont indexées par Prisma. Sur une volumétrie plus importante, j'ajouterais un index sur `reminders.next_trigger_at` car le job de rappels filtre dessus.

### 4.8 Accès aux données SQL et NoSQL (BC02)

**Pourquoi Prisma plutôt que du SQL écrit à la main ?**
Schéma déclaratif versionné, migrations générées, requêtes paramétrées par défaut, typage du client généré, et gestion des relations et cascades sans SQL répétitif.

**Prisma te protège-t-il vraiment de l'injection SQL ?**
Oui pour l'usage standard, car les valeurs sont transmises comme paramètres et non concaténées. La vigilance reste nécessaire si l'on utilise `$queryRawUnsafe`, ce que je n'utilise pas.

**Et si tu avais besoin d'une requête que Prisma ne sait pas exprimer ?**
J'utiliserais `$queryRaw` avec des paramètres liés, jamais de concaténation de chaînes.

**Tu n'as pas de NoSQL dans ce projet. Quand en utiliserais-tu un ?**
Mes données sont fortement relationnelles, donc le relationnel est le bon choix ici. Un NoSQL orienté document comme MongoDB conviendrait pour des données peu structurées ou à schéma variable, par exemple un journal d'activité ou des documents hétérogènes. Un stockage clé-valeur comme Redis serait pertinent ici pour deux besoins concrets : partager le compteur du rate limiter entre plusieurs instances, et mettre en cache les résultats de recherche Unsplash.

> **À travailler** : cette compétence mentionne explicitement « SQL **et** NoSQL ». Prépare une réponse solide, et idéalement une petite réalisation à montrer. Voir §6.

### 4.9 Plans de tests (BC03)

**Comment ton application est-elle testée ?**
21 tests avec Vitest et Supertest. Unitaires sur la logique de streak et l'attribution des badges avec Prisma mocké. Intégration sur les endpoints : santé, validations 400, accès non autorisé 401.

**Pourquoi mocker Prisma dans les tests unitaires ?**
Pour tester la règle métier isolément, sans dépendre d'une base disponible, et pour garder des tests rapides et déterministes.

**Qu'est-ce qui n'est pas testé ?**
Le frontend n'a pas de tests unitaires, seulement la vérification que le build passe. Il n'y a pas de tests end-to-end. Ce serait ma priorité d'amélioration, avec Vitest et React Testing Library sur le web puis Playwright pour les parcours critiques.

**Comment as-tu testé les cas d'erreur ?**
En vérifiant les codes de retour attendus : 400 sur un payload invalide, 401 sans token, et en contrôlant que les messages ne divulguent pas d'information exploitable.

### 4.10 Déploiement et DevOps (BC03)

**Décris ton pipeline.**
Sur push ou PR, la CI installe les dépendances avec `npm ci`, génère le client Prisma, vérifie la syntaxe, exécute les tests backend et construit le frontend. Sur `main`, le CD réutilise cette CI puis déploie le backend, avec application des migrations, avant le frontend.

**Pourquoi déployer le backend avant le frontend ?**
Parce que le backend porte les migrations de base de données. Le frontend ne doit appeler l'API qu'une fois le schéma à jour.

**Où sont les secrets en production ?**
Dans les variables d'environnement de la plateforme d'hébergement, et dans les secrets GitHub pour le token de déploiement. Rien de sensible n'est versionné.

**Comment sais-tu que le déploiement a réussi ?**
Un healthcheck sur `/api/health` doit répondre avant que le trafic soit routé, et je vérifie le parcours de connexion en production.

**Comment reviens-tu en arrière en cas de problème ?**
La plateforme conserve les déploiements précédents et permet un rollback. Côté base, les migrations étant incrémentales, un retour arrière demande une migration corrective, pas une suppression.

**Qu'est-ce que la démarche DevOps dans ton projet ?**
L'automatisation de la chaîne entre le commit et la production, l'infrastructure décrite dans `.railway/railway.ts`, et le fait que Wait for CI empêche tout déploiement tant que les tests GitHub Actions ne sont pas validés.

### 4.11 Questions transverses fréquentes

**Quelle est la partie dont tu es le plus fier ?**
Choisir une réponse et la préparer. Suggestion : le service de badges, parce qu'il est réutilisé par plusieurs controllers, idempotent par construction et couvert par des tests.

**Qu'est-ce que tu refactoriserais aujourd'hui ?**
La validation des entrées, actuellement faite manuellement dans les controllers. Je la centraliserais avec un schéma de validation, ce qui réduirait la duplication et homogénéiserait les messages d'erreur.

**Combien de temps le projet t'a-t-il pris ?**
Préparer une réponse honnête et chiffrée, avec la répartition entre conception, développement backend, frontend, mobile et documentation.

**Qu'aurais-tu fait différemment ?**
Écrire les tests plus tôt, et mettre en place la gestion des secrets dès le premier commit.

**Comment gérerais-tu 10 000 utilisateurs ?**
Rate limiter déporté dans Redis, mise en cache des lectures du dashboard, index supplémentaires sur les colonnes filtrées, pagination des listes, plusieurs instances derrière un répartiteur de charge, et surveillance des requêtes lentes.

---

## 5. Préparation du questionnaire professionnel (30 min)

Épreuve écrite, avec des questions en français **et en anglais**. À réviser :

- Vocabulaire technique anglais : *deployment*, *rollback*, *migration*, *stateless*, *hashing*, *middleware*, *dependency*, *branch*, *merge request*, *test coverage*, *breakpoint*.
- Savoir expliquer en anglais, en deux ou trois phrases : ton architecture, le rôle d'un ORM, la différence entre authentification et autorisation.
- Notions générales : RGPD, ANSSI, RGAA, éco-conception, cycle de vie d'un projet, contrôle de version.

---

## 6. Points faibles identifiés et plan d'action

Analyse honnête des écarts entre le projet et le référentiel.

| Écart | Gravité | Action recommandée |
|---|---|---|
| **Application déployée sur Railway** | Résolu | PostgreSQL, API et frontend sont provisionnés par `.railway/railway.ts`. Wait for CI conditionne les déploiements, les migrations et le seed tournent en pre-deploy, et 4 contrôles automatiques valident santé, SPA et CORS. Preuves : `docs/RAILWAY.md` et `scripts/railway-verify.mjs`. |
| **Aucun composant NoSQL** | Moyenne | La compétence dit « SQL **et** NoSQL ». A minima, préparer la réponse argumentée du §4.8. Idéalement, ajouter Redis pour le cache Unsplash ou le rate limiting : c'est un ajout limité qui coche la case. |
| **Pas de tests frontend** | Moyenne | Ajouter quelques tests React Testing Library sur un composant et un parcours, pour ne pas laisser le plan de tests uniquement côté backend. |
| **Validation des entrées dispersée** | Faible | Assumable si tu sais l'expliquer et proposer la correction. |
| **Pas de refresh token** | Faible | Limite assumée, à présenter comme telle avec la solution connue. |
| **Docs référençant encore Render** | Faible | `docs/SOUTENANCE.md`, `docs/DEPLOYMENT.md` et `docs/conception.md` mentionnent Render. À harmoniser pour éviter une incohérence relevée par le jury. |

---

## 7. Checklist jour J

### Documents
- [ ] Dossier de projet imprimé, remis au jury avant la présentation
- [ ] Diaporama exporté en PDF, sur clé USB et en copie cloud
- [ ] Schéma d'architecture et MCD lisibles en grand format

### Technique
- [x] Application accessible sur Railway : frontend et API validés par `npm run railway:verify`
- [x] Base de production migrée et seedée avec 5 catégories et 5 badges
- [ ] Compte de démonstration créé avec des données adaptées à la soutenance
- [ ] Objectif de démo prérempli avec des étapes et une échéance future
- [ ] Téléphone chargé avec l'app Expo installée et notifications autorisées
- [ ] Captures d'écran et vidéo de secours prêtes
- [ ] `git status` propre, tout commité et poussé

### Oral
- [ ] Présentation répétée en entier, chronomètre en main, au moins deux fois
- [ ] Pitch de 30 secondes su par cœur
- [ ] Une anecdote de difficulté résolue, prête à raconter
- [ ] Réponses préparées sur : NoSQL, déploiement, tests frontend, refresh token
