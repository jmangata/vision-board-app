# Préparation soutenance — Vision Board App

Aide-mémoire pour la présentation : scénario de démo, questions probables du jury
avec les réponses ancrées dans le code, et checklist du jour J.

---

## 1. Pitch (30 secondes)

> Vision Board est une application de suivi d'objectifs personnels avec
> gamification. L'utilisateur crée des objectifs découpés en étapes, suit sa
> progression sur un tableau de bord, reçoit des rappels par email et gagne des
> badges. Elle existe en version web (React) et mobile (React Native), adossées
> à une API REST sécurisée (Express + Prisma + PostgreSQL), testée en CI et
> déployée sur Render.

---

## 2. Scénario de démo (~5 min)

1. **Inscription** : créer un compte → montrer la validation (mot de passe fort)
   et le token JWT dans les outils dev / AsyncStorage.
2. **Création d'objectif** : titre, catégorie, image (Unsplash ou upload
   Cloudinary), suggestion d'étapes par IA (Groq).
3. **Progression** : cocher des étapes → barre de progression → objectif terminé.
4. **Badge** : montrer le badge débloqué automatiquement (`checkBadges`).
5. **Dashboard** : statistiques et streak.
6. **Mot de passe oublié** : parcours forgot → email → reset → reconnexion.
7. **RGPD** : page `/privacy` + suppression du compte depuis le profil.
8. **Mobile** (si temps) : montrer l'app Expo sur le même compte.

**Plan B** : captures d'écran de chaque écran + vidéo courte enregistrée la
veille, au cas où Render ou le réseau serait indisponible.

---

## 3. Questions probables du jury

### Architecture

**Pourquoi une API REST séparée des clients ?**
Un backend unique sert le web et le mobile : la logique métier (badges, rappels)
n'est écrite qu'une fois (`backend/src/services/`).

**Pourquoi Prisma plutôt qu'un ORM SQL brut ?**
Schéma déclaratif (`schema.prisma`) versionné par migrations, requêtes
paramétrées (anti-injection SQL), typage généré, cascade de suppression gérée.

**Pourquoi JWT ?**
Authentification stateless : pas de session serveur, le même token fonctionne
pour le web (localStorage) et le mobile (AsyncStorage) via
`Authorization: Bearer`.

### Sécurité

**Comment les mots de passe sont-ils protégés ?**
Hash bcrypt (10 rounds) — jamais stockés en clair. Le hash de reset est lui-même
un SHA-256 du token envoyé par email : une fuite de la base ne permet pas
d'utiliser les liens.

**Et si quelqu'un teste des emails existants ?**
`forgot-password` répond 200 de façon identique que le compte existe ou non
(anti-énumération). Le login répond « Invalid credentials » générique.

**Contre le brute-force ?**
`express-rate-limit` : 20 tentatives / 15 min sur `/api/auth`, 200 req/15 min
sur l'ensemble de l'API.

**CORS ?**
Restreint en production à `ALLOWED_ORIGINS` ; le mobile natif n'envoie pas
d'en-tête Origin et n'est pas impacté.

**RGPD ?**
Droit à l'oubli : `DELETE /api/users/me` avec confirmation par mot de passe ;
les `onDelete: Cascade` Prisma effacent toutes les données liées. Politique de
confidentialité publique sur `/privacy`.

### Choix techniques

**Pourquoi Express ?**
Standard de l'écosystème Node, middlewares riches (helmet, cors, rate-limit),
adapté à une API REST de cette taille.

**Différence entre les deux frontends ?**
Même API, même design system (Material 3, Inter) ; le web utilise
localStorage/React Router, le mobile AsyncStorage/React Navigation.

**Comment les badges sont-ils attribués ?**
`badgeService.checkBadges` est appelé après chaque création/complétion
d'objectif ou d'étape ; il compare les compteurs aux `conditionKey` et insère
dans `user_badges` sans doublon (contrainte unique `@@unique([userId, badgeId])`).

**Les rappels par email ?**
`node-cron` toutes les 2 h : `reminderJob.js` cherche les rappels échus
(`nextTriggerAt <= now`), envoie via Nodemailer/SMTP et recalcule la prochaine
échéance.

### Qualité

**Comment le projet est-il testé ?**
Vitest + Supertest : 21 tests — unitaires (streak, badges avec Prisma mocké) et
intégration (health, validation 400, 401). Exécutés en CI avant déploiement.

**CI/CD ?**
GitHub Actions : CI (syntaxe, tests, build frontend) sur chaque push/PR ; le CD
déploie sur Render via deploy hooks, migrations Prisma appliquées au build
(`prisma migrate deploy` dans `buildCommand`).

### Difficultés (à raconter)

- Secrets commités dans l'historique Git → rotation complète + `.env.example`
  (voir `docs/TROUBLESHOOTING.md`).
- Double montage de `stepRoutes` sur `/api/goals` et `/api/steps` pour servir
  `POST /goals/:id/steps` et `PATCH /steps/:id/toggle`.
- `app.listen` fusionné avec la config Express → extraction dans `app.js` pour
  permettre les tests Supertest.

### Limites assumées

- Rate limiter en mémoire : réinitialisé au redémarrage, non partagé entre
  instances (solution : Redis si montée en charge).
- JWT sans refresh token ni révocation (solution : liste de révocation ou
  tokens courts + refresh).
- Upload d'images confié à Cloudinary (pas de stockage local).

---

## 4. Checklist jour J

- [ ] URL Render du frontend accessible, login fonctionnel en prod
- [ ] `ALLOWED_ORIGINS` défini sur Render (= URL frontend)
- [ ] `FRONTEND_URL` défini sur Render (liens des emails de reset)
- [ ] Secrets régénérés après l'exposition Git (voir TROUBLESHOOTING)
- [ ] Compte de démo créé et base seedée (catégories + badges)
- [ ] Captures/vidéo de secours prêtes
- [ ] `git status` propre, tout commité et poussé
