// Controller du profil utilisateur : consultation et mise à jour du compte
// de l'utilisateur connecté (identité, email, mot de passe).
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';

// GET /api/users/me — Profil de l'utilisateur connecté
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstname: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { goals: true, badges: true } },
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me — Modifier le profil
export const updateProfile = async (req, res) => {
  try {
    const { firstname, email, currentPassword, newPassword } = req.body;
    const updateData = {};

    if (firstname) updateData.firstname = firstname;
    if (email) updateData.email = email;

    // Changement de mot de passe : exige le mot de passe actuel pour
    // empêcher qu'une session volée puisse verrouiller le compte
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel est requis' });
      }
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      // Le nouveau mot de passe est haché avant stockage (10 rounds de salt)
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, firstname: true, avatarUrl: true, createdAt: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};