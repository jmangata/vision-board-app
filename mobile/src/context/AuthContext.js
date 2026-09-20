import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../services/api';

// Contexte React partagé entre tous les écrans de l'application.
// Il centralise l'état d'authentification (token) et l'état de rechargement initial.
const AuthContext = createContext(null);

// Fournisseur d'authentification : charge le token au démarrage et expose
// les fonctions de connexion/déconnexion à l'arborescence React sous-jacente.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au montage de l'application, on tente de restaurer un token précédemment
  // sauvegardé dans le stockage local. Cela évite de redemander la connexion.
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  // Revient immédiatement à la connexion lorsqu'une requête authentifiée reçoit un 401.
  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Persiste le token reçu du backend puis met à jour l'état React.
  const login = async (newToken) => {
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
  };

  // Supprime le token du stockage local et réinitialise l'état.
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook utilitaire pour consommer le contexte depuis n'importe quel composant.
export function useAuth() {
  return useContext(AuthContext);
}