 import { prisma } from '../prisma.js';
import { checkBadges } from '../services/badgeService.js';

// POST /api/goals/:goalId/steps — Ajouter une étape à un objectif
export const create = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user.id },
    });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const count = await prisma.step.count({ where: { goalId } });

    const step = await prisma.step.create({
      data: {
        title,
        goalId,
        order: count + 1,
      },
    });

    res.status(201).json(step);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/steps/:id — Modifier une étape
export const update = async (req, res) => {
  try {
    const { title } = req.body;

    const step = await prisma.step.findUnique({
      where: { id: req.params.id },
      include: { goal: { select: { userId: true } } },
    });

    if (!step || step.goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Step not found' });
    }

    const updated = await prisma.step.update({
      where: { id: req.params.id },
      data: { title },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/steps/:id/toggle — Cocher / décocher une étape
export const toggle = async (req, res) => {
  try {
    const step = await prisma.step.findUnique({
      where: { id: req.params.id },
      include: { goal: { select: { userId: true } } },
    });

    if (!step || step.goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Step not found' });
    }

    const updated = await prisma.step.update({
      where: { id: req.params.id },
      data: {
        isCompleted: !step.isCompleted,
        completedAt: !step.isCompleted ? new Date() : null,
      },
    });

    if (updated.isCompleted) {
      const goalSteps = await prisma.step.findMany({ where: { goalId: step.goalId } });
      const allCompleted = goalSteps.every((s) => s.isCompleted);
      if (allCompleted) {
        await prisma.goal.update({
          where: { id: step.goalId },
          data: { status: 'completed' },
        });
      }
    }

    const badgesEarned = await checkBadges(req.user.id);
    res.json({ ...updated, badgesEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/steps/:id — Supprimer une étape
export const remove = async (req, res) => {
  try {
    const step = await prisma.step.findUnique({
      where: { id: req.params.id },
      include: { goal: { select: { userId: true } } },
    });

    if (!step || step.goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Step not found' });
    }

    await prisma.step.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Step deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
