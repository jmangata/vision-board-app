import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { sendReminderEmail } from '../services/emailService.js';


function computeNextTriggerAt(frequency, from = new Date()) {
  const next = new Date(from);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}
 
async function checkAndSendReminders() {
  const dueReminders = await prisma.reminder.findMany({
    where: { nextTriggerAt: { lte: new Date() } },
    include: { goal: true, user: true },
  });
 
  for (const reminder of dueReminders) {
    try {
      await sendReminderEmail(reminder.user.email, reminder.goal.title);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { nextTriggerAt: computeNextTriggerAt(reminder.frequency, reminder.nextTriggerAt) },
      });
    } catch (err) {
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