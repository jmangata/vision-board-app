// Point d'entrée de l'application mobile (Expo / React Native).
// Enveloppe toute l'app dans AuthProvider pour rendre le token
// d'authentification accessible partout via le hook useAuth().
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
 
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}