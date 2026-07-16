 import { prisma } from '../prisma.js';
import { checkBadges } from '../services/badgeService.js';
// GET /api/goals — Tous les objectifs de l'utilisateur connecté
export const getAll = async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: {
        category: true,
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/goals/:id — Un objectif avec ses steps
export const getOne = async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        category: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/goals — Créer un objectif
export const create = async (req, res) => {
  try {
    const { title, description, imageUrl, targetDate, categoryId } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        imageUrl,
        targetDate: targetDate ? new Date(targetDate) : null,
        categoryId,
        userId: req.user.id,
      },
      include: { category: true },
    });
    const badgesEarned = await checkBadges(req.user.id);
    res.status(201).json({ ...goal, badgesEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/goals/:id — Modifier un objectif
export const update = async (req, res) => {
  try {
    const { title, description, imageUrl, targetDate, categoryId, status } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        imageUrl,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        categoryId,
        status,
      },
      include: { category: true },
    });
    const badgesEarned = await checkBadges(req.user.id);
    res.json({ ...goal, badgesEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/goals/:id — Supprimer un objectif
export const remove = async (req, res) => {
  try {
    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
