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
