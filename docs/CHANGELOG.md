# Changelog — Fonctionnalités

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
