 
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: "Détail de l'objectif" }} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ title: 'Nouvel objectif' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}