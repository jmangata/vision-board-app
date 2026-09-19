 // Service d'envoi d'emails via SMTP configuré dans les variables d'environnement.
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

// Envoie le lien de réinitialisation de mot de passe.
// L'URL contient le token en clair ; en base seul son hash SHA-256 est conservé.
export async function sendPasswordResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: '"Vision Board" <no-reply@visionboard.app>',
    to,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h2>Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure) :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
}
