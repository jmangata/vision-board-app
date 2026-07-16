import api from './api.js';

export const getGoals = () => api.get('/goals');
export const getGoal = (id) => api.get(`/goals/${id}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const createStep = (goalId, title) => api.post(`/goals/${goalId}/steps`, { title });
export const toggleStep = (id) => api.patch(`/steps/${id}/toggle`); 
