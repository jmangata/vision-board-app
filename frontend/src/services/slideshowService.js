import api from './api.js';

export const getSlideshow = () => api.get('/slideshow');
export const saveSlideshow = (data) => api.put('/slideshow', data);
