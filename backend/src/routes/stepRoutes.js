// Routes des étapes (steps) d'un objectif.
// Montées sur /api/goals ET /api/steps dans index.js : la création se fait
// via /api/goals/:goalId/steps, les autres opérations via /api/steps/:id.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { create, update, toggle, remove } from '../controllers/stepController.js';

const router = Router();

router.post('/:goalId/steps', authenticate, create); // POST /api/goals/:goalId/steps
router.put('/:id', authenticate, update);
router.patch('/:id/toggle', authenticate, toggle);
router.delete('/:id', authenticate, remove);

export default router;
