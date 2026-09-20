// Service centralisant les appels nécessaires aux objectifs, catégories, images et suggestions.
import api from './api';

// Lecture et création des catégories proposées dans le formulaire d'objectif.
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
// Transforme l'asset Expo Image Picker en multipart attendu par l'endpoint d'upload.
export const uploadImage = (image) => {
  const data = new FormData();
  data.append('image', { uri: image.uri, name: image.fileName || 'goal-image.jpg', type: image.mimeType || 'image/jpeg' });
  return api.post('/upload/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
};
// Services d'assistance à la création : recherche d'image et suggestion d'étapes.
export const searchUnsplash = (query) => api.get('/unsplash/search', { params: { query } });
export const suggestSteps = (title, description, category) =>
  api.post('/groq/suggestions', { title, description, category });
// Crée l'objectif puis permet d'y rattacher chaque étape sélectionnée.
export const createGoal = (payload) => api.post('/goals', payload);
export const createStep = (goalId, title) => api.post(`/goals/${goalId}/steps`, { title });
