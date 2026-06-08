import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, useColorScheme } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { lightColors, darkColors, spacing } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PartnerLinkingScreen from '../screens/PartnerLinkingScreen';
import FloatingChatButton from '../components/FloatingChatButton';
import DashboardScreen from '../screens/DashboardScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen';
import MealLoggerScreen from '../screens/MealLoggerScreen';
import WaterTrackerScreen from '../screens/WaterTrackerScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import SecretNotesScreen from '../screens/SecretNotesScreen';
import WeeklySummaryScreen from '../screens/WeeklySummaryScreen';
import LoveNotesScreen from '../screens/LoveNotesScreen';
import PartnerProfileScreen from '../screens/PartnerProfileScreen';
import LocationMapScreen from '../screens/LocationMapScreen';
import LocationHistoryScreen from '../screens/LocationHistoryScreen';
import GeofenceManagerScreen from '../screens/GeofenceManagerScreen';
import LovePlantScreen from '../screens/LovePlantScreen';
import LovePlantHistoryScreen from '../screens/LovePlantHistoryScreen';
import LovePlantComparisonScreen from '../screens/LovePlantComparisonScreen';
import LovePlantAchievementsScreen from '../screens/LovePlantAchievementsScreen';
import PartnerChatScreen from '../screens/PartnerChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const LocationStack = createNativeStackNavigator();
const LovePlantStack = createNativeStackNavigator();

function DashboardStackNavigator() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const screenOpts = { headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, headerShadowVisible: false };
  return (
    <DashboardStack.Navigator screenOptions={screenOpts}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="Mood" component={MoodTrackerScreen} options={{ title: 'Mood' }} />
      <DashboardStack.Screen name="Meals" component={MealLoggerScreen} options={{ title: 'Meals' }} />
      <DashboardStack.Screen name="Water" component={WaterTrackerScreen} options={{ title: 'Water' }} />
      <DashboardStack.Screen name="Memories" component={MemoriesScreen} options={{ title: 'Memories' }} />
      <DashboardStack.Screen name="SecretNotes" component={SecretNotesScreen} options={{ title: 'Secret Notes' }} />
      <DashboardStack.Screen name="WeeklySummary" component={WeeklySummaryScreen} options={{ title: 'Weekly Summary' }} />
      <DashboardStack.Screen name="LoveNotes" component={LoveNotesScreen} options={{ title: 'Love Notes' }} />
      <DashboardStack.Screen name="PartnerProfile" component={PartnerProfileScreen} options={{ title: 'Partner' }} />
    </DashboardStack.Navigator>
  );
}

function LocationStackNavigator() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const screenOpts = { headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, headerShadowVisible: false };
  return (
    <LocationStack.Navigator screenOptions={screenOpts}>
      <LocationStack.Screen name="LocationMap" component={LocationMapScreen} options={{ headerShown: false }} />
      <LocationStack.Screen name="LocationHistory" component={LocationHistoryScreen} options={{ title: 'History' }} />
      <LocationStack.Screen name="GeofenceManager" component={GeofenceManagerScreen} options={{ title: 'Geofence' }} />
    </LocationStack.Navigator>
  );
}

function LovePlantStackNavigator() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const screenOpts = { headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, headerShadowVisible: false };
  return (
    <LovePlantStack.Navigator screenOptions={screenOpts}>
      <LovePlantStack.Screen name="PlantView" component={LovePlantScreen} options={{ headerShown: false }} />
      <LovePlantStack.Screen name="PlantHistory" component={LovePlantHistoryScreen} options={{ title: 'History' }} />
      <LovePlantStack.Screen name="PlantComparison" component={LovePlantComparisonScreen} options={{ title: 'Comparison' }} />
      <LovePlantStack.Screen name="PlantAchievements" component={LovePlantAchievementsScreen} options={{ title: 'Achievements' }} />
    </LovePlantStack.Navigator>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const icons: Record<string, string> = { Dashboard: '🏠', LovePlant: '🌱', Location: '📍', PartnerChat: '💬', Profile: '👤' };
  const labels: Record<string, string> = { Dashboard: 'Home', LovePlant: 'Plant', Location: 'Map', PartnerChat: 'Chat', Profile: 'Profile' };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon emoji={icons[route.name] || '📌'} focused={focused} />,
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? (isDark ? '#d4a853' : '#e85d75') : colors.mutedForeground, marginTop: 2 }}>
            {labels[route.name] || route.name}
          </Text>
        ),
        tabBarActiveTintColor: isDark ? '#d4a853' : '#e85d75',
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 2,
          borderTopColor: isDark ? '#d4a853' : '#e85d75',
          paddingBottom: 8,
          paddingTop: 6,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="LovePlant" component={LovePlantStackNavigator} />
      <Tab.Screen name="Location" component={LocationStackNavigator} />
      <Tab.Screen name="PartnerChat" component={PartnerChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="PartnerLinking" component={PartnerLinkingScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: isDark ? '#d4a853' : '#e85d75', marginBottom: 8 }}>My Bunny 🥰</Text>
        <Text style={{ fontSize: 16, color: colors.mutedForeground }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <View style={{ flex: 1 }}>
          <MainTabs />
          <FloatingChatButton />
        </View>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
