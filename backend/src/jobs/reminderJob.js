// Job d'arrière-plan (cron) qui envoie les rappels d'objectifs par email.
// Toutes les 2 heures, il recherche les rappels dont l'échéance est passée,
// envoie l'email puis replanifie la prochaine occurrence selon la fréquence.
import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { sendReminderEmail } from '../services/emailService.js';


// Calcule la prochaine date de déclenchement selon la fréquence du rappel.
// On repart de l'ancienne échéance (et non de "maintenant") pour éviter
// la dérive horaire accumulée entre deux passages du cron.
function computeNextTriggerAt(frequency, from = new Date()) {
  const next = new Date(from);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}
 
// Envoie tous les rappels arrivés à échéance (nextTriggerAt <= maintenant)
async function checkAndSendReminders() {
  const dueReminders = await prisma.reminder.findMany({
    where: { nextTriggerAt: { lte: new Date() } },
    include: { goal: true, user: true },
  });
 
  for (const reminder of dueReminders) {
    try {
      await sendReminderEmail(reminder.user.email, reminder.goal.title);
      // Replanifie immédiatement la prochaine occurrence du rappel
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { nextTriggerAt: computeNextTriggerAt(reminder.frequency, reminder.nextTriggerAt) },
      });
    } catch (err) {
      // Un échec d'envoi ne doit pas bloquer les autres rappels
      console.error(`Erreur envoi rappel ${reminder.id}:`, err.message);
    }
  }
}

export function startReminderJob() {
  // Toutes les 2 heures
  cron.schedule('0 */2 * * *', async () => {
    console.log('Envoi des rappels...');
    await checkAndSendReminders();
  });
}