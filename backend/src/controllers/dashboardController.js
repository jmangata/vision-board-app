 import { prisma } from '../prisma.js';

// GET /api/dashboard — Statistiques de l'utilisateur connecté
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalGoals, activeGoals, completedGoals, abandonedGoals, totalBadges, goals] =
      await Promise.all([
        prisma.goal.count({ where: { userId } }),
        prisma.goal.count({ where: { userId, status: 'active' } }),
        prisma.goal.count({ where: { userId, status: 'completed' } }),
        prisma.goal.count({ where: { userId, status: 'abandoned' } }),
        prisma.userBadge.count({ where: { userId } }),
        prisma.goal.findMany({
          where: { userId, status: 'active' },
          include: { steps: true, category: true },
          orderBy: { targetDate: 'asc' },
        }),
      ]);

    const completionRate = totalGoals > 0
      ? Math.round((completedGoals / totalGoals) * 100)
      : 0;

    const goalsWithProgress = goals.map((goal) => {
      const total = goal.steps.length;
      const done = goal.steps.filter((s) => s.isCompleted).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        targetDate: goal.targetDate,
        progress,
        totalSteps: total,
        completedSteps: done,
      };
    });

    const urgentGoals = goalsWithProgress.filter((g) => {
      if (!g.targetDate) return false;
      const daysLeft = Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && g.progress < 100;
    });

    res.json({
      totalGoals,
      activeGoals,
      completedGoals,
      abandonedGoals,
      completionRate,
      totalBadges,
      goalsWithProgress,
      urgentGoals,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
