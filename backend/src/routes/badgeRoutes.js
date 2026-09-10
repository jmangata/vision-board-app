// Routes publiques et protégées pour consulter les badges et ceux de l'utilisateur connecté.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAll, getUserBadges } from '../controllers/badgeController.js';

const router = Router();

router.get('/', getAll);
router.get('/me', authenticate, getUserBadges);

export default router;

