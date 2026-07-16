 
// Définition des routes d'authentification (auth)
import { Router } from 'express';                    // Importe le Router d'Express
import { register, login } from '../controllers/authController.js'; // Importe les fonctions register et login du controller

const router = Router(); // Crée une instance de Router

// Route POST /register : appelle la fonction register du controller pour créer un nouvel utilisateur
router.post('/register', register);

// Route POST /login : appelle la fonction login du controller pour authentifier un utilisateur existant
router.post('/login', login);

export default router; // Exporte le router pour l'importer dans index.js