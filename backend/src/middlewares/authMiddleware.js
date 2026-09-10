 
// Middleware d'authentification JWT.
// Vérifie le token Bearer de chaque requête protégée, charge l'utilisateur
// correspondant depuis la base et le rend disponible via req.user.
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
 
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
 
    // Extrait le token du header "Authorization: Bearer <token>"
    const token = authHeader.split(' ')[1];
    // Lève une erreur si le token est invalide ou expiré (capturée dans le catch)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    // Vérifie que l'utilisateur du token existe toujours en base
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstname: true },
    });
 
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }
 
    // Injecte l'utilisateur dans la requête pour les controllers suivants
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};