import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from './src/screens/DashboardScreen';
import URLScannerScreen from './src/screens/URLScannerScreen';
import MessageScannerScreen from './src/screens/MessageScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import Colors from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
          headerStyle: { backgroundColor: Colors.primary[600] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarStyle: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: Colors.lightGray, height: 60, paddingBottom: 8, paddingTop: 8 },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'SecureShield' }} />
        <Tab.Screen name="URL Scanner" component={URLScannerScreen} options={{ title: 'URL Scanner' }} />
        <Tab.Screen name="Message Scanner" component={MessageScannerScreen} options={{ title: 'Message Scanner' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Scan History' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}