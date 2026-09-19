 
// Définition des routes d'authentification (register / login).
// Définition des routes d'authentification (auth)
import { Router } from 'express';                    // Importe le Router d'Express
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = Router(); // Crée une instance de Router

// Route POST /register : appelle la fonction register du controller pour créer un nouvel utilisateur
router.post('/register', register);

// Route POST /login : appelle la fonction login du controller pour authentifier un utilisateur existant
router.post('/login', login);

// Routes de réinitialisation de mot de passe : envoi du lien par email puis application du nouveau mot de passe
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router; // Exporte le router pour l'importer dans index.js