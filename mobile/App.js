// Point d'entrée principal de l'application mobile.
// Il enrobe toute la navigation dans le fournisseur d'authentification
// afin que chaque écran puisse accéder au token et aux actions login/logout.
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}