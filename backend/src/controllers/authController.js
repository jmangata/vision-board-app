 
// Controllers pour l'authentification (inscription et connexion).
// Gère l'enregistrement, la connexion, le hachage des mots de passe,
// la génération de JWT et la mise à jour du streak de connexion.
import bcrypt from 'bcrypt';       // Importe bcrypt pour hacher les mots de passe
import jwt from 'jsonwebtoken';   // Importe JWT pour générer des tokens d'authentification
import crypto from 'crypto';      // Génère et hache les tokens de réinitialisation
import { prisma } from '../prisma.js'; // Importe l'instance Prisma pour accéder à la base de données
import { sendPasswordResetEmail } from '../services/emailService.js';

// Règles partagées par toutes les interfaces lors de la création d'un compte.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{12,}$/;

// Calcule le nombre de jours de streak à partir de la dernière connexion
// Exporté pour être testable unitairement (tests/streak.test.js).
export function computeStreakUpdate(lastLoginAt, currentStreakDays) {
  const now = new Date();
  if (!lastLoginAt) {
    return { streakDays: Math.max(currentStreakDays || 1, 1), lastLoginAt: now };
  }

  const last = new Date(lastLoginAt);
  const diffTime = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Déjà connecté aujourd'hui, on ne change rien
    return { streakDays: undefined, lastLoginAt: undefined };
  }
  if (diffDays === 1) {
    // Connexion le lendemain, on incrémente
    return { streakDays: (currentStreakDays || 1) + 1, lastLoginAt: now };
  }
  // Plus d'un jour d'écart, on réinitialise
  return { streakDays: 1, lastLoginAt: now };
}

// === INSCRIPTION (Register) ===
// Crée un nouvel utilisateur, hache le mot de passe et retourne un token JWT
export const register = async (req, res) => {
  try {
    const { email, password, firstname } = req.body; // Récupère les données envoyées dans le body de la requête

    // Vérifie que tous les champs requis sont présents
    if (!email || !password || !firstname) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "L'adresse email n'est pas valide." });
    }
    if (!passwordPattern.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères, une lettre, un chiffre et un caractère spécial.' });
    }

    // Vérifie si un utilisateur avec cet email existe déjà en base
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(409).json({ message: 'Cette adresse email est déjà utilisée.' }); // 409 = Conflict
    }

    // Hache le mot de passe avec bcrypt (10 rounds de salt)
    const passwordHash = await bcrypt.hash(password, 10);

    // Crée l'utilisateur en base avec le mot de passe haché
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, firstname: firstname.trim(), streakDays: 1, lastLoginAt: new Date() },
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
    // La contrainte unique protège aussi contre deux inscriptions simultanées.
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Cette adresse email est déjà utilisée.' });
    }
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

    // Met à jour le streak de connexion
    const streakUpdate = computeStreakUpdate(user.lastLoginAt, user.streakDays);
    if (streakUpdate.lastLoginAt || streakUpdate.streakDays !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(streakUpdate.lastLoginAt && { lastLoginAt: streakUpdate.lastLoginAt }),
          ...(streakUpdate.streakDays !== undefined && { streakDays: streakUpdate.streakDays }),
        },
      });
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
// === MOT DE PASSE OUBLIÉ (Forgot password) ===
// Génère un token de réinitialisation, en stocke le hash SHA-256 en base (jamais
// le token en clair) et envoie le lien par email. Répond toujours 200, même si
// l'email est inconnu, pour ne pas permettre l'énumération des comptes.
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "L'adresse email est requise." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Anti-énumération : réponse identique que le compte existe ou non.
    if (!user) {
      return res.json({ message: 'Si un compte existe, un email de réinitialisation a été envoyé.' });
    }

    // Token aléatoire envoyé par email ; seul son hash est persisté (comme un mot de passe).
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // valide 1 heure
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      // L'échec SMTP ne doit pas fuiter d'information au client : on loggue seulement.
      console.error('[Email] Échec envoi reset password:', mailErr.message);
    }

    res.json({ message: 'Si un compte existe, un email de réinitialisation a été envoyé.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === RÉINITIALISATION DU MOT DE PASSE (Reset password) ===
// Vérifie le token (comparé sous forme hashée) et son expiration, applique les
// règles de complexité puis remplace le hash du mot de passe.
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
    }
    if (!passwordPattern.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères, une lettre, un chiffre et un caractère spécial.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }, // token non expiré
      },
    });
    if (!user) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré.' });
    }

    // Remplace le mot de passe et invalide le token (usage unique).
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
