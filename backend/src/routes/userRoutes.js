import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;