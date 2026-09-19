// Point d'entrée du serveur.
// Charge les variables d'environnement, démarre la tâche planifiée de rappels
// et lance l'écoute HTTP. La configuration Express est dans app.js afin de
// pouvoir être réutilisée par les tests d'intégration.
import dotenv from 'dotenv';
import app from './app.js';
import { startReminderJob } from './src/jobs/reminderJob.js';

dotenv.config();               // Lit le fichier .env et injecte les variables dans process.env
startReminderJob();            // Démarre le cron qui envoie les rappels par email

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
