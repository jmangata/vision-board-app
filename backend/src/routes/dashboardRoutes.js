// Route du tableau de bord : statistiques agrégées de l'utilisateur.
// Montée sur /api/dashboard dans index.js. Authentification requise.
 import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getStats } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', authenticate, getStats);

export default router;
