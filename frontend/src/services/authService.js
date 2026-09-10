// Service d'authentification : appels API d'inscription et de connexion.
// Le token JWT retourné est stocké en localStorage par les pages appelantes.
 import api from './api.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
