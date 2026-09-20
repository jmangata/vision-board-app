// Point d'entrée principal de l'application mobile.
// Il enrobe toute la navigation dans le fournisseur d'authentification
// afin que chaque écran puisse accéder au token et aux actions login/logout.
import { useEffect } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initNotifications } from './src/services/notificationService';

export default function App() {
  // Attend le chargement d'Inter avant d'afficher les écrans afin d'éviter un changement visuel tardif.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });

  // Demande la permission de notifications au premier lancement (rappels d'échéances).
  useEffect(() => {
    initNotifications();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}