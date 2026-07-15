import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { GuestProvider } from './src/context/GuestContext';
import { getColors } from './src/constants/colors';
import DashboardScreen from './src/screens/DashboardScreen';
import URLScannerScreen from './src/screens/URLScannerScreen';
import MessageScannerScreen from './src/screens/MessageScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import Navbar from './src/components/Navbar';
import { Toaster } from './src/components/Toaster';

const Tab = createBottomTabNavigator();

const AppContent = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <NavigationContainer theme={{
          colors: {
            background: colors.background,
            card: colors.backgroundCard,
            text: colors.text,
            border: colors.border,
            primary: colors.primary[600],
          },
        }}>
          <Navbar />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                else if (route.name === 'URL Scanner') iconName = focused ? 'link' : 'link-outline';
                else if (route.name === 'Message Scanner') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: colors.primary[600],
              tabBarInactiveTintColor: colors.textMuted,
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.backgroundCard,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 4,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 4,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '500',
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="URL Scanner" component={URLScannerScreen} />
            <Tab.Screen name="Message Scanner" component={MessageScannerScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
          </Tab.Navigator>
          <Toaster />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GuestProvider>
          <AppContent />
        </GuestProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}