import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Santé', color: '#2E5797', icon: 'heart' },
    { name: 'Carrière', color: '#1D9E75', icon: 'briefcase' },
    { name: 'Finances', color: '#D85A30', icon: 'dollar-sign' },
    { name: 'Apprentissage', color: '#8E44AD', icon: 'book-open' },
    { name: 'Voyages', color: '#F39C12', icon: 'map' },
    { name: 'Relations', color: '#E74C3C', icon: 'users' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const badges = [
    { name: 'Premier pas', icon: 'flag', description: 'Créer son premier objectif', conditionKey: 'first_goal' },
    { name: 'Objectif atteint', icon: 'trophy', description: 'Terminer son premier objectif', conditionKey: 'first_completed' },
    { name: 'Machine', icon: 'zap', description: 'Terminer 5 objectifs', conditionKey: 'five_completed' },
    { name: 'Inarrêtable', icon: 'calendar', description: '7 jours de streak', conditionKey: 'streak_7' },
    { name: 'Explorateur', icon: 'compass', description: 'Objectifs dans 3 catégories différentes', conditionKey: 'explorer' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  console.log('Seed terminé : catégories et badges créés.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
