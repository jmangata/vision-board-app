// Route de suggestions d'étapes via l'IA (Groq).
// Variante de groqRoutes.js montée sur /api/suggestions : même service,
// payload sans le champ "category". Authentification requise.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { suggestSteps } from '../services/groqService.js';

const router = Router();

router.post('/steps', authenticate, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const steps = await suggestSteps(title, description);
    res.json({ steps });
  } catch (err) {
    console.error('Suggestion error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;