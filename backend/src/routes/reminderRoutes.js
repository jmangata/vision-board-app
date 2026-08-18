import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getAll, create, remove } from '../controllers/reminderController.js';

const router = Router();

router.get('/', authenticate, getAll);
router.post('/', authenticate, create);
router.delete('/:id', authenticate, remove);

export default router;

