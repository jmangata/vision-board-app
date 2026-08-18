import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { create, update, toggle, remove } from '../controllers/stepController.js';

const router = Router();

router.post('/:goalId/steps', authenticate, create);
router.put('/:id', authenticate, update);
router.patch('/:id/toggle', authenticate, toggle);
router.delete('/:id', authenticate, remove);

export default router;
