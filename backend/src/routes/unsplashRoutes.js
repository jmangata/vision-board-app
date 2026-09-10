// Route de recherche d'images Unsplash pour illustrer les objectifs.
// Montée sur /api/unsplash dans index.js. Authentification requise.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { searchPhotos } from '../services/unsplashService.js';

const router = Router();

// GET /api/unsplash/search?query=... — retourne une liste de photos normalisées
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Query is required' });
    const photos = await searchPhotos(query);
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;