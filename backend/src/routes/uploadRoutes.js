// Route d'upload d'image vers Cloudinary.
// Montée sur /api/upload dans index.js. Authentification requise.
// Le middleware multer (upload.single) intercepte le fichier multipart
// et le rend disponible dans req.file.
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload, uploadToCloudinary } from '../services/uploadService.js';

const router = Router();

// POST /api/upload/image — champ multipart "image" -> URL Cloudinary
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer);
    res.json({ imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;