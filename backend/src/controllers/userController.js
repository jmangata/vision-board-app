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

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel est requis' });
      }
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
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