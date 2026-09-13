# Changelog — Fonctionnalités

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
