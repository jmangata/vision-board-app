// badgeService.js : appels API pour récupérer les badges disponibles
// et ceux déjà gagnés par l'utilisateur connecté.
import api from './api.js';

export const getAllBadges = () => api.get('/badges');
export const getMyBadges = () => api.get('/badges/me');
