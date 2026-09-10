// Service de gamification : détermine quels badges un utilisateur vient de débloquer
// et les enregistre sans doublon grâce à la table de jointure UserBadge.
import { prisma } from '../prisma.js';

export async function checkBadges(userId) {
  const badgesEarned = [];

  const [totalGoals, completedGoals, categories, user] = await Promise.all([
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: 'completed' } }),
    // groupBy compte les catégories distinctes utilisées par l'utilisateur (badge Explorateur).
    prisma.goal.groupBy({
      by: ['categoryId'],
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true },
    }),
  ]);

  // Vérifie si l'utilisateur possède déjà le badge correspondant à une condition.
  const hasBadge = async (conditionKey) => {
    const badge = await prisma.badge.findFirst({ where: { conditionKey } });
    if (!badge) return false;
    const existing = await prisma.userBadge.findFirst({
      where: { userId, badgeId: badge.id },
    });
    return !!existing;
  };

  // Débloque un badge et l'ajoute à la liste des nouveaux badges gagnés.
  const awardBadge = async (conditionKey) => {
    if (await hasBadge(conditionKey)) return null;
    const badge = await prisma.badge.findFirst({ where: { conditionKey } });
    if (!badge) return null;
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    badgesEarned.push(badge);
  };

  if (totalGoals >= 1) await awardBadge('first_goal');
  if (completedGoals >= 1) await awardBadge('first_completed');
  if (completedGoals >= 5) await awardBadge('five_completed');
  if (categories.length >= 3) await awardBadge('explorer');
  if ((user?.streakDays || 0) >= 7) await awardBadge('streak_7');

  return badgesEarned;
}
