// Configuration de l'application Express.
// Ce fichier construit l'application (middlewares de sécurité, routes, gestion
// d'erreurs) SANS démarrer le serveur : il est importé à la fois par index.js
// (production) et par les tests d'intégration (Supertest).
import express from 'express';       // Framework web Node.js
import cors from 'cors';            // Autorise les requêtes cross-origin du frontend
import helmet from 'helmet';        // Sécurise les en-têtes HTTP (XSS, clickjacking, sniffing...)
import rateLimit from 'express-rate-limit'; // Limite le nombre de requêtes (anti brute-force)
import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import stepRoutes from './src/routes/stepRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import badgeRoutes from './src/routes/badgeRoutes.js';
import reminderRoutes from './src/routes/reminderRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import unsplashRoutes from './src/routes/unsplashRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import groqRoutes from './src/routes/groqRoutes.js';
import suggestionRoutes from './src/routes/suggestionRoutes.js';
import { errorHandler } from './src/middlewares/errorMiddleware.js';

const app = express();

// --- Sécurité ---
// helmet ajoute des en-têtes de sécurité (Content-Security-Policy, X-Frame-Options...)
app.use(helmet());

// CORS : en production, on restreint aux origines autorisées (variable
// ALLOWED_ORIGINS, liste séparée par des virgules). En développement/test, tout est permis.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Les requêtes sans origine (mobile, curl, same-origin) sont acceptées.
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origine non autorisée par CORS'));
  },
}));

// Limiteur global : 200 requêtes / 15 min par IP sur l'ensemble de l'API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, réessayez plus tard.' },
});

// Limiteur strict sur l'authentification : 20 tentatives / 15 min (anti brute-force).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion, réessayez plus tard.' },
});

app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' })); // Parse le body JSON (taille plafonnée)

// --- Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/goals', stepRoutes);   // POST /api/goals/:id/steps
app.use('/api/steps', stepRoutes);   // PATCH/DELETE /api/steps/:id
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/unsplash', unsplashRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/groq', groqRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Sonde de santé : utilisée par Render et les outils de monitoring.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gestion centralisée des erreurs (doit être montée APRÈS toutes les routes).
app.use(errorHandler);

export default app;
