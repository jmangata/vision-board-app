// Contexte d'authentification de l'app mobile.
// Le token JWT est persisté dans AsyncStorage (équivalent mobile du
// localStorage web) et restauré au démarrage ; il conditionne ensuite
// la navigation (écran Login vs app complète) dans AppNavigator.
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage, restaure le token persisté ; loading reste true
  // tant que la lecture n'est pas terminée (évite un flash du login)
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  const login = async (newToken) => {
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
  };

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

// Hook d'accès : const { token, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}