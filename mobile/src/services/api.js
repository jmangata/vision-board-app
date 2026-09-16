// Client HTTP partagé par tous les services.
// Il centralise l'URL de base du backend et injecte automatiquement le token JWT dans chaque requête.
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Instance Axios configurée avec l'adresse du backend local.
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000/api',
  timeout: 10000,
});

// Intercepteur requête : lit le token stocké et l'ajoute sous forme d'en-tête Bearer
// afin que le backend puisse identifier l'utilisateur connecté.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
