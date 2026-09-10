// Service d'authentification : expose les appels réseaux liés à l'identification.
import api from './api.js';

// Création d'un nouveau compte utilisateur.
export const register = (data) => api.post('/auth/register', data);

// Connexion d'un utilisateur existant ; renvoie un token JWT en cas de succès.
export const login = (data) => api.post('/auth/login', data);
