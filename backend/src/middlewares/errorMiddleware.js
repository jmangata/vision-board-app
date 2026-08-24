import pkg from '@prisma/client';

const { Prisma } = pkg;

// Middleware de gestion centralisée des erreurs Express
// Doit être monté APRÈS toutes les routes avec une signature à 4 paramètres.
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  // Erreurs de validation Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ message: 'Conflit : cette valeur existe déjà.' });
      case 'P2025':
        return res.status(404).json({ message: 'Ressource introuvable.' });
      case 'P2003':
        return res.status(400).json({ message: 'Référence invalide ou ressource liée inexistante.' });
      default:
        return res.status(400).json({ message: 'Erreur de base de données.' });
    }
  }

  // Erreur de validation Zod/Joi ou similaire
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({ message: err.message || 'Données invalides.' });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }

  // Par défaut : 500 sans détails sensibles en production
  const message = process.env.NODE_ENV === 'production'
    ? 'Erreur interne du serveur'
    : err.message || 'Erreur interne du serveur';

  res.status(500).json({ message });
}
