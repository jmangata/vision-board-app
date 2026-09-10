// Service d'attribution des badges.
// checkBadges(userId) est appelé après chaque action significative
// (création/complétion d'objectif, connexion, ...) : il évalue les règles
// de déblocage et crée les UserBadge manquants.
import { prisma } from '../prisma.js';

// Évalue toutes les conditions de badges pour un utilisateur et retourne
// la liste des badges nouvellement débloqués (vide si rien de nouveau).
export async function checkBadges(userId) {
  const badgesEarned = [];

  // Récupère en parallèle toutes les métriques utilisées par les règles
  const [totalGoals, completedGoals, categories, user] = await Promise.all([
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: 'completed' } }),
    prisma.goal.groupBy({
      by: ['categoryId'],
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true },
    }),
  ]);

  // Vrai si l'utilisateur possède déjà le badge identifié par conditionKey
  const hasBadge = async (conditionKey) => {
    const badge = await prisma.badge.findFirst({ where: { conditionKey } });
    if (!badge) return false;
    const existing = await prisma.userBadge.findFirst({
      where: { userId, badgeId: badge.id },
    });
    return !!existing;
  };

  // Attribue le badge si pas déjà détenu ; retourne null sinon
  const awardBadge = async (conditionKey) => {
    if (await hasBadge(conditionKey)) return null;
    const badge = await prisma.badge.findFirst({ where: { conditionKey } });
    if (!badge) return null;
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    badgesEarned.push(badge);
  };

  // Règles de déblocage : chaque conditionKey correspond à un badge seedé
  if (totalGoals >= 1) await awardBadge('first_goal');
  if (completedGoals >= 1) await awardBadge('first_completed');
  if (completedGoals >= 5) await awardBadge('five_completed');
  if (categories.length >= 3) await awardBadge('explorer');
  if ((user?.streakDays || 0) >= 7) await awardBadge('streak_7');

  return badgesEarned;
}
