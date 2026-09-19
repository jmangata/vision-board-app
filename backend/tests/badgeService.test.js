// Tests unitaires du service de badges.
// Prisma est mocké : on vérifie la logique d'attribution sans base de données.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du module prisma avant l'import du service.
vi.mock('../src/prisma.js', () => ({
  prisma: {
    goal: { count: vi.fn(), groupBy: vi.fn() },
    user: { findUnique: vi.fn() },
    badge: { findFirst: vi.fn() },
    userBadge: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from '../src/prisma.js';
import { checkBadges } from '../src/services/badgeService.js';

// Configure un scénario de compteurs utilisateur.
function mockStats({ totalGoals = 0, completedGoals = 0, categories = [], streakDays = 0 }) {
  prisma.goal.count
    .mockResolvedValueOnce(totalGoals)       // premier appel : totalGoals
    .mockResolvedValueOnce(completedGoals);  // second appel : completedGoals
  prisma.goal.groupBy.mockResolvedValue(categories);
  prisma.user.findUnique.mockResolvedValue({ streakDays });
}

// Simule des badges existants en base et aucun badge déjà attribué.
function mockBadgesCatalog() {
  prisma.badge.findFirst.mockImplementation(({ where }) =>
    Promise.resolve({ id: `badge-${where.conditionKey}`, conditionKey: where.conditionKey })
  );
  prisma.userBadge.findFirst.mockResolvedValue(null);
  prisma.userBadge.create.mockResolvedValue({});
}

beforeEach(() => vi.clearAllMocks());

describe('checkBadges', () => {
  it('attribue le badge first_goal au premier objectif', async () => {
    mockStats({ totalGoals: 1 });
    mockBadgesCatalog();
    const earned = await checkBadges('user-1');
    expect(earned.map((b) => b.conditionKey)).toContain('first_goal');
  });

  it('attribue first_completed quand un objectif est terminé', async () => {
    mockStats({ totalGoals: 2, completedGoals: 1 });
    mockBadgesCatalog();
    const earned = await checkBadges('user-1');
    const keys = earned.map((b) => b.conditionKey);
    expect(keys).toContain('first_goal');
    expect(keys).toContain('first_completed');
  });

  it('attribue explorer à partir de 3 catégories distinctes', async () => {
    mockStats({
      totalGoals: 3,
      categories: [{ categoryId: 'a' }, { categoryId: 'b' }, { categoryId: 'c' }],
    });
    mockBadgesCatalog();
    const earned = await checkBadges('user-1');
    expect(earned.map((b) => b.conditionKey)).toContain('explorer');
  });

  it('attribue streak_7 à partir de 7 jours consécutifs', async () => {
    mockStats({ streakDays: 7 });
    mockBadgesCatalog();
    const earned = await checkBadges('user-1');
    expect(earned.map((b) => b.conditionKey)).toContain('streak_7');
  });

  it("n'attribue pas de doublon si le badge est déjà possédé", async () => {
    mockStats({ totalGoals: 1 });
    prisma.badge.findFirst.mockResolvedValue({ id: 'b1', conditionKey: 'first_goal' });
    prisma.userBadge.findFirst.mockResolvedValue({ id: 'ub1' }); // déjà attribué
    const earned = await checkBadges('user-1');
    expect(earned).toHaveLength(0);
    expect(prisma.userBadge.create).not.toHaveBeenCalled();
  });
});
