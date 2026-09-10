// Fournit l'unique instance PrismaClient utilisée par toute l'application backend.
// Configuration singleton du client Prisma
// Ce fichier est importé dans chaque controller pour accéder à la base de données
import pkg from '@prisma/client'; // Importe le module CommonJS complet
const { PrismaClient } = pkg; // Extrait la classe PrismaClient

// Crée l'instance Prisma : si elle existe déjà en mémoire (globalThis), réutilise-la, sinon la crée
export const prisma = globalThis.__prisma ?? new PrismaClient();
 
// En mode développement (non production), stocke l'instance dans globalThis
// Cela évite de créer une nouvelle connexion à chaque rechargement de nodemon
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}