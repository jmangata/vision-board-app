import { prisma } from '../prisma.js';

// GET /api/reminders — Rappels de l'utilisateur connecté
export const getAll = async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.id },
      include: { goal: { select: { title: true } } },
      orderBy: { nextTriggerAt: 'asc' },
    });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reminders — Créer un rappel
export const create = async (req, res) => {
  try {
    const { goalId, frequency } = req.body;

    if (!goalId || !frequency) {
      return res.status(400).json({ message: 'goalId and frequency are required' });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user.id },
    });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const nextTriggerAt = new Date();
    if (frequency === 'daily') nextTriggerAt.setDate(nextTriggerAt.getDate() + 1);
    else if (frequency === 'weekly') nextTriggerAt.setDate(nextTriggerAt.getDate() + 7);
    else if (frequency === 'monthly') nextTriggerAt.setMonth(nextTriggerAt.getMonth() + 1);

    const reminder = await prisma.reminder.create({
      data: {
        goalId,
        userId: req.user.id,
        frequency,
        nextTriggerAt,
      },
    });

    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/reminders/:id — Supprimer un rappel
export const remove = async (req, res) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await prisma.reminder.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

