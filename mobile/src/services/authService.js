// Service d'authentification mobile : appels API d'inscription et de
// connexion. Le token retourné est persisté via AuthContext (login()).
 import api from './api.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
