// Client HTTP Axios de l'app mobile.
// ATTENTION : la baseURL est une IP locale en dur — un appareil ou un
// émulateur ne peut pas joindre "localhost" de la machine hôte ; penser à
// mettre à jour cette IP si le réseau change.
 import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.50.205:5000/api',
});

// Intercepteur : injecte le token JWT (stocké dans AsyncStorage par
// AuthContext) dans le header Authorization de chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
