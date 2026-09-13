// authService.js : fonctions dédiées à l'authentification.
// Ces fonctions appellent simplement les endpoints d'inscription et de connexion.
import api from './api.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

export const prepareWelcome = (firstname) => {
  const messageCount = 6;
  const previousVariant = Number(localStorage.getItem('welcomeVariant'));
  const offset = Math.floor(Math.random() * (messageCount - 1)) + 1;
  const variant = Number.isInteger(previousVariant)
    ? (previousVariant + offset) % messageCount
    : Math.floor(Math.random() * messageCount);

  localStorage.setItem('welcomeVariant', String(variant));
  localStorage.setItem('pendingWelcome', JSON.stringify({ firstname, variant }));
};
