// Routes protégées du profil utilisateur.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile, deleteAccount } from '../controllers/userController.js';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
// Suppression du compte avec confirmation par mot de passe (droit à l'oubli RGPD)
router.delete('/me', authenticate, deleteAccount);

export default router;