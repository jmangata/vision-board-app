# Changelog — Fonctionnalités

## Optimisation responsive du frontend déployé

### Contexte
Le frontend de production Railway paraissait trop agrandi sur ordinateur et sur téléphone, en particulier sur le Board, la navigation, le formulaire de création, les statistiques, les badges et le profil.

### Erreur ou comportement attendu
Sur desktop, le Board et la navigation inférieure perdaient toute largeur maximale dès le breakpoint `md`, ce qui étirait les composants sur toute la fenêtre. Plusieurs pages n'avaient aucun conteneur central et le formulaire de création utilisait des champs et boutons de 80 px de haut. Sur mobile, le navigateur pouvait aussi appliquer un ajustement automatique de taille de texte. L'interface doit conserver une densité lisible, une largeur contrôlée et des cibles tactiles suffisantes sur toutes les tailles d'écran.

### Cause
Les classes responsive utilisaient `md:max-w-none` et `md:max-w-none` sur les éléments structurants, tandis que les pages Dashboard, Badges et Profile ne fixaient aucune largeur maximale. Les contrôles principaux de `CreateGoal.jsx` utilisaient systématiquement `h-20` et `text-lg`. Aucune règle globale `text-size-adjust` ne stabilisait le rendu mobile.

### Solution apportée
- Fichiers concernés : `frontend/index.css`, `frontend/src/components/BottomNav.jsx`, `frontend/src/pages/Board.jsx`, `CreateGoal.jsx`, `Dashboard.jsx`, `Badges.jsx`, `Profile.jsx`, `GoalDetail.jsx`, `docs/CHANGELOG.md`.
- Stabilisation de la taille du texte mobile avec `text-size-adjust: 100%` et suppression du débordement horizontal global.
- Board limité à `max-w-7xl`, navigation desktop à `max-w-5xl` avec hauteur et icônes réduites.
- Dashboard et Badges centrés dans `max-w-5xl`, Profil dans `max-w-2xl`, détail d'objectif dans `max-w-3xl`.
- Dashboard adapté à quatre colonnes sur grand écran.
- Formulaire de création élargi à `max-w-2xl`, avec champs et boutons réduits de 80 à 64 px et espaces verticaux resserrés.

### Vérification
- `npm run build` dans `frontend/` : build Vite 6.4.3 réussi, 110 modules transformés.
- Build Docker de production avec injection de `VITE_API_URL` : réussi.
- Aperçu local disponible sur desktop et via les outils responsive du navigateur.

### Points de vigilance
- Railway ne modifie pas le niveau de zoom du navigateur : si une seule origine paraît encore agrandie, réinitialiser le zoom du navigateur à 100 % (`Ctrl+0`).
- Les tailles tactiles restent supérieures aux 44 px recommandés malgré la réduction visuelle.
- Le renommage du service Railway est traité séparément car remplacer une ressource gérée par l'IaC peut entraîner une interruption temporaire et un changement de domaine.

---

## Automatisation complète du déploiement Railway

### Contexte
Le projet devait pouvoir être déployé sur Railway de manière reproductible, sans recopier manuellement les variables, les domaines et les commandes entre le dépôt et le dashboard.

### Erreur ou comportement attendu
La configuration Railway précédente reposait sur des fichiers `railway.toml` dépréciés et sur un workflow GitHub Actions exécutant `railway up` séparément pour le backend et le frontend. Elle ne provisionnait pas PostgreSQL, ne créait pas les domaines publics et ne disposait d'aucune vérification automatique après déploiement. Le frontend n'avait pas de serveur HTTP de production valide pour Railway.

### Cause
Railway avait été traité comme Render, alors que Railway déploie des conteneurs et que sa configuration projet actuelle repose sur Infrastructure as Code. Les URLs publiques générées par Railway avaient été supposées statiques au lieu d'être découvertes depuis la plateforme.

### Solution apportée
- Fichiers concernés : `.railway/railway.ts`, `frontend/Dockerfile`, `frontend/Caddyfile`, `frontend/.dockerignore`, `backend/package.json`, `package.json`, `package-lock.json`, `scripts/railway-bootstrap.mjs`, `scripts/railway-secrets.mjs`, `scripts/railway-verify.mjs`, `.github/workflows/ci.yml`, `mobile/.env.example`, `mobile/src/screens/LoginScreen.js`, `mobile/src/screens/ProfileScreen.js`, `docs/RAILWAY.md`, `docs/TROUBLESHOOTING.md`, `docs/CHANGELOG.md` ; suppression de `backend/railway.toml`, `frontend/railway.toml` et `.github/workflows/cd-railway.yml`.
- Infrastructure as Code crée et relie PostgreSQL, l'API et le frontend dans un seul projet Railway.
- Caddy sert le build Vite, applique le fallback React Router et expose `/health`.
- Les migrations Prisma s'exécutent en pre-deploy via `npm run`, puis le seed idempotent garantit la présence des catégories et badges de référence.
- `scripts/railway-bootstrap.mjs` automatise le projet, l'infrastructure, les domaines, les secrets, la configuration mobile et les redéploiements.
- `scripts/railway-secrets.mjs` envoie une liste blanche de 11 secrets via stdin.
- `scripts/railway-verify.mjs` valide l'API, le frontend, le fallback SPA et CORS.
- Wait for CI est activé nativement sur les services Railway et la CI s'exécute désormais aussi sur `main`.

### Vérification
- Build et exécution locale du conteneur frontend : OK.
- Routes `/`, `/health`, `/goals/123` et asset JavaScript : OK.
- Injection de `VITE_API_URL` dans le bundle : OK.
- Génération Prisma 5.22.0 : OK.
- 21 tests backend : OK.
- Audit npm racine : 0 vulnérabilité.
- Détection des 11 secrets en mode dry-run, sans fuite de valeur : OK.
- Syntaxe des scripts Node : OK.
- CI GitHub Actions du commit `0b62b716` : succès.
- Déploiements Railway `api` et `web` : statut `SUCCESS`.
- Vérification de production : 4/4 contrôles réussis (healthcheck, racine frontend, fallback SPA, CORS).
- Parcours métier de production : inscription réussie avec JWT, 5 catégories seedées, suppression du compte de test en 204.

### Points de vigilance
- Le provisionnement réel nécessite une authentification personnelle par `npm run railway:login`, puis `npm run railway:bootstrap`.
- Le plan IaC doit être relu avant confirmation : une ressource retirée du fichier peut être supprimée sur Railway.
- Le déploiement n'est considéré terminé qu'après `npm run railway:verify` avec 4 contrôles sur 4 réussis.

---

## Ajout d'un plan de soutenance CDA et d'un skill Devin de préparation

### Contexte
Le projet sert de support à l'examen du titre professionnel Concepteur Développeur d'Applications (RNCP37873). La documentation existante (`docs/SOUTENANCE.md`) couvrait uniquement le scénario de démonstration et quelques questions de jury, sans lien explicite avec les 11 compétences du référentiel ni avec le format réel de l'épreuve.

### Erreur ou comportement attendu
`docs/SOUTENANCE.md` ne permettait pas de vérifier que chaque compétence du référentiel était couverte par le projet, ne proposait aucun minutage pour la présentation de 40 minutes et ne préparait pas l'entretien technique de 45 minutes. Le document mentionnait par ailleurs encore un déploiement sur Render, devenu faux après la migration vers Railway.

### Cause
Le document avait été rédigé avant la consolidation du projet et sans s'appuyer sur le référentiel officiel RNCP37873 (3 blocs de compétences, 11 compétences, épreuve en 4 parties pour 2 h 15).

### Solution apportée
- Fichiers concernés : `docs/SOUTENANCE-CDA.md` (nouveau), `.devin/skills/preparation-soutenance/SKILL.md` (nouveau), `.devin/AGENTS.md`, `docs/CHANGELOG.md`.
- `docs/SOUTENANCE-CDA.md` : plan complet structuré en 7 sections — format officiel de l'épreuve, cartographie des 11 compétences vers les fichiers réels du projet, plan minuté de la présentation de 40 min (13 sections), banque de questions/réponses pour l'entretien technique de 45 min organisée par compétence, préparation du questionnaire professionnel, analyse des points faibles avec plan d'action, checklist du jour J.
- `.devin/skills/preparation-soutenance/SKILL.md` : skill Devin exposant 5 modes de travail (simulation de jury question par question, révision par compétence, relecture du dossier et du diaporama, chronométrage de la présentation, entraînement au questionnaire bilingue). Le skill impose de vérifier chaque affirmation dans le code et fournit un tableau des approximations techniques à corriger systématiquement.
- `.devin/AGENTS.md` : ajout d'une section renvoyant vers le skill et le plan, avec deux règles de fond (ancrage dans le code réel, refus de valider les approximations).

### Vérification
- Le skill `preparation-soutenance` est bien détecté par l'outil de skills et listé comme disponible.
- Les chemins de fichiers cités dans le plan ont été vérifiés dans le dépôt : `backend/src/services/badgeService.js`, `backend/src/jobs/reminderJob.js`, `backend/tests/` (3 fichiers de tests), `backend/prisma/migrations/` (3 migrations), `frontend/src/pages/` (11 pages), `mobile/src/screens/` (8 écrans).
- Le format de l'épreuve a été recoupé avec le référentiel d'évaluation officiel : présentation 40 min, entretien technique 45 min, questionnaire professionnel 30 min, entretien final 20 min.

### Points de vigilance
- Trois écarts par rapport au référentiel sont documentés et doivent être traités avant l'examen : l'application n'est pas déployée en production (compétences 10 et 11), aucun composant NoSQL n'est présent alors que la compétence 8 mentionne « SQL et NoSQL », et le frontend n'a pas de tests unitaires (compétence 9).
- `docs/SOUTENANCE.md`, `docs/DEPLOYMENT.md` et `docs/conception.md` mentionnent encore Render et devront être harmonisés pour éviter une incohérence relevée par le jury.
- `docs/SOUTENANCE.md` est conservé : il reste utile pour le scénario de démonstration et les questions spécifiques au mobile. `docs/SOUTENANCE-CDA.md` est le document de référence pour la structure de l'épreuve.

---

## Migration de l'hébergement de Render vers Railway

### Contexte
Le projet Vision Board était initialement déployé sur Render via un Blueprint (`render.yaml`) et un workflow GitHub Actions utilisant des deploy hooks. L'objectif était de basculer l'hébergement sur Railway tout en conservant une base PostgreSQL managée, un backend Node.js/Express/Prisma et un frontend React/Vite statique.

### Erreur ou comportement attendu
Avant la migration, la configuration Railway était partielle : le frontend disposait d'un `railway.toml` sans `publishDirectory`, ce qui empêchait Railway de servir le build Vite. Le backend utilisait un `buildCommand` implicite qui ne garantissait pas une installation reproductible (`npm ci`). Le déploiement continu reposait sur Render (`cd.yml`) et n'était donc pas adapté à Railway. Enfin, l'application mobile référençait encore l'URL Render pour la réinitialisation du mot de passe et le lien web du profil.

### Cause
- `frontend/railway.toml` ne contenait que la section `[build]`, sans section `[deploy]`.
- `backend/railway.toml` ne précisait pas `npm ci` et laissait Nixpacks gérer l'installation par défaut.
- `.github/workflows/cd.yml` et `render.yaml` étaient spécifiques à Render.
- Les liens web de `mobile/src/screens/LoginScreen.js` et `mobile/src/screens/ProfileScreen.js` étaient hardcodés vers `visionboard-frontend.onrender.com`.

### Solution apportée
- Fichiers concernés : `frontend/railway.toml`, `backend/railway.toml`, `.github/workflows/cd-railway.yml`, `.github/workflows/cd.yml` (supprimé), `render.yaml` (supprimé), `mobile/src/screens/LoginScreen.js`, `mobile/src/screens/ProfileScreen.js`, `docs/RAILWAY.md`, `docs/CHANGELOG.md`.
- `frontend/railway.toml` : ajout de `npm ci` au build et de la section `[deploy]` avec `publishDirectory = "dist"`.
- `backend/railway.toml` : build reproductible via `npm ci && npx prisma generate && npx prisma migrate deploy`, conservation de `startCommand = "node index.js"` et du healthcheck `/api/health`.
- `.github/workflows/cd-railway.yml` : nouveau workflow de CD déclenché sur `main`, réutilisant la CI, puis déployant le backend puis le frontend via la CLI Railway (`railway up --detach`).
- Suppression de `render.yaml` et de `.github/workflows/cd.yml` car Render n'est plus utilisé.
- Mise à jour des liens web mobile vers `https://visionboard-frontend.up.railway.app`.
- Mise à jour complète de `docs/RAILWAY.md` avec la procédure de déploiement Railway, la gestion des secrets, la configuration du CD et les points de vigilance.

### Vérification
- Validation YAML du workflow `.github/workflows/cd-railway.yml` : OK.
- `backend/railway.toml` et `frontend/railway.toml` sont conformes à la syntaxe attendue par Railway.
- La CI (`ci.yml`) n'a pas été modifiée et reste fonctionnelle.
- Les variables d'environnement documentées dans `docs/RAILWAY.md` couvrent tous les secrets applicatifs.

### Points de vigilance
- `DATABASE_URL` doit être configuré dans Railway **avant** le premier déploiement du backend, car les migrations Prisma s'exécutent au build (`npx prisma migrate deploy`).
- Le token `RAILWAY_TOKEN` doit être ajouté aux secrets GitHub pour que le CD fonctionne.
- Les URLs `visionboard-api.up.railway.app` et `visionboard-frontend.up.railway.app` sont des exemples ; adapte-les aux noms réels de tes services Railway.
- Si l'auto-deploy natif Railway est activé, il peut entrer en concurrence avec le workflow CD. Il est recommandé de le désactiver pour les deux services.
- Le workflow CD déploie le backend avant le frontend via `needs: [ci, deploy-backend]`.

---

## Mise à jour des dépendances vulnérables avant déploiement Render

### Contexte
Avant de pousser le déploiement sur Render, un audit des dépendances npm révélait plusieurs vulnérabilités, dont certaines classées critiques ou hautes, dans les dossiers `backend` et `frontend`.

### Erreur ou comportement attendu
Le déploiement pouvait fonctionner avec des versions vulnérables, mais cela exposait l’application à des problèmes de sécurité connus (node-tar, esbuild, nodemailer, etc.). Le dépôt contenait également un dossier `frontend/node_modules` versionné par erreur, ce qui alourdisssait inutilement l’historique Git.

### Cause
- `bcrypt@5` dépendait d’une ancienne version de `node-pre-gyp` elle-même liée à `tar` vulnérable.
- `vite@5` embarquait une version d’esbuild présentant une faille sur le serveur de développement.
- `react-router-dom@6` et `nodemailer@6` comportaient des advisories de sécurité.
- Les `node_modules` avaient été commités accidentellement.

### Solution apportée
- Fichiers concernés : `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md`.
- Mise à jour des dépendances vulnérables avec conservation de la compatibilité constatée par les tests/builds :
  - `backend` : `bcrypt@6.0.0`, `node-cron@4.6.0`, `nodemailer@10.0.10`
  - `frontend` : `vite@6.4.3`, `react-router-dom@7.18.4`
- Suppression du dossier `frontend/node_modules` versionné.

### Vérification
- `cd backend && npm test` : 21 tests passed.
- `cd backend && npm audit --audit-level=moderate` : 0 vulnérabilité.
- `cd frontend && npm run build` : build Vite réussi.
- `cd frontend && npm audit --audit-level=moderate` : 0 vulnérabilité.
- Validation YAML de `render.yaml`, `.github/workflows/cd.yml` et `.github/workflows/ci.yml` : OK.

### Points de vigilance
- Bien que les builds et tests passent, `react-router-dom@7` reste une version majeure. Surveiller les warnings de dépréciation au runtime.
- Les `node_modules` supprimés de l’index Git restent dans l’historique ancien ; la taille du clone ne diminuera que si l’historique est réécrit (non nécessaire ici).

---

## Différenciation du message de bienvenue à la connexion et à l’inscription

### Contexte
Les écrans de connexion et d’inscription préparaient le même message d’accueil, affiché ensuite sur le tableau de bord. Un utilisateur qui vient de créer son compte voyait pourtant un message de retour (« Ravi de te revoir »), ce qui était incohérent avec une première visite.

### Erreur ou comportement attendu
Le message affiché après une inscription devait accueillir explicitement l’utilisateur et l’inciter à créer son premier objectif. Le message affiché après une connexion devait rester un message de retour classique.

### Cause
Les fonctions `prepareWelcome` (web) et `AsyncStorage.setItem('pendingWelcome', ...)` (mobile) ne stockaient aucune information sur l’origine du flux (connexion ou inscription). Le tableau de bord n’avait donc qu’un seul jeu de messages à sa disposition.

### Solution apportée
- Fichiers concernés : `frontend/src/services/authService.js`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/pages/Board.jsx`, `mobile/src/screens/LoginScreen.js`, `mobile/src/screens/RegisterScreen.js`, `mobile/src/screens/BoardScreen.js`.
- Ajout d’un indicateur `isRegister` dans l’objet `pendingWelcome` : `false` lors de la connexion, `true` lors de l’inscription.
- Ajout d’un tableau `firstTimeMessages` dédié aux nouveaux utilisateurs sur le web et sur mobile.
- Le tableau de bord choisit désormais le titre et le tableau de messages en fonction de `welcome.isRegister`.

### Vérification
- S’inscrire : le message affiche un titre de bienvenue et un message adapté à une première connexion.
- Se connecter : le message affiche le titre existant et un message de retour.
- Fermer le message puis recharger la page : `pendingWelcome` est bien consommé une seule fois et n’est pas réaffiché.

### Points de vigilance
- Les anciennes valeurs de `pendingWelcome` sans `isRegister` sont traitées comme des messages de retour (`isRegister` est falsy), ce qui préserve la compatibilité.
- Les deux tableaux de messages doivent conserver le même nombre d’éléments pour que le mécanisme de `variant` reste cohérent.

---

## Amélioration du détail d’objectif mobile

### Contexte
L’écran mobile de détail permettait de changer l’image et de gérer les étapes, mais certaines interactions restaient peu adaptées à un usage tactile.

### Erreur ou comportement attendu
Le changement d’image demandait de saisir une URL, la suppression d’étape utilisait le texte abrégé `Suppr`, et les titres d’étapes étaient limités à une ligne. L’utilisateur doit pouvoir importer une photo native, identifier immédiatement l’action de suppression et lire entièrement une étape longue sans dégrader la carte.

### Cause
Le détail mobile reprenait encore un contrôle d’URL hérité du parcours web et imposait `numberOfLines={1}` aux étapes. L’action de suppression n’utilisait pas l’iconographie Material du reste de l’application.

### Solution apportée
- Fichiers concernés : `mobile/src/screens/GoalDetailScreen.js`, `docs/CHANGELOG.md`.
- Remplacement du champ URL par Expo Image Picker, réutilisation de `uploadImage`, puis association de l’URL Cloudinary retournée à l’objectif.
- Conservation de la recherche Unsplash comme alternative à l’import local.
- Remplacement de `Suppr` par une icône Material `delete-outline`, avec cible tactile de 48 px, retour d’opacité, libellé d’accessibilité et confirmation native existante.
- Suppression de la limite à une ligne et ajout d’un interligne adapté pour afficher entièrement les étapes longues.

### Vérification
- Depuis le détail mobile, choisir une photo, accepter la permission, vérifier son upload puis son affichage sur l’objectif.
- Rechercher et sélectionner une image Unsplash pour vérifier que l’alternative reste fonctionnelle.
- Créer une étape longue, vérifier son retour à la ligne, puis utiliser l’icône de suppression et confirmer l’alerte.
- `cd mobile && npx expo export --platform android --output-dir dist-check` : export Android réussi.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- L’import nécessite la permission de photothèque et un backend configuré pour l’upload Cloudinary.
- Une étape très longue augmente naturellement la hauteur de sa carte ; sa largeur et l’action de suppression restent fixes.
- La suppression reste volontairement protégée par `Alert.alert` afin d’éviter les gestes accidentels.

---

## Documentation interne de l’ensemble du client mobile

### Contexte
Le code Expo devait être compréhensible pendant la maintenance et la soutenance, au-delà de la documentation fonctionnelle déjà présente dans `docs/`.

### Erreur ou comportement attendu
Plusieurs composants et écrans récents ne décrivaient pas encore leur responsabilité, leurs appels API ou leurs choix natifs. Les commentaires devaient expliquer les fonctions et sections importantes sans paraphraser chaque ligne.

### Cause
La priorité précédente portait sur la finalisation fonctionnelle et la compilation Android ; la documentation interne n’avait pas encore été homogénéisée sur tout le dossier `mobile`.

### Solution apportée
- Fichiers concernés : `mobile/App.js`, `mobile/src/components/*.js`, `mobile/src/navigation/AppNavigator.js`, `mobile/src/screens/*.js`, `mobile/src/services/*.js`, `docs/CHANGELOG.md`, `docs/conception.md`.
- Ajout de commentaires ciblés sur les responsabilités des composants, le chargement au focus, la fusion des badges, la validation du profil, les confirmations destructives, les mutations d’objectif et la Safe Area.
- Documentation explicite des quatre fichiers de composants encore réservés à de futures extractions, afin d’éviter qu’ils soient confondus avec les implémentations actives.
- Conservation des commentaires existants et absence de commentaires ligne par ligne inutiles.

### Vérification
- La recherche `^\\s*//` dans `mobile/**/*.js` recense 109 commentaires ciblés ; chaque module actif décrit au minimum sa responsabilité ou ses traitements non évidents.
- `cd mobile && npx expo export --platform android --output-dir dist-check` : export Android réussi.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- Les fichiers JSON ne permettent pas les commentaires ; leur rôle est documenté dans `docs/conception.md`.
- Un commentaire doit rester synchronisé avec le code. Les descriptions devenues obsolètes doivent être mises à jour lors de la même modification fonctionnelle.

---

## Finalisation des écrans principaux de l’application mobile

### Contexte
La version Expo devait reproduire le responsive web pour les quatre onglets principaux et permettre la présentation complète de l’application au jury.

### Erreur ou comportement attendu
Les onglets Statistiques et Badges affichaient des placeholders. Le profil ne permettait pas de modifier le prénom, l’email ou le mot de passe, et les en-têtes n’étaient pas partagés. Les écrans devaient charger les données REST, traiter le chargement et les erreurs, respecter les Safe Areas et conserver une navigation tactile cohérente.

### Cause
Les écrans mobiles avaient été initialisés pour débloquer React Navigation, mais leur raccordement fonctionnel et leur harmonisation avec les composants web n’avaient pas encore été réalisés.

### Solution apportée
- Fichiers concernés : `mobile/src/components/TopBar.js`, `mobile/src/components/BadgeCard.js`, `mobile/src/screens/BoardScreen.js`, `mobile/src/screens/DashboardScreen.js`, `mobile/src/screens/BadgesScreen.js`, `mobile/src/screens/ProfileScreen.js`, `mobile/src/screens/CreateGoalScreen.js`, `mobile/src/screens/GoalDetailScreen.js`, `mobile/src/navigation/AppNavigator.js`.
- Ajout d’un `TopBar` commun avec Safe Area, actions Material facultatives et titre toujours centré.
- Implémentation du dashboard via `GET /api/dashboard`, avec grille 2 × 2, résumé des badges, chargement, erreur et nouvelle tentative.
- Implémentation de la grille de badges via `GET /api/badges` et `GET /api/badges/me`, avec compteur, états obtenu/verrouillé, erreur et liste vide.
- Ajout au profil de l’édition via `PUT /api/users/me`, de la confirmation du nouveau mot de passe et des validations alignées sur l’inscription.
- Harmonisation des en-têtes Board, création et détail, puis adaptation de la tab bar à la Safe Area inférieure.

### Vérification
- `cd mobile && npx expo export --platform android --output-dir dist-check` : export Android réussi.
- `git diff --check` : aucune erreur de formatage bloquante.
- La recette Expo Go restante consiste à parcourir Board, Stats, Badges et Profil, tester les états réseau, modifier le profil puis créer un objectif.
- Vérifier que les mots de passe ne sont jamais affichés ni journalisés.

### Points de vigilance
- L’API réellement exposée pour les badges utilisateur est `/api/badges/me`.
- La validation mobile améliore le retour immédiat, mais le backend demeure l’autorité finale.
- La recette des appels authentifiés nécessite un backend accessible depuis le téléphone.

---

## Notifications locales après création d’un objectif

### Contexte
La création mobile confirme l’enregistrement et programme un rappel la veille de l’échéance à 9 h.

### Erreur ou comportement attendu
La fonctionnalité doit rester locale à l’appareil et ne doit pas être présentée comme une infrastructure de push distant.

### Cause
Expo Notifications couvre à la fois les notifications locales et distantes, ce qui peut créer une ambiguïté lors de la démonstration.

### Solution apportée
- Fichiers concernés : `mobile/App.js`, `mobile/src/services/notificationService.js`, `mobile/src/screens/CreateGoalScreen.js`.
- La permission est demandée au démarrage, le canal Android `reminders` est créé, la confirmation est déclenchée immédiatement et le rappel est planifié localement.
- Aucun token Expo Push, serveur d’envoi ou push distant n’est utilisé.

### Vérification
Créer un objectif avec une échéance suffisamment éloignée, accepter la permission, vérifier la notification immédiate puis contrôler le rappel planifié sur l’appareil.

### Points de vigilance
Expo Go SDK 53+ limite la prise en charge des notifications push distantes. Un development build EAS est requis pour tester ces push, mais pas pour la logique de notifications locales utilisée ici.

## RGPD — droit à l'oubli et réinitialisation du mot de passe

### Contexte
Préparation de la conformité RGPD et complétion du parcours d'authentification :
l'application ne proposait ni suppression de compte, ni récupération de mot de
passe, ni politique de confidentialité.

### Erreur constatée
- Aucun endpoint de suppression de compte (droit à l'oubli non couvert).
- Le lien « Mot de passe oublié » de `Login.jsx` pointait vers `#` (sans effet).
- L'écran `ProfileScreen` mobile était un placeholder sans fonctionnalité.

### Cause
Ces parcours n'avaient pas été implémentés dans le périmètre initial du MVP.

### Solution
- Backend : colonnes `reset_token` / `reset_token_expiry` sur `users`
  (migration `add_password_reset`), endpoints `POST /api/auth/forgot-password`
  et `POST /api/auth/reset-password` (token SHA-256, expiration 1 h, réponse
  neutre anti-énumération), `DELETE /api/users/me` avec confirmation par mot
  de passe — la cascade Prisma supprime objectifs, étapes, rappels et badges.
- Email : `sendPasswordResetEmail` dans `emailService.js`, lien vers
  `FRONTEND_URL/reset-password?token=...`.
- Frontend web : pages `ForgotPassword`, `ResetPassword` et `Privacy`
  (politique de confidentialité), routes ajoutées dans `App.jsx`, liens dans
  `Login.jsx`, bouton « Supprimer mon compte » + lien confidentialité dans
  `Profile.jsx`.
- Mobile : `ProfileScreen` complet (infos, déconnexion, suppression de compte
  avec `Alert.alert` + mot de passe, liens web), lien « Mot de passe oublié ? »
  dans `LoginScreen` ouvrant la page web via `Linking`.
- Tests : 4 cas ajoutés dans `tests/api.test.js` (validation forgot/reset,
  401 sur `DELETE /users/me`).

### Vérification
- `cd backend && npm test` → 21 tests passent.
- `cd frontend && npm run build` → build OK.
- Parcours manuel : Login → « Oublié ? » → email → reset → connexion ;
  Profil → « Supprimer mon compte » → compte et données effacés.

### Points de vigilance
- `FRONTEND_URL` doit être défini sur Render pour que les liens email pointent
  vers le frontend de production.
- L'échec SMTP ne bloque pas la réponse (200 + log serveur) : vérifier les logs
  Render si les emails n'arrivent pas.
- `EXPO_PUBLIC_WEB_URL` permet de surcharger l'URL du site web côté mobile.

---


## Sécurisation de l'API et mise en place des tests automatisés

### Contexte
Préparation du projet pour l'examen : l'API était exposée sans protection
renforcée (CORS ouvert, aucune limitation de débit, pas de headers de sécurité)
et aucun test automatisé n'existait.

### Erreur constatée
- `app.use(cors())` acceptait toutes les origines.
- Aucun rate limiting sur `/api/auth` (brute-force possible).
- Script `test` racine en échec (`"Error: no test specified"`).
- Impossible de tester l'API avec Supertest : `index.js` démarrait le serveur
  à l'import (`app.listen` dans le point d'entrée).

### Cause
La configuration Express et le démarrage du serveur étaient fusionnés dans
`index.js`, et aucune librairie de sécurité ni framework de test n'était installé.

### Solution
- Extraction de la configuration Express dans `backend/app.js` (middlewares +
  routes exportés sans `listen`) ; `index.js` ne fait plus que charger `.env`,
  lancer le cron de rappels et écouter le port.
- Ajout de `helmet` (en-têtes de sécurité) et `express-rate-limit`
  (200 req/15 min global, 20 req/15 min sur `/api/auth`).
- CORS restreint en production via la variable `ALLOWED_ORIGINS`.
- Montage de `suggestionRoutes` sur `/api/suggestions` (route existante non exposée).
- Export de `computeStreakUpdate` dans `authController.js` pour testabilité.
- Tests Vitest + Supertest : `tests/api.test.js` (intégration),
  `tests/streak.test.js` et `tests/badgeService.test.js` (unitaires, Prisma mocké).
- Scripts backend : `npm test`, `npm run test:coverage`.
- CI : étape `npm test` ajoutée au job *Backend checks*.
- Fichiers modifiés : `backend/app.js` (nouveau), `backend/index.js`,
  `backend/package.json`, `backend/.env.example` (nouveau),
  `backend/tests/*` (nouveaux), `.github/workflows/ci.yml`, `README.md` (nouveau),
  `docs/conception.md` (sections Sécurité et Tests).

### Vérification
- `cd backend && npm test` → 17 tests passent (3 fichiers).
- `node -e "import('./app.js')"` → l'application se charge sans erreur.

### Points de vigilance
- `ALLOWED_ORIGINS` doit être renseigné sur Render sinon les appels cross-origin
  seront bloqués en production.
- Les clients mobiles natifs n'envoient pas d'en-tête `Origin` : ils ne sont pas
  affectés par la restriction CORS.
- Le rate limiter est en mémoire : il se réinitialise à chaque redémarrage et ne
  est pas partagé entre plusieurs instances.

---


## Alignement des barres supérieures Expo sur le responsive

### Contexte
Les barres inférieure et supérieures doivent reproduire les dimensions, icônes et typographies du frontend responsive.

### Comportement incorrect
La page Objectifs utilisait encore des icônes Ionicons et le détail affichait les textes `Retour` et `Suppr` au lieu des boutons Material du web. La police native différait également d’Inter.

### Cause
Les premières implémentations Expo utilisaient les composants et polices système par défaut plutôt que les références exactes du frontend.

### Solution
- Chargement des graisses Inter utilisées par le frontend depuis le point d’entrée Expo.
- Application d’Inter aux titres des en-têtes et aux libellés de la navigation inférieure.
- Remplacement du menu et de l’ajout de la page Objectifs par les icônes Material correspondantes.
- Alignement du détail sur un en-tête de contenu de 64 px avec boutons de 40 px, flèche retour et corbeille.
- Conservation de la zone sûre iOS au-dessus des hauteurs de contenu afin d’éviter les chevauchements système.

### Fichiers concernés
- `mobile/App.js`
- `mobile/src/navigation/AppNavigator.js`
- `mobile/src/screens/BoardScreen.js`
- `mobile/src/screens/CreateGoalScreen.js`
- `mobile/src/screens/GoalDetailScreen.js`
- `mobile/package.json`
- `mobile/package-lock.json`
- `docs/CHANGELOG.md`

### Vérification
- Bundle iOS Expo généré avec succès, polices Inter et Material Icons incluses.
- `git diff --check` sans erreur bloquante.

### Points de vigilance
Les zones sûres iOS et Android s’ajoutent à la hauteur visuelle des en-têtes, mais leur zone de contenu conserve exactement la hauteur définie par le responsive web.

---

## Alignement de la création d’objectif Expo sur le responsive web

### Contexte
Le formulaire Expo utilisait encore une composition différente du formulaire responsive web alors que les deux interfaces doivent présenter la même expérience.

### Comportement incorrect
L’ordre des sections, l’en-tête, les cartes de catégories, la sélection d’image et les dimensions des boutons différaient du responsive. L’import depuis la photothèque n’était pas disponible sur mobile.

### Cause
Le premier écran Expo avait été construit à partir d’une maquette mobile distincte plutôt qu’à partir de la structure actuelle du frontend responsive.

### Solution
- Reproduction de l’en-tête de 80 px et du bouton de fermeture Material.
- Alignement exact de l’ordre : titre, description, catégories, image, date, erreur, suggestions et création.
- Champs principaux de 80 px et sections espacées de 32 px.
- Cartes de catégories sur deux colonnes avec icônes Material et sélection bordée.
- Conservation de la catégorie Autre et de la réutilisation insensible à la casse.
- Ajout de l’import depuis la photothèque avec Expo Image Picker et upload Cloudinary.
- Reproduction du panneau Unsplash, de l’aperçu 16:9 et de la suppression d’image.
- Boutons Suggestions et Création de même hauteur, largeur et rayon que sur le web.
- Correction du paramètre de navigation vers le détail après création.
- Ajout de commentaires fonctionnels dans le code mobile.

### Fichiers concernés
- `mobile/src/screens/CreateGoalScreen.js`
- `mobile/src/services/goalService.js`
- `mobile/package.json`
- `mobile/package-lock.json`
- `mobile/app.json`
- `docs/CHANGELOG.md`

### Vérification
- Bundle iOS Expo généré avec succès.
- `git diff --check` sans erreur bloquante.
- `expo-doctor` a uniquement rencontré une indisponibilité réseau TLS pendant son contrôle distant ; aucun problème de bundle local n’a été relevé.

### Points de vigilance
- L’accès à la photothèque doit être accepté par l’utilisateur.
- L’upload nécessite les variables Cloudinary du backend et une API accessible depuis le téléphone.
- La date conserve le format `AAAA-MM-JJ`, React Native ne proposant pas le champ HTML natif `type=date`.

---

## Stabilisation des onglets Expo après authentification

### Contexte
Après une inscription réussie, l’application doit pouvoir monter l’ensemble de la navigation authentifiée avant d’afficher la page Objectifs.

### Comportement incorrect
React Navigation interrompait le rendu avec une erreur indiquant que le composant Dashboard était invalide.

### Cause
Les fichiers des écrans Statistiques, Badges et Profil étaient encore vides, alors qu’ils étaient déjà déclarés comme composants des onglets.

### Solution
Ajout de composants transitoires valides, commentés et visuellement cohérents dans les trois fichiers. Leur contenu fonctionnel sera remplacé progressivement pendant les étapes prévues du plan.

### Fichiers concernés
- `mobile/src/screens/DashboardScreen.js`
- `mobile/src/screens/BadgesScreen.js`
- `mobile/src/screens/ProfileScreen.js`
- `docs/CHANGELOG.md`
- `docs/TROUBLESHOOTING.md`

### Vérification
- Bundle iOS Expo généré avec succès.
- `git diff --check` sans erreur bloquante.

### Points de vigilance
Ces trois écrans sont volontairement transitoires : ils corrigent le démarrage sans anticiper leur future implémentation métier.

---

## Message explicite pour une adresse email déjà utilisée

### Contexte
Lors d’une inscription web ou mobile, l’utilisateur doit comprendre immédiatement pourquoi un compte ne peut pas être créé avec une adresse existante.

### Comportement incorrect
Le backend renvoyait un message anglais et une création simultanée pouvait encore produire une erreur technique liée à la contrainte unique.

### Cause
Le contrôle préalable et la gestion de l’erreur Prisma n’utilisaient pas le même message fonctionnel destiné aux interfaces.

### Solution
- Recherche insensible à la casse avant la création du compte.
- Réponse HTTP 409 avec le message `Cette adresse email est déjà utilisée.`.
- Gestion de la contrainte Prisma `P2002` pour couvrir deux inscriptions simultanées.
- Réutilisation automatique du message backend par les formulaires web et Expo.

### Fichiers concernés
- `backend/src/controllers/authController.js`
- `docs/CHANGELOG.md`

### Vérification
1. Créer un compte avec une adresse valide.
2. Recommencer avec la même adresse, y compris avec une casse différente.
3. Vérifier que le formulaire affiche `Cette adresse email est déjà utilisée.` sans créer de doublon.

### Points de vigilance
La base conserve sa contrainte unique comme protection définitive ; le contrôle préalable sert uniquement à fournir un retour plus rapide et plus lisible.

---

## Validation renforcée de l’inscription web et Expo

### Contexte
Un essai d’inscription depuis Expo restait indéfiniment en chargement et les formulaires n’expliquaient pas suffisamment les formats attendus.

### Comportement incorrect
- Une API mobile inaccessible ne rendait la main qu’après un délai réseau non maîtrisé.
- Une adresse email incorrecte pouvait être envoyée sans message local précis.
- Aucun indicateur n’expliquait la robustesse attendue du mot de passe.
- Le frontend web conservait les erreurs d’inscription en état sans les afficher.

### Cause
Le client Axios mobile n’avait aucun délai maximal, son adresse locale ne correspondait plus au réseau actif et les règles d’inscription n’étaient pas centralement imposées par le backend.

### Solution
- Ajout d’un délai maximal de 10 secondes et de `EXPO_PUBLIC_API_URL` pour configurer l’API mobile.
- Mise à jour de l’adresse locale de secours avec l’adresse détectée par Metro.
- Validation de l’email avant soumission sur web, mobile et backend.
- Exigence d’un mot de passe comportant au moins 12 caractères, une lettre, un chiffre et un caractère spécial.
- Affichage dynamique et intuitif de chaque règle du mot de passe.
- Ajout de messages réseau distincts pour un délai dépassé et une API inaccessible.
- Normalisation des emails en minuscules avant leur enregistrement.

### Fichiers concernés
- `backend/src/controllers/authController.js`
- `frontend/src/pages/Register.jsx`
- `mobile/src/services/api.js`
- `mobile/src/screens/RegisterScreen.js`
- `docs/CHANGELOG.md`
- `docs/TROUBLESHOOTING.md`

### Vérification
- Vérifier une adresse sans domaine : le formulaire doit signaler le format incorrect.
- Vérifier que chaque règle du mot de passe passe visuellement à l’état valide.
- Vérifier que le backend refuse également les données invalides, même sans passer par l’interface.
- Arrêter le backend et soumettre : le chargement doit s’arrêter avec un message explicite après 10 secondes maximum.

### Points de vigilance
- Les comptes existants restent utilisables : les nouvelles règles ne sont appliquées qu’à l’inscription.
- L’adresse IP locale peut changer ; privilégier `EXPO_PUBLIC_API_URL` plutôt que modifier le code à chaque changement de réseau.

---

## Documentation fonctionnelle des écrans Expo modifiés

### Contexte
Les fichiers mobiles récemment harmonisés devaient rester compréhensibles et maintenables pendant la suite de la migration responsive.

### Comportement incorrect
Plusieurs composants et effets importants ne précisaient pas leur rôle, notamment le filtrage des catégories, le rechargement des objectifs et la préparation du message de bienvenue.

### Cause
Les premières implémentations avaient privilégié la mise en place fonctionnelle et visuelle avant la documentation interne du code.

### Solution
Ajout de commentaires ciblés au niveau des composants, états, effets et fonctions métier, sans commenter mécaniquement chaque ligne ni modifier le comportement de l’application.

### Fichiers concernés
- `mobile/src/navigation/AppNavigator.js`
- `mobile/src/screens/LoginScreen.js`
- `mobile/src/screens/RegisterScreen.js`
- `mobile/src/screens/BoardScreen.js`
- `docs/CHANGELOG.md`

### Vérification
- `npx expo export --platform android --output-dir dist-check` : bundle Android généré avec succès.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- Les commentaires doivent expliquer l’intention et les contraintes, pas répéter littéralement le code.
- La même convention sera appliquée aux prochains écrans au moment de leur harmonisation.

---

## Harmonisation de la page Objectifs Expo

### Contexte
La page principale Expo devait reprendre la structure, les filtres et les cartes de la page Objectifs web responsive.

### Comportement incorrect
L’écran mobile initial était vide. Il ne permettait pas d’afficher, filtrer ou ouvrir les objectifs existants, ni de mettre à jour rapidement leurs étapes.

### Cause
Aucune interface mobile complète n’était raccordée aux endpoints des objectifs et des catégories.

### Solution
- Ajout de l’en-tête mobile, du bouton de création et du message de bienvenue.
- Ajout des filtres Tout, Sport, Musique, Voyage, Finance, Lecture et Autre.
- Reproduction de la grille responsive avec un premier objectif mis en avant.
- Ajout des images, catégories, progressions et listes d’étapes dépliables.
- Activation de la validation rapide d’une étape depuis une carte.
- Rechargement automatique des objectifs lorsque l’écran reprend le focus.
- Remplacement des symboles textuels par les icônes natives Ionicons.
- Préparation du message de bienvenue après connexion ou inscription mobile.

### Fichiers concernés
- `mobile/src/screens/BoardScreen.js`
- `mobile/src/screens/LoginScreen.js`
- `mobile/src/screens/RegisterScreen.js`
- `docs/CHANGELOG.md`

### Vérification
- `npx expo export --platform android --output-dir dist-check` : bundle Android généré avec succès.
- Cohérence contrôlée entre le paramètre de navigation de la carte et celui attendu par le détail.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- Le chargement des données nécessite que l’appareil puisse joindre le backend configuré dans `mobile/src/services/api.js`.
- La validation visuelle des cartes, filtres et états vides doit être confirmée sur Expo Go avec des données réelles.

---

## Harmonisation des formulaires Expo de connexion et d’inscription

### Contexte
L’application Expo devait reproduire les formulaires d’authentification de la version web responsive et proposer l’inscription directement depuis le mobile.

### Comportement incorrect
La connexion mobile utilisait une présentation minimale, sans état de chargement ni accès à l’inscription, et aucun écran d’inscription Expo n’était disponible.

### Cause
Seul l’écran de connexion initial avait été raccordé au navigateur mobile, malgré la présence de l’appel API d’inscription dans le service d’authentification.

### Solution
- Alignement de la connexion sur la carte, la palette, le logo, les champs et le bouton du responsive web.
- Ajout de la gestion du clavier, des champs obligatoires, du chargement et des erreurs API.
- Création du formulaire d’inscription avec prénom, email et mot de passe.
- Ajout des liens réciproques Connexion et Inscription dans la navigation non authentifiée.
- Connexion automatique de l’utilisateur après une authentification ou une inscription réussie.

### Fichiers concernés
- `mobile/src/screens/LoginScreen.js`
- `mobile/src/screens/RegisterScreen.js`
- `mobile/src/navigation/AppNavigator.js`
- `docs/CHANGELOG.md`

### Vérification
- `npx expo export --platform android --output-dir dist-check` : bundle Android généré avec succès.
- `git diff --check` : aucune erreur de formatage bloquante.
- La dernière exécution d’`expo-doctor` a rencontré une erreur réseau TLS sur le contrôle distant de la configuration ; l’exécution précédente avait validé 21 contrôles sur 21.

### Points de vigilance
- La connexion et l’inscription métier nécessitent que le téléphone puisse atteindre l’URL du backend configurée dans `mobile/src/services/api.js`.
- La recette visuelle et les deux soumissions doivent être confirmées dans Expo Go sur un appareil.

---

## Harmonisation de la navigation inférieure Expo

### Contexte
La navigation Expo utilisait l’apparence par défaut de React Navigation et ne correspondait pas à la barre inférieure du frontend responsive.

### Comportement incorrect
Les onglets n’avaient pas d’icônes explicites, de palette cohérente avec le web ni de dimensions adaptées à l’identité visuelle de l’application.

### Cause
Aucune configuration visuelle commune n’était fournie au navigateur d’onglets mobile.

### Solution
- Application exacte de la hauteur de 80 px, des couleurs, espacements et tailles typographiques du responsive.
- Ajout des icônes Material identiques au responsive web pour Board, Stats, Badges et Profil.
- Utilisation des libellés mobiles `Board`, `Stats`, `Badges` et `Profil` à la place des libellés desktop.
- Ajout des dépendances Expo Vector Icons et Expo Font compatibles avec le SDK 57.
- Masquage automatique de la barre lorsque le clavier est ouvert.

### Fichiers concernés
- `mobile/src/navigation/AppNavigator.js`
- `mobile/package.json`
- `mobile/package-lock.json`
- `mobile/app.json`
- `docs/CHANGELOG.md`

### Vérification
- `npx expo-doctor` : 21 contrôles sur 21 réussis.
- `npx expo export --platform android --output-dir dist-check` : bundle Android généré avec les polices d’icônes.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- Expo Font est déclaré comme plugin afin que les polices soient disponibles dans les builds natifs.
- La validation visuelle finale doit être effectuée sur un appareil ou un émulateur Android/iOS.

---

## Stabilisation de l’environnement Expo avant harmonisation responsive

### Contexte
L’harmonisation progressive de l’application Expo avec le frontend responsive nécessite un environnement mobile reproductible et vérifiable avant chaque évolution d’écran.

### Comportement incorrect
Le projet mobile pouvait être installé, mais Expo signalait des dépendances natives obligatoires absentes et plusieurs versions incompatibles avec le SDK 57.

### Cause
`react` et `react-native` n’étaient pas déclarés directement, tandis qu’Expo, Expo Notifications et AsyncStorage ne correspondaient pas aux versions attendues par le SDK installé.

### Solution
- Ajout explicite de `react` et `react-native` avec les versions compatibles Expo.
- Alignement d’Expo, Expo Notifications et AsyncStorage sur les versions recommandées pour le SDK 57.
- Création d’un état de référence avant de poursuivre l’harmonisation écran par écran.

### Fichiers concernés
- `mobile/package.json`
- `mobile/package-lock.json`
- `docs/CHANGELOG.md`
- `docs/TROUBLESHOOTING.md`

### Vérification
- `npx expo-doctor` : 21 contrôles sur 21 réussis.
- `npx expo export --platform android --output-dir dist-check` : bundle Android généré avec succès.
- `npm ls --depth=0` : dépendances principales installées et résolues.

### Points de vigilance
- Les alertes `npm audit` restantes proviennent de l’arbre de dépendances et doivent être analysées sans utiliser `npm audit fix --force` afin d’éviter une mise à niveau incompatible.
- Le `projectId` EAS nécessaire aux notifications push reste à configurer séparément.

---

## Mise en place du déploiement continu (CD) sur Render

### Contexte
Le projet disposait d'un workflow CI mais pas de pipeline de déploiement. Chaque mise en production devait être faite manuellement, ce qui ralentissait les itérations et augmentait le risque d'oublier une étape de vérification.

### Implémentation
- Ajout d'un Blueprint Render (`render.yaml`) déclarant la base PostgreSQL, le backend Node.js/Express/Prisma et le frontend React/Vite.
- Création du workflow GitHub Actions `.github/workflows/cd.yml` déclenché sur chaque push vers `main`.
- Le workflow CD réutilise le CI existant via `workflow_call`, puis appelle les *deploy hooks* Render pour déployer d'abord le backend puis le frontend.
- Modification de `.github/workflows/ci.yml` : ajout du déclencheur `workflow_call` et suppression du déclenchement direct sur `main` pour éviter de lancer la CI deux fois.

### Fichiers concernés
- `render.yaml` (nouveau)
- `.github/workflows/cd.yml` (nouveau)
- `.github/workflows/ci.yml` (modifié)
- `docs/DEPLOYMENT.md` (nouveau)
- `docs/CHANGELOG.md` (modifié)

### Vérification
1. Pousser le Blueprint et les workflows sur `main`.
2. Créer un Blueprint Instance dans le dashboard Render à partir du dépôt.
3. Configurer les secrets applicatifs dans Render et les *deploy hooks* dans les secrets GitHub (`RENDER_DEPLOY_HOOK_BACKEND`, `RENDER_DEPLOY_HOOK_FRONTEND`).
4. Pousser un commit sur `main` et vérifier dans l'onglet Actions que le workflow CD passe.
5. Vérifier que `GET /api/health` retourne `{"status":"ok"}` et que le frontend s'affiche correctement.

### Points de vigilance
- Le frontend a besoin de la variable `VITE_API_URL` pointant vers l'URL Render du backend **avec le suffixe `/api`**. Elle doit être configurée manuellement après le premier déploiement backend.
- Les services Render ont `autoDeployTrigger: 'off'` : seuls les *deploy hooks* déclenchent un déploiement. Ne pas activer l'auto-deploy natif sans désactiver le workflow CD.
- L'application mobile (`mobile/`) n'est pas couverte par ce pipeline ; elle nécessite Expo / EAS Build et EAS Update.
- Le plan `starter` est facturant ; le plan `free` peut être utilisé pour tester mais impose des limitations (spin-down du web, durée de vie de la base).

---

## Agrandissement de la navigation inférieure sur le web

### Contexte
La barre de navigation inférieure était adaptée au mobile, mais ses onglets restaient petits et peu confortables sur les écrans web.

### Comportement incorrect
Sur ordinateur, les icônes, libellés et zones cliquables conservaient presque les mêmes dimensions que sur mobile.

### Cause
Le composant utilisait principalement des dimensions communes à toutes les tailles d’écran, sans styles dédiés au breakpoint `md`.

### Solution
- Augmentation de la hauteur de la barre sur les écrans web.
- Agrandissement des zones cliquables, des icônes et des libellés des onglets.
- Ajout d’un fond arrondi sur l’onglet actif et d’un retour visuel au survol.
- Conservation des dimensions mobiles existantes.

### Fichiers concernés
- `frontend/src/components/BottomNav.jsx`
- `docs/CHANGELOG.md`

### Vérification
1. Lancer `npm run build` dans `frontend/`.
2. Sur un écran web, vérifier que les quatre onglets sont plus grands et facilement cliquables.
3. Vérifier que la présentation mobile reste inchangée sous le breakpoint `md`.

### Points de vigilance
- Les dimensions web reposent sur le breakpoint Tailwind `md`.
- Les quatre onglets disposent d’une largeur minimale ; surveiller leur affichage sur les fenêtres proches de 768 px.

---

## Correction de la casse du point d'entrée React (`Main.jsx` → `main.jsx`)

### Contexte
Le fichier point d'entrée React s'appelait `frontend/src/Main.jsx` (M majuscule) alors que `frontend/index.html` chargeait `/src/main.jsx` (m minuscule).

### Erreur constatée
Sur Windows le système de fichiers est insensible à la casse, donc le build fonctionnait localement. Cependant, sur Linux/macOS ou dans un environnement CI, Vite ne trouverait pas le fichier et le build échouerait.

### Cause
Renommage partiel lors d'une correction antérieure.

### Solution
- Renommage de `frontend/src/Main.jsx` en `frontend/src/main.jsx` via `git mv` avec un nom temporaire (pour contourner l'insensibilité à la casse de Windows).
- L'import CSS `../index.css` reste valide car le fichier reste dans `src/`.

### Fichiers concernés
- `frontend/src/Main.jsx` → `frontend/src/main.jsx` (renommé)

### Vérification
1. Lancer `npm run build` dans `frontend/`.
2. Le build doit réussir sans erreur de fichier manquant.
3. Le CI GitHub Actions doit passer sur le runner Ubuntu.

### Points de vigilance
- Vérifier que les imports relatifs dans `main.jsx` n'ont pas été cassés.
- Si d'autres fichiers référencent `Main.jsx`, il faut les corriger ; ici seul `index.html` et Vite l'utilisent.

---

## Implémentation du badge de streak 7 jours (`streak_7`)

### Contexte
Le badge `streak_7` ("Inarrêtable") était documenté dans `docs/conception.md` et présent dans le seed, mais il n'était jamais attribué car la logique de streak n'existait pas.

### Erreur constatée
Aucun utilisateur ne pouvait débloquer le badge de streak 7 jours.

### Cause
- Le modèle `User` ne disposait pas de champs pour stocker la dernière date de connexion ni le nombre de jours de streak.
- Le controller `authController.js` ne mettait pas à jour ces informations lors du login.
- Le service `badgeService.js` ne vérifiait pas la condition `streak_7`.

### Solution
- Ajout des champs `lastLoginAt` (DateTime, nullable) et `streakDays` (Int, default 1) dans le modèle `User` de `prisma/schema.prisma`.
- Création et application d'une migration Prisma `add_streak_fields`.
- Ajout d'une fonction `computeStreakUpdate` dans `authController.js` :
  - connexion le même jour → streak inchangé ;
  - connexion le lendemain → streak incrémenté ;
  - connexion après plus d'un jour → streak réinitialisé à 1.
- Mise à jour de `lastLoginAt` à chaque connexion réussie.
- Initialisation de `streakDays` à 1 et `lastLoginAt` à la date actuelle lors de l'inscription.
- Ajout de la vérification `(user?.streakDays || 0) >= 7` dans `badgeService.checkBadges` pour attribuer `streak_7`.

### Fichiers concernés
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260824162729_add_streak_fields/migration.sql` (généré)
- `backend/src/controllers/authController.js`
- `backend/src/services/badgeService.js`

### Vérification
1. Inscrire un nouvel utilisateur : `streakDays` doit être à 1 et `lastLoginAt` renseigné.
2. Se connecter 7 jours consécutifs (en avançant manuellement `lastLoginAt` ou via des tests).
3. Au 7ème jour, `checkBadges` doit retourner le badge `streak_7`.
4. Sauter un jour doit réinitialiser le streak à 1.

### Points de vigilance
- Le calcul du streak est basé sur la différence en jours entre deux dates UTC.
- Les utilisateurs existants sans `lastLoginAt` commenceront leur streak à leur prochaine connexion.
- Le badge n'est attribué qu'une seule fois par utilisateur grâce à la contrainte unique sur `user_badges`.

---

## Mise en place du CI GitHub Actions

### Contexte
Le projet ne disposait d'aucune vérification automatique du code. Chaque modification devait être testée manuellement, ce qui augmentait le risque de régressions.

### Erreur constatée
Aucun workflow CI n'était configuré. Les builds backend et frontend n'étaient pas vérifiés automatiquement.

### Cause
Absence de configuration GitHub Actions dans le repository.

### Solution
- Création du workflow `.github/workflows/ci.yml`.
- Deux jobs indépendants :
  - **Backend** : installation des dépendances (`npm ci`), génération du client Prisma (`npx prisma generate`), vérification syntaxique des fichiers JS (`node --check`).
  - **Frontend** : installation des dépendances (`npm ci`) et build Vite (`npm run build`).
- Déclenchement automatique sur chaque `push` et chaque `pull_request` vers la branche `main`.

### Fichiers concernés
- `.github/workflows/ci.yml` (nouveau)

### Vérification
1. Pousser sur `main` ou ouvrir une pull request.
2. Vérifier dans l'onglet "Actions" du repository que les deux jobs passent.
3. Si un job échoue, consulter les logs pour identifier le problème.

### Points de vigilance
- Le workflow ne démarre pas le serveur backend (pas besoin de base de données pour le CI actuel).
- Aucun test automatisé n'est lancé car le projet n'en contient pas encore.
- Le CD (déploiement continu) n'est pas inclus et devra être ajouté quand l'hébergement sera choisi.

---

## Règle de documentation des corrections et modifications

### Contexte
Le projet ne disposait pas de procédure formalisée obligeant à documenter chaque correction ou modification. Les connaissances sur les bugs et leurs solutions restaient dispersées ou orales.

### Implémentation
- Création de la compétence Devin `.devin/skills/documenter-corrections/SKILL.md` décrivant la procédure obligatoire.
- Création des règles projet `.devin/AGENTS.md` rendant cette documentation obligatoire.
- Ajout d'une analyse globale des problèmes détectés dans `docs/TROUBLESHOOTING.md` (section "Problèmes identifiés lors de l'analyse globale du code").

### Format attendu pour chaque correction
Chaque correction doit désormais décrire :
- le contexte et l'erreur constatée ;
- la cause racine ;
- la solution et les fichiers modifiés ;
- la méthode de vérification ;
- les points de vigilance.

### Fichiers concernés
- `.devin/skills/documenter-corrections/SKILL.md` (nouveau)
- `.devin/AGENTS.md` (nouveau)
- `docs/TROUBLESHOOTING.md` (complété)

---

## Gestion d'erreur et confirmation sur la suppression d'un objectif

### Contexte
La suppression d'un objectif depuis `GoalDetail.jsx` ne demandait pas de confirmation et ne gérait pas les erreurs serveur.

### Erreur constatée
Un clic accidentel sur la corbeille supprimait immédiatement l'objectif. En cas d'échec côté serveur, l'utilisateur n'avait aucun retour.

### Cause
Le handler `handleDelete` appelait `deleteGoal(id)` puis `navigate('/')` sans `try/catch` ni `window.confirm()`.

### Solution
- Ajout d'une boîte de confirmation `window.confirm('Supprimer cet objectif et toutes ses étapes ?')`.
- Ajout d'un bloc `try/catch` pour afficher l'erreur via l'état `stepError`.

### Fichiers concernés
- `frontend/src/pages/GoalDetail.jsx`

### Vérification
1. Ouvrir le détail d'un objectif.
2. Cliquer sur la corbeille en haut à droite.
3. Annuler : l'objectif reste affiché.
4. Confirmer : l'application revient à la liste.
5. Simuler une erreur serveur : le message d'erreur s'affiche.

### Points de vigilance
- La suppression reste définitive et cascade sur les étapes/rappels (déjà géré par Prisma).

---

## Protection des doublons lors de la création d'une catégorie personnalisée

### Contexte
Lors de la création d'objectif, l'utilisateur peut choisir "Autre" et saisir un nom de catégorie personnalisée. Si ce nom existait déjà, le backend levait une erreur Prisma `P2002`.

### Erreur constatée
Créer deux objectifs avec la même catégorie personnalisée provoquait une erreur 500.

### Cause
Le frontend appelait systématiquement `POST /api/categories` sans vérifier si une catégorie du même nom existait déjà.

### Solution
- Vérification locale dans `CreateGoal.jsx` : si une catégorie portant le même nom (insensible à la casse) existe déjà, son identifiant est réutilisé.
- Sinon, une nouvelle catégorie est créée.
- Le backend gère déjà le conflit `P2002` avec une réponse 409 au cas où la vérification locale échouerait.

### Fichiers concernés
- `frontend/src/pages/CreateGoal.jsx`

### Vérification
1. Créer un objectif avec une catégorie personnalisée "Cuisine".
2. Créer un second objectif avec la catégorie "cuisine".
3. Aucune erreur ne doit survenir ; les deux objectifs partagent la même catégorie.

### Points de vigilance
- La comparaison est insensible à la casse ; cela peut être ajusté si besoin.

---

## Implémentation du composant BadgeCard

### Contexte
Le fichier `frontend/src/components/BadgeCard.jsx` était vide alors que la page `Badges.jsx` dupliquait son rendu.

### Erreur constatée
Composant inutilisable et code dupliqué dans la page Badges.

### Cause
Le composant avait été créé sans implémentation.

### Solution
- Implémentation de `BadgeCard.jsx` : affiche l'icône, le nom, la description et l'état obtenu/non obtenu.
- Refactorisation de `Badges.jsx` pour utiliser `BadgeCard` et supprimer le code dupliqué.

### Fichiers concernés
- `frontend/src/components/BadgeCard.jsx`
- `frontend/src/pages/Badges.jsx`

### Vérification
1. Naviguer vers la page Badges.
2. Les badges obtenus sont colorés, les non obtenus sont grisés.
3. Aucune régression visuelle.

### Points de vigilance
- Le mapping des icônes (`iconMap`) est désormais centralisé dans `BadgeCard.jsx`.

---

## Suppression d'une étape depuis le détail d'un objectif

### Contexte
L'utilisateur ne pouvait pas retirer une étape ajoutée par erreur ou devenue inutile depuis la page de détail d'un objectif. Il était obligé de passer par d'autres moyens (appel API manuel ou suppression/re-création de l'objectif).

### Erreur constatée
Aucune interface n'était prévue pour supprimer une étape dans `frontend/src/pages/GoalDetail.jsx`. Le service `goalService.js` ne disposait pas non plus d'une fonction `deleteStep`.

### Cause
La fonctionnalité de suppression d'étape n'avait pas été intégrée au frontend, bien que le backend expose déjà l'endpoint `DELETE /api/steps/:id`.

### Solution
- Ajout de `deleteStep(id)` dans `frontend/src/services/goalService.js` pour appeler `DELETE /api/steps/:id`.
- Import de `deleteStep` dans `frontend/src/pages/GoalDetail.jsx`.
- Ajout d'un bouton "Supprimer" (icône corbeille) à droite de chaque étape dans la liste.
- Ajout d'une boîte de confirmation `window.confirm('Supprimer cette étape ?')` pour éviter les suppressions accidentelles.
- Ajout d'un état `stepError` et gestion des erreurs pour `handleAddStep`, `handleToggle` et `handleDeleteStep`.
- Utilisation de `e.stopPropagation()` sur le bouton de suppression pour éviter de déclencher le toggle de l'étape en même temps.

### Fichiers concernés
- `frontend/src/services/goalService.js`
- `frontend/src/pages/GoalDetail.jsx`

### Vérification
1. Se connecter et accéder au détail d'un objectif possédant des étapes.
2. Cliquer sur la corbeille à droite d'une étape.
3. Confirmer la suppression : l'étape disparaît et la progression est recalculée.
4. Annuler la confirmation : l'étape reste présente.
5. En cas d'erreur serveur, un message rouge apparaît sous le bloc "Étapes".

### Points de vigilance
- La suppression est définitive (aucune corbeille/annulation).
- Le backend vérifie déjà que l'étape appartient bien à un objectif de l'utilisateur connecté.
- Une amélioration future pourrait être un toast ou une modale de confirmation plus intégrée au design system.

---

## Middleware de gestion d'erreurs centralisée

### Contexte
Le backend ne capturait pas les erreurs inattendues. Le fichier `backend/src/middlewares/errorMiddleware.js` existait mais était vide et non branché.

### Erreur constatée
Les erreurs non catchées (erreurs Prisma, erreurs de validation, etc.) pouvaient faire planter le process ou retourner des réponses peu pertinentes.

### Cause
Le middleware avait été créé sans implémentation et n'était pas monté dans `backend/index.js`.

### Solution
- Implémentation de `errorHandler` dans `backend/src/middlewares/errorMiddleware.js` :
  - gestion des erreurs Prisma connues (`P2002`, `P2025`, `P2003`) avec des codes HTTP appropriés ;
  - gestion des erreurs JWT ;
  - réponse générique 500 en production pour ne pas fuir de stack trace.
- Import et montage du middleware dans `backend/index.js` après toutes les routes.
- Déplacement de la route `/api/health` avant le middleware d'erreur pour conserver son comportement normal.

### Fichiers concernés
- `backend/src/middlewares/errorMiddleware.js`
- `backend/index.js`

### Vérification
1. Démarrer le backend (`cd backend && npm run dev`).
2. Appeler un endpoint avec un ID invalide ou créer un conflit de clé unique.
3. Observer une réponse HTTP structurée (409, 404, 400) au lieu d'une erreur brute 500.

### Points de vigilance
- Les erreurs inconnues continueront à être loguées côté serveur.
- En production, aucun détail de stack n'est renvoyé au client.

---

## Recalcul du statut d'un objectif lors du décochage d'une étape

### Contexte
Le statut d'un objectif était mis à jour uniquement lorsqu'une étape était cochée. Si l'utilisateur décochait une étape après avoir terminé l'objectif, celui-ci restait en statut `completed`.

### Erreur constatée
Un objectif pouvait apparaître comme terminé alors qu'une de ses étapes était de nouveau en cours.

### Cause
Dans `backend/src/controllers/stepController.js`, la mise à jour du statut du goal était conditionnée à `if (updated.isCompleted)`.

### Solution
- Après chaque toggle, recalculer si toutes les étapes sont terminées.
- Si toutes les étapes sont terminées → `status: 'completed'`.
- Sinon → `status: 'active'`.

### Fichiers concernés
- `backend/src/controllers/stepController.js`

### Vérification
1. Créer un objectif avec plusieurs étapes.
2. Cocher toutes les étapes : le statut passe à `completed`.
3. Décocher une étape : le statut repasse à `active`.

### Points de vigilance
- Le statut ne passe jamais automatiquement à `abandoned` ; cette logique reste manuelle.
- Si l'objectif était explicitement passé à `completed` via `PUT /api/goals/:id`, un décochage d'étape le repassera à `active`.

---

## Suppression de la route Groq dupliquée

### Contexte
Deux endpoints proposaient la même fonctionnalité de suggestion d'étapes : `POST /api/groq/suggestions` et `POST /api/suggestions/steps`.

### Erreur constatée
Le frontend n'utilisait que `/api/groq/suggestions`, rendant `/api/suggestions/steps` inutile et source de confusion.

### Cause
Un ancien router (`backend/src/routes/suggestionRoutes.js`) avait été laissé en place après la création de la route `/api/groq`.

### Solution
- Suppression du montage de `suggestionRoutes` dans `backend/index.js`.
- Suppression de l'import de `suggestionRoutes` dans `backend/index.js`.
- Le fichier `backend/src/routes/suggestionRoutes.js` n'est plus utilisé ; il pourra être supprimé après validation.

### Fichiers concernés
- `backend/index.js`

### Vérification
1. Démarrer le backend.
2. Vérifier que `POST /api/groq/suggestions` fonctionne toujours.
3. Vérifier que `POST /api/suggestions/steps` retourne bien une 404.

### Points de vigilance
- Si un autre client utilisait `/api/suggestions/steps`, il faudra le faire migrer vers `/api/groq/suggestions`.

---

## Changement d'image d'un objectif depuis la page de détail

### Contexte
Jusqu'ici, l'image d'un objectif ne pouvait être définie qu'à la création (`CreateGoal.jsx`). Impossible de la modifier une fois l'objectif créé.

### Implémentation

**Fichier modifié** : `frontend/src/pages/GoalDetail.jsx`

- Ajout d'un bouton **"Changer l'image"** superposé à l'image de l'objectif.
- Au clic, affichage d'un panneau proposant deux méthodes :
  - **Upload** d'une image depuis l'appareil (réutilise `uploadImage` de `goalService.js`, qui envoie le fichier vers `/api/upload/image` → Cloudinary).
  - **Recherche Unsplash** (`GET /api/unsplash/search`) avec sélection en un clic parmi les résultats.
- La nouvelle URL d'image est envoyée via `updateGoal(id, { imageUrl })` → `PUT /api/goals/:id` (endpoint déjà existant côté backend, `backend/src/controllers/goalController.js`, aucune modification backend nécessaire).
- L'état local `goal` est mis à jour immédiatement après succès, sans recharger toute la page.

### Synchronisation avec la page d'accueil
Aucune logique de cache/context à gérer : `frontend/src/pages/Board.jsx` (page d'accueil listant les objectifs) refait un `getGoals()` à chaque montage du composant. Comme React Router démonte/remonte les pages lors de la navigation, revenir à l'accueil après modification déclenche automatiquement un fetch frais incluant la nouvelle image.

### Fichiers concernés
- `frontend/src/pages/GoalDetail.jsx` (nouvelle UI + logique de changement d'image)
- Aucune modification de `backend/src/controllers/goalController.js` ni de `frontend/src/pages/Board.jsx` (comportement existant suffisant)

### Ajustement — Position du bouton "Changer l'image"
Position initiale : bas-droite de l'image (`bottom-3 right-3`), jugée peu pratique.
Repositionné en **haut-droite** (`top-3 right-3`) dans `frontend/src/pages/GoalDetail.jsx` pour un rendu moins intrusif, moins proche des boutons d'action en bas.

---

## Remplacement de la catégorie Maison par Sport

### Contexte
La catégorie `Maison`, présente dans la base locale, apparaissait dans les formulaires de création d'objectif web et mobile. Le bouton de suggestion d'étapes du formulaire web avait également changé lors de la refonte visuelle.

### Erreur constatée
La catégorie `Maison` ne correspondait plus aux catégories souhaitées. Le bouton Groq ne reprenait plus son ancien rendu arrondi sur fond gris.

### Cause
`Maison` provenait d'une donnée existante en base et non du seed courant. La refonte de `CreateGoal.jsx` avait remplacé le style historique du bouton de suggestions par un contour pointillé.

### Solution
- `backend/prisma/seed.js` : ajout de la catégorie par défaut `Sport`, avec l'icône `dumbbell` et la couleur `#1565C0`.
- Base locale : renommage de `Maison` en `Sport` en conservant les objectifs associés à la même catégorie.
- `frontend/src/pages/CreateGoal.jsx` : prise en charge de l'icône `fitness_center`, retrait de `Maison` de l'exemple de catégorie personnalisée et restauration du bouton Groq arrondi sur fond gris.
- Les clients web et mobile chargeant les catégories depuis `/api/categories`, le renommage est partagé automatiquement entre les deux interfaces.

### Vérification
1. Ouvrir le formulaire de création sur le web puis sur mobile.
2. Vérifier que `Sport` apparaît et que `Maison` n'apparaît plus.
3. Vérifier que les objectifs précédemment associés à `Maison` sont maintenant associés à `Sport`.
4. Sur le web, vérifier que le bouton `Suggérer des étapes` utilise de nouveau le rendu arrondi sur fond gris.
5. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- Exécuter le seed sur une base neuve crée directement `Sport`.
- Sur une autre base contenant encore `Maison`, il faudra appliquer le même renommage de donnée pour préserver les relations existantes.

---

## Alignement des boutons d'action du formulaire de création

### Contexte
Le formulaire web affiche successivement l'action Groq `Suggérer des étapes` et l'action principale `Créer l'objectif`.

### Erreur constatée
Le bouton de suggestions était moins haut et son texte moins visible que le bouton de création, ce qui déséquilibrait visuellement le bas du formulaire.

### Cause
Le bouton secondaire utilisait une hauteur de `h-12`, tandis que le bouton principal utilisait `h-20` avec une typographie plus grande.

### Solution
- Fichier modifié : `frontend/src/pages/CreateGoal.jsx`.
- Application aux deux boutons de la même largeur, hauteur `h-20`, forme arrondie, taille de texte et alignement centré.
- Conservation d'un fond gris et d'un texte bleu pour identifier la suggestion comme action secondaire.

### Vérification
1. Ouvrir la page `Nouvel Objectif`.
2. Vérifier que les boutons `Suggérer des étapes` et `Créer l'objectif` ont les mêmes dimensions.
3. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- Les couleurs restent volontairement différentes afin de préserver la hiérarchie entre action secondaire et action principale.

---

## Uniformisation des cases des étapes suggérées

### Contexte
Après la génération d'étapes avec Groq, chaque proposition est affichée avec une case permettant de la conserver ou de l'exclure.

### Erreur constatée
Les cases pouvaient sembler de tailles différentes lorsque le texte d'une étape occupait plusieurs lignes, car elles pouvaient être compressées dans le conteneur flexible.

### Cause
Les cases avaient une taille nominale de `20px` mais n'interdisaient pas la réduction flex (`flex-shrink`). Les lignes n'avaient pas non plus de hauteur minimale uniforme.

### Solution
- Fichier modifié : `frontend/src/pages/CreateGoal.jsx`.
- Taille fixe de `24 × 24px` et ajout de `shrink-0` sur toutes les cases.
- Hauteur minimale, espacement et alignement identiques pour chaque ligne d'étape.
- Le texte utilise l'espace restant sans modifier la taille de la case.

### Vérification
1. Générer plusieurs étapes, dont certaines avec un titre long.
2. Vérifier que toutes les cases ont exactement la même taille et restent alignées.
3. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- Le texte long peut passer sur plusieurs lignes, mais la case reste toujours fixée à `24 × 24px`.

---

## Message d'accueil personnalisé après authentification

### Contexte
Après une connexion ou une inscription réussie, l'utilisateur arrive sur la page d'accueil correspondant à l'onglet Objectifs.

### Erreur constatée
L'arrivée sur la page était impersonnelle et ne confirmait pas clairement que la nouvelle session était ouverte. Le comportement attendu est un accueil chaleureux utilisant le prénom et renouvelé à chaque authentification.

### Cause
Le frontend conservait uniquement le JWT retourné par l'API et n'utilisait pas le champ `user.firstname` également présent dans la réponse.

### Solution
- `frontend/src/services/authService.js` : sélection d'une variante différente de la précédente et préparation du message temporaire.
- `frontend/src/pages/Login.jsx` et `frontend/src/pages/Register.jsx` : déclenchement de l'accueil personnalisé après une authentification réussie.
- `frontend/src/pages/Board.jsx` : affichage d'une carte d'accueil personnalisée parmi six formulations différentes.
- Le message est consommé depuis `sessionStorage`, ne s'affiche qu'une fois après l'authentification et peut être fermé manuellement.

### Vérification
1. Se connecter et vérifier qu'un message contenant le prénom apparaît dans l'onglet Objectifs.
2. Actualiser ou revenir sur la page et vérifier que le message ne se répète pas.
3. Se déconnecter puis se reconnecter et vérifier qu'une autre formulation peut être choisie.
4. Répéter le scénario après une nouvelle inscription.
5. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- La variante précédente est conservée localement afin de garantir une formulation différente à la connexion suivante.
- Le prénom provient directement de la réponse authentifiée du backend.

---

## Harmonisation des catégories et fiabilisation du message d'accueil

### Contexte
La version web devait reprendre les catégories du screen mobile et le message personnalisé ne s'affichait pas systématiquement après l'authentification.

### Erreur constatée
Le formulaire web affichait les catégories historiques de la base au lieu de `Sport`, `Musique`, `Voyage`, `Finance` et `Lecture`. La séquence `navigate('/')` suivie immédiatement de `window.location.reload()` pouvait recharger la page avant la finalisation de la navigation React.

### Cause
Les catégories étaient utilisées directement dans l'ordre de l'API. La redirection mélangeait une navigation client asynchrone et un rechargement navigateur immédiat.

### Solution
- `backend/prisma/seed.js` et base locale : harmonisation des catégories principales et conservation des relations existantes lors des renommages.
- `frontend/src/pages/CreateGoal.jsx`, `frontend/src/pages/Board.jsx` et `mobile/src/screens/CreateGoalScreen.js` : filtrage et ordre communs `Sport`, `Musique`, `Voyage`, `Finance`, `Lecture` ; `Autre` reste disponible dans le formulaire web.
- `frontend/src/pages/Login.jsx` et `frontend/src/pages/Register.jsx` : remplacement de la double navigation par `window.location.replace('/')`, après préparation du message.

### Vérification
1. Vérifier l'ordre et les libellés des catégories dans les formulaires web et mobile.
2. Se connecter puis s'inscrire avec un compte de test et vérifier l'affichage immédiat du message sur la page Objectifs.
3. Vérifier que les objectifs existants restent associés à leur catégorie renommée.
4. Exécuter `npm run build` dans `frontend/`.

### Points de vigilance
- Les anciennes catégories non retenues ne sont pas supprimées de la base afin d'éviter toute perte de données.
- Le message reste volontairement affiché une seule fois après chaque authentification.

### Ajustement — filtres desktop et persistance de l'accueil

Le filtre de catégories de `Board.jsx` était limité au mobile par `md:hidden` et la grille desktop parcourait encore `goals` au lieu de `filteredGoals`. Les boutons `Tout`, `Sport`, `Musique`, `Voyage`, `Finance` et `Lecture` sont désormais visibles sur toutes les tailles d'écran et filtrent les deux grilles.

Le message d'accueil est maintenant préparé sous `localStorage.pendingWelcome`, lu lors de l'initialisation de `Board`, puis supprimé seulement après son chargement dans l'état React. Cette séquence évite qu'un remontage de développement ou une navigation ne consomme le message avant son affichage.

Vérification complémentaire : sélectionner chaque filtre sur une largeur desktop, puis se déconnecter et se reconnecter afin de confirmer l'affichage de la carte personnalisée.

### Ajustement — catégorie Autre sur web et mobile

Le filtre `Autre` de `frontend/src/pages/Board.jsx` regroupe désormais tous les objectifs dont la catégorie ne fait pas partie des cinq catégories principales. Le formulaire web conserve la liste complète reçue de l'API pour réutiliser une catégorie personnalisée existante sans provoquer de doublon.

Dans `mobile/src/screens/CreateGoalScreen.js`, une option `Autre` affiche un champ de saisie. Lors de la création, l'application réutilise une catégorie portant déjà ce nom ou la crée via `mobile/src/services/goalService.js`, puis associe l'objectif à son identifiant.

Vérification complémentaire : créer un objectif web puis mobile avec une catégorie personnalisée et confirmer qu'il apparaît sous le filtre `Autre` de la page Objectifs.

---

## Expéditeur email configurable (MAIL_FROM) et script de test SMTP

### Contexte
Passage à Mailjet comme fournisseur SMTP. Mailjet refuse d'envoyer depuis une
adresse dont le domaine n'est pas vérifié (`no-reply@visionboard.app`).

### Erreur constatée
Les emails auraient été rejetés par Mailjet (sender non vérifié), et aucun moyen
simple de tester la config SMTP existait.

### Cause
L'adresse `from` était codée en dur dans `emailService.js` avec un domaine
fictif non vérifiable.

### Solution
- `backend/src/services/emailService.js` : expéditeur lu depuis `MAIL_FROM`
  (fallback `no-reply@visionboard.app`), partagé par les deux fonctions d'envoi.
- `backend/.env.example` + `render.yaml` : variable `MAIL_FROM` documentée.
- `backend/test-email.js` : `node test-email.js [dest]` envoie un email de
  reset et un rappel de test pour valider la config en une commande.

### Vérification
`cd backend && node test-email.js mon@email.com` → `Emails de test envoyés`
et les deux mails arrivent dans la boîte.

### Points de vigilance
- `MAIL_FROM` doit être un expéditeur vérifié dans Mailjet, sinon erreur 400.
- À renseigner aussi sur Render (`visionboard-api` → Environment).

---

## Alignement visuel des pages de réinitialisation de mot de passe

### Contexte
Les pages `ForgotPassword` et `ResetPassword` avaient un style minimal différent
des pages Login/Register (pas de logo, pas de validation en direct).

### Solution
- `ResetPassword.jsx` : refonte sur le modèle de `Register.jsx` — en-tête avec
  logo, checklist des règles de mot de passe validée en direct, champ de
  confirmation avec message d'erreur immédiat si les deux saisies diffèrent
  (`aria-invalid`), soumission bloquée tant que les mots de passe ne
  correspondent pas ou que les règles ne sont pas remplies.
- `ForgotPassword.jsx` : même en-tête/bannière d'erreur, validation du format
  email en direct comme dans Register.

### Vérification
`cd frontend && npm run build` OK ; parcours : lien email → reset → erreur si
mismatch → succès → redirection `/login`.

---

## Notifications locales Expo (rappels d'échéance)

### Contexte
Le package `expo-notifications` était installé mais jamais utilisé :
`notificationService.js` était un fichier vide.

### Solution
- `mobile/src/services/notificationService.js` : handler de notifications au
  premier plan, `initNotifications()` (permission + canal Android "reminders"),
  `scheduleGoalReminder(goal)` qui planifie une notification locale la veille
  de l'échéance à 9h00, `cancelGoalReminder()`.
- `mobile/App.js` : `initNotifications()` au montage pour demander la permission.
- `mobile/src/screens/CreateGoalScreen.js` : appel de `scheduleGoalReminder`
  après création d'un objectif ayant une `targetDate`.

### Vérification
Créer un objectif avec une date d'échéance future dans l'app Expo → la
notification est planifiée (vérifiable via
`Notifications.getAllScheduledNotificationsAsync()`).

### Points de vigilance
- Notifications **locales** : elles fonctionnent même hors ligne et sans
  serveur push ; elles disparaissent si l'app est désinstallée.
- Les vraies notifications push distantes (Expo Push Service) nécessiteraient
  un `projectId` EAS et un backend d'envoi — non requis pour le MVP.
