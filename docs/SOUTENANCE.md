# Préparation soutenance — Vision Board App

Aide-mémoire pour la présentation : scénario de démo, questions probables du jury
avec les réponses ancrées dans le code, et checklist du jour J.

## Démonstration web et mobile

### Contexte
La soutenance doit montrer que les clients React et Expo partagent les mêmes données et le même design, sans masquer les adaptations natives.

### Erreur ou comportement attendu
Le mobile ne doit plus être présenté comme une simple déclinaison incomplète : ses onglets Board, Stats, Badges et Profil sont fonctionnels, et ses notifications doivent être qualifiées correctement.

### Cause
Les premiers écrans Expo étaient des placeholders et la différence entre notification locale et push distant n’était pas explicitée dans le support oral.

### Solution apportée
- Fichiers concernés : `mobile/src/components/TopBar.js`, `mobile/src/navigation/AppNavigator.js`, `mobile/src/screens/`, `mobile/src/services/notificationService.js`.
- Démonstration conseillée : ouvrir le même compte sur le web et le mobile, créer un objectif sur mobile, observer la notification immédiate, parcourir les statistiques et badges, puis modifier le profil.
- Justifier les adaptations natives : React Navigation à la place de React Router, tabs natives, Safe Areas, cibles tactiles de 44 px, clavier avec `KeyboardAvoidingView`, `FlatList` pour la grille et permissions système.
- Expliquer qu’une notification locale est planifiée par l’application sur l’appareil. Un push distant est envoyé par un serveur via APNs/FCM ; il n’est pas implémenté. Expo Go SDK 53+ impose un development build EAS pour le push distant, pas pour la logique locale présentée.

### Vérification
Préparer un objectif de démonstration avec une échéance future, autoriser les notifications et tester le parcours complet avant la soutenance sur l’appareil utilisé.

### Points de vigilance
Le téléphone et le backend local doivent être sur un réseau permettant les appels API. Prévoir une vidéo de secours et ne pas présenter le warning Expo Go relatif au push distant comme un échec des notifications locales.

### Questions possibles du jury
- **Pourquoi ne pas réutiliser directement les composants React web ?** React Native rend des vues natives et demande des composants dédiés ; l’API, les règles métier et le design system sont néanmoins partagés.
- **Pourquoi une TopBar commune ?** Elle centralise la Safe Area, les hauteurs, le centrage et les cibles tactiles, ce qui réduit les divergences entre écrans.
- **Pourquoi `FlatList` pour les badges ?** Elle virtualise la liste et conserve de bonnes performances si le catalogue grandit.
- **Les notifications fonctionnent-elles application fermée ?** Les rappels locaux déjà planifiés sont gérés par le système ; aucun message distant ne peut être envoyé par le serveur dans l’implémentation actuelle.

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
