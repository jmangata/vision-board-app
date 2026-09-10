// Client HTTP Axios partagé par tous les services du frontend.
// L'URL de l'API vient de VITE_API_URL (fichier .env), avec un fallback
// vers le backend local en développement.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercepteur : injecte automatiquement le token JWT (stocké dans
// localStorage après le login) dans le header Authorization de chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;