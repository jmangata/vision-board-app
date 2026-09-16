import api from './api';

export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const uploadImage = (image) => {
  const data = new FormData();
  data.append('image', { uri: image.uri, name: image.fileName || 'goal-image.jpg', type: image.mimeType || 'image/jpeg' });
  return api.post('/upload/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const searchUnsplash = (query) => api.get('/unsplash/search', { params: { query } });
export const suggestSteps = (title, description, category) =>
  api.post('/groq/suggestions', { title, description, category });
export const createGoal = (payload) => api.post('/goals', payload);
export const createStep = (goalId, title) => api.post(`/goals/${goalId}/steps`, { title });
