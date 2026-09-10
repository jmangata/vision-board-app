// Routes des rappels email : liste, création et suppression.
// Montées sur /api/reminders dans index.js. Authentification requise.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAll, create, remove } from '../controllers/reminderController.js';

const router = Router();

router.get('/', authenticate, getAll);
router.post('/', authenticate, create);
router.delete('/:id', authenticate, remove);

export default router;

