import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import URLScannerScreen from './src/screens/URLScannerScreen';
import MessageScannerScreen from './src/screens/MessageScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import Navbar from './src/components/Navbar';
import Colors from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <NavigationContainer>
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
              tabBarActiveTintColor: Colors.primary[600],
              tabBarInactiveTintColor: Colors.gray,
              headerShown: false,
              tabBarStyle: {
                backgroundColor: 'white',
                borderTopWidth: 1,
                borderTopColor: '#e2e8f0',
                height: 60,
                paddingBottom: 8,
                paddingTop: 4,
                boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
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
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}