// Service d'envoi d'emails via SMTP (Nodemailer).
// Utilisé par le job de rappels (jobs/reminderJob.js). La configuration
// SMTP provient des variables d'environnement SMTP_HOST/PORT/USER/PASS.
 import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Transporteur SMTP réutilisable, créé une seule fois au démarrage
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Envoie l'email de rappel pour un objectif donné
export async function sendReminderEmail(to, goalTitle) {
  await transporter.sendMail({
    from: '"Vision Board" <rappels@visionboard.app>',
    to,
    subject: 'Rappel : votre objectif vous attend',
    html: `
      <h2>Bonjour !</h2>
      <p>Ceci est un rappel pour votre objectif : <strong>${goalTitle}</strong>.</p>
      <p>Continuez à avancer, vous êtes sur la bonne voie !</p>
    `,
  });
}
