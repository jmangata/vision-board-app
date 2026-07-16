 import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getStats } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', authenticate, getStats);

export default router;
