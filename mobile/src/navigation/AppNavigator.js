// Navigateur principal de l'application.
// Il choisit dynamiquement la racine affichée selon l'état d'authentification.
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import BoardScreen from '../screens/BoardScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BadgesScreen from '../screens/BadgesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import { useAuth } from '../context/AuthContext';

// Instances des navigateurs : pile pour l'ensemble de l'app, onglets pour les écrans principaux.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Groupe d'onglets affiché une fois l'utilisateur connecté.
// Chaque onglet donne accès à un domaine fonctionnel de l'application.
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Board" component={BoardScreen} options={{ title: 'Objectifs' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Statistiques' }} />
      <Tab.Screen name="Badges" component={BadgesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, loading } = useAuth();

  // Pendant la restauration du token, on ne rend rien pour éviter un flash de l'écran de connexion.
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Si aucun token n'est disponible, on affiche l'écran de connexion. */}
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            {/* En mode connecté : onglets principaux et écrans secondaires empilés au-dessus. */}
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: "Détail de l'objectif" }} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ title: 'Nouvel objectif' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}