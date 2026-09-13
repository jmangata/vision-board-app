// Script de peuplement initial de la base de données.
// Il crée les catégories par défaut et les badges déblocables si ceux-ci n'existent pas encore.
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // Catégories proposées à l'utilisateur lors de la création d'objectifs.
  const categories = [
    { name: 'Sport', color: '#1565C0', icon: 'dumbbell' },
    { name: 'Musique', color: '#7B1FA2', icon: 'music-note' },
    { name: 'Voyage', color: '#F39C12', icon: 'map' },
    { name: 'Finance', color: '#D85A30', icon: 'dollar-sign' },
    { name: 'Lecture', color: '#8E44AD', icon: 'book-open' },
  ];

  // upsert : met à jour si la catégorie existe déjà, sinon la crée.
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Badges disponibles dans le système de gamification.
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
