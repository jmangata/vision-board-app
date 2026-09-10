// Service d'upload d'images vers Cloudinary.
// Le fichier est reçu en mémoire via multer (jamais écrit sur disque),
// puis streamé vers Cloudinary qui retourne une URL publique sécurisée.
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary avec les variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utilise la mémoire pour stocker temporairement le fichier
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Envoie le buffer de l'image vers le dossier "vision-board" de Cloudinary
// et résout avec l'URL HTTPS (secure_url) de l'image hébergée
export async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vision-board' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
} 
