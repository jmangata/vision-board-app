// Navigateur principal de l'application.
// Il choisit dynamiquement la racine affichée selon l'état d'authentification.
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
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
  // Ajoute l'inset système à la hauteur de la tab bar sans réduire sa zone de contenu.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0D3F7E',
        tabBarInactiveTintColor: '#737781',
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color }) => {
          // Reprend les quatre Material Symbols utilisés par la navigation web responsive.
          const icons = {
            Board: 'grid-view',
            Dashboard: 'auto-graph',
            Badges: 'military-tech',
            Profile: 'person',
          };
          return <MaterialIcons name={icons[route.name]} size={23} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1, marginBottom: 4 },
        tabBarIconStyle: { marginTop: 4 },
        tabBarItemStyle: { minWidth: 56 },
        tabBarStyle: { height: 64 + insets.bottom, paddingHorizontal: 20, paddingTop: 4, paddingBottom: Math.max(insets.bottom, 4), backgroundColor: '#FFFFFF', borderTopColor: '#E2E2E8' },
      })}
    >
      <Tab.Screen name="Board" component={BoardScreen} options={{ title: 'Board' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Stats' }} />
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
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        ) : (
          <>
            {/* En mode connecté : onglets principaux et écrans secondaires empilés au-dessus. */}
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: "Détail de l'objectif" }} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}