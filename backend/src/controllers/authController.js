 
// Controllers pour l'authentification (inscription et connexion)
import bcrypt from 'bcrypt';       // Importe bcrypt pour hacher les mots de passe
import jwt from 'jsonwebtoken';   // Importe JWT pour générer des tokens d'authentification
import { prisma } from '../prisma.js'; // Importe l'instance Prisma pour accéder à la base de données

// === INSCRIPTION (Register) ===
// Crée un nouvel utilisateur, hache le mot de passe et retourne un token JWT
export const register = async (req, res) => {
  try {
    const { email, password, firstname } = req.body; // Récupère les données envoyées dans le body de la requête

    // Vérifie que tous les champs requis sont présents
    if (!email || !password || !firstname) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Vérifie si un utilisateur avec cet email existe déjà en base
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' }); // 409 = Conflict
    }

    // Hache le mot de passe avec bcrypt (10 rounds de salt)
    const passwordHash = await bcrypt.hash(password, 10);

    // Crée l'utilisateur en base avec le mot de passe haché
    const user = await prisma.user.create({
      data: { email, passwordHash, firstname },
    });

    // Génère un token JWT contenant l'ID de l'utilisateur, signé avec le secret du .env
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Expire dans 7 jours par défaut
    );

    // Répond avec le token et les infos de l'utilisateur (sans le mot de passe)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstname: user.firstname },
    });
  } catch (err) {
    // En cas d'erreur interne, renvoie un message d'erreur 500
    res.status(500).json({ message: err.message });
  }
};

// === CONNEXION (Login) ===
// Vérifie les identifiants, compare le mot de passe et retourne un token JWT
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Récupère email et password du body

    // Vérifie que les champs sont présents
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Cherche l'utilisateur en base par son email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // 401 = Unauthorized
    }

    // Compare le mot de passe envoyé avec le hash stocké en base
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Génère un token JWT avec l'ID de l'utilisateur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Répond avec le token et les infos utilisateur (sans le mot de passe)
    res.json({
      token,
      user: { id: user.id, email: user.email, firstname: user.firstname },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};