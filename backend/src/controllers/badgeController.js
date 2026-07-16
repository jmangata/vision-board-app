import { prisma } from '../prisma.js';

// GET /api/badges — Tous les badges disponibles
export const getAll = async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(badges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/me/badges — Badges obtenus par l'utilisateur connecté
export const getUserBadges = async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    res.json(userBadges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

