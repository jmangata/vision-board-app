// goalService.js : ensemble des appels API liés aux objectifs, étapes,
// images et suggestions automatiques.
import api from './api.js';

// Objectifs
export const getGoals = () => api.get('/goals');
export const getGoal = (id) => api.get(`/goals/${id}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// Étapes
export const createStep = (goalId, title) => api.post(`/goals/${goalId}/steps`, { title });
export const toggleStep = (id) => api.patch(`/steps/${id}/toggle`);
export const deleteStep = (id) => api.delete(`/steps/${id}`);

// Upload d'image : construit un FormData car le serveur attend un fichier multipart.
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Suggestion d'étapes par IA à partir du titre, de la description et de la catégorie.
export const suggestSteps = (title, description, category) =>
  api.post('/groq/suggestions', { title, description, category });