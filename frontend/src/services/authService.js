// authService.js : fonctions dédiées à l'authentification.
// Ces fonctions appellent simplement les endpoints d'inscription et de connexion.
import api from './api.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
