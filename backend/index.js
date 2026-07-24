import express from 'express';    // Charge la librairie Express pour créer le serveur web
import cors from 'cors';          // Charge CORS pour autoriser les requêtes du frontend (React/Vite)
import dotenv from 'dotenv';      // Charge dotenv pour lire les variables du fichier .env
import authRoutes from './src/routes/authRoutes.js'; // Importe les routes d'authentification (register / login)
import categoryRoutes from './src/routes/categoryRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import stepRoutes from './src/routes/stepRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import badgeRoutes from './src/routes/badgeRoutes.js';
import reminderRoutes from './src/routes/reminderRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import unsplashRoutes from './src/routes/unsplashRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import suggestionRoutes from './src/routes/suggestionRoutes.js';
import groqRoutes from './src/routes/groqRoutes.js';

dotenv.config();                 // Lit le fichier .env et injecte les variables dans process.env

const app = express();             // Crée l'application Express
const PORT = process.env.PORT || 5000;  // Récupère le port depuis .env, sinon 5000 par défaut

app.use(cors());                   // Active CORS : le frontend peut appeler ce backend sans blocage
app.use(express.json());           // Parse automatiquement les requêtes avec un body JSON
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/goals', stepRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/unsplash', unsplashRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/groq', groqRoutes);

// Route de test : vérifie que le serveur répond
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });    // Répond avec un objet JSON {"status": "ok"}
});

// Lance le serveur et écoute les connexions sur le port défini
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);  // Affiche dans le terminal que le serveur est démarré
});