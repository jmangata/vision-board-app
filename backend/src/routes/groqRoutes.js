import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { suggestSteps } from '../services/groqService.js';

const router = Router();

// POST /api/groq/suggestions
router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const steps = await suggestSteps(title, description, category);
    res.json({ steps });
  } catch (err) {
    console.error('Groq suggestion error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;