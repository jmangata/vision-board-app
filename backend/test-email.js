// Script de vérification SMTP : envoie un email de test à l'adresse indiquée
// (ou à SMTP_USER par défaut). Permet de valider la configuration Mailjet/Brevo
// en une commande avant de déployer ou de démontrer le parcours de reset.
//
// Usage : node test-email.js [destinataire]
import dotenv from 'dotenv';
dotenv.config();

const { sendPasswordResetEmail, sendReminderEmail } = await import('./src/services/emailService.js');

const to = process.argv[2] || process.env.MAIL_FROM || process.env.SMTP_USER;

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('Config SMTP incomplète : vérifiez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env');
  process.exit(1);
}

try {
  await sendPasswordResetEmail(to, 'https://example.com/reset-password?token=test123');
  await sendReminderEmail(to, 'Objectif de test');
  console.log(`✔ Emails de test envoyés à ${to} (reset + rappel)`);
} catch (err) {
  console.error('✘ Échec envoi :', err.message);
  process.exit(1);
}
