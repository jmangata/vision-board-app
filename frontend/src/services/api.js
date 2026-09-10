// api.js : configuration centralisée du client HTTP Axios.
// Ce module crée une instance réutilisable pour tout le frontend et ajoute
// un intercepteur de requête afin d'envoyer automatiquement le JWT stocké.
import axios from 'axios';

const api = axios.create({
  // L'URL de base est configurable via une variable d'environnement,
  // avec une valeur de repli pour le développement local.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercepteur : enrichit chaque requête avec le token d'authentification.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;