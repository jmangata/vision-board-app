// Service des badges : catalogue complet et badges débloqués par
// l'utilisateur connecté.
import api from './api.js';

export const getAllBadges = () => api.get('/badges');
export const getMyBadges = () => api.get('/badges/me');
