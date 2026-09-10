// Routes des objectifs (CRUD). Montées sur /api/goals dans index.js.
// Toutes les routes exigent un token JWT valide (middleware authenticate).
 
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAll, getOne, create, update, remove } from '../controllers/goalController.js';

const router = Router();

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getOne);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

export default router;