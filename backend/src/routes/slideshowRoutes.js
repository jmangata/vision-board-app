import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getSlideshow, saveSlideshow } from '../controllers/slideshowController.js';

const router = Router();

router.get('/', authenticate, getSlideshow);
router.put('/', authenticate, saveSlideshow);

export default router;
