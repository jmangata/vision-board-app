# Changelog — Fonctionnalités

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
- La recherche `^\s*//` dans `mobile/**/*.js` recense 109 commentaires ciblés ; chaque module actif décrit au minimum sa responsabilité ou ses traitements non évidents.
- `cd mobile && npx expo export --platform android --output-dir dist-check` : export Android réussi.
- `git diff --check` : aucune erreur de formatage bloquante.

### Points de vigilance
- Les fichiers JSON ne permettent pas les commentaires ; leur rôle est documenté dans `docs/conception.md`.
- Un commentaire doit rester synchronisé avec le code. Les descriptions devenues obsolètes doivent être mises à jour lors de la même modification fonctionnelle.
