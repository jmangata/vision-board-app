// Routes des badges : catalogue public + badges de l'utilisateur connecté.
// Montées sur /api/badges dans index.js (la route /me est aussi montée
// sous /api/users via userRoutes si besoin).
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAll, getUserBadges } from '../controllers/badgeController.js';

const router = Router();

router.get('/', getAll);                              // GET /api/badges — catalogue complet
router.get('/me', authenticate, getUserBadges);       // GET /api/badges/me — badges de l'utilisateur (auth requise)

export default router;

