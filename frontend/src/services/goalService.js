// Service des objectifs et de leurs étapes : encapsule tous les appels
// à l'API REST du backend (CRUD goals, steps, upload d'image, suggestions IA).
import api from './api.js';

export const getGoals = () => api.get('/goals');
export const getGoal = (id) => api.get(`/goals/${id}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const createStep = (goalId, title) => api.post(`/goals/${goalId}/steps`, { title });
export const toggleStep = (id) => api.patch(`/steps/${id}/toggle`);
export const deleteStep = (id) => api.delete(`/steps/${id}`); 
// Upload d'une image de couverture vers Cloudinary via le backend.
// Le fichier est envoyé en multipart dans le champ "image".
export const uploadImage = (file) => {
  
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
};
// Demande à l'IA (Groq, côté backend) de décomposer l'objectif en étapes
export const suggestSteps = (title, description, category) => 
  api.post('/groq/suggestions', { title, description, category });