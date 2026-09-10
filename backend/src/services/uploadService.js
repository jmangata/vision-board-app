// Service d'upload d'images : reçoit un fichier via multer en mémoire et le pousse vers Cloudinary.
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

export async function uploadToCloudinary(buffer) {
  // Utilise un flux (stream) pour envoyer le buffer mémoire directement à Cloudinary.
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
