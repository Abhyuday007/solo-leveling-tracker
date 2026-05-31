import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

// Screens
import Gate00_Login from './src/screens/Gate00_Login';
import Gate00_Awakening from './src/screens/Gate00_Awakening';
import Gate01_Dungeons from './src/screens/Gate01_Dungeons';
import Gate02_Archives from './src/screens/Gate02_Archives';
import Gate03_Lore from './src/screens/Gate03_Lore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ThorgalTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#ffffff',
    border: '#333333',
  },
};

// 1. We wrap your existing Gates into a Tab component
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#333333',
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#4d4d4d',
        tabBarLabelStyle: { letterSpacing: 2, fontSize: 10 },
      }}
    >
      <Tab.Screen name="GATE 01" component={Gate01_Dungeons} />
      <Tab.Screen name="GATE 02" component={Gate02_Archives} />
      <Tab.Screen name="GATE 03" component={Gate03_Lore} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing Supabase session on app launch
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Show a black loading screen while checking the Vault
  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // 2. The Main Stack Router (Unified)
  return (
    <NavigationContainer theme={ThorgalTheme}>
      <Stack.Navigator 
        // If logged in, go straight to Tabs. If not, start at Login.
        initialRouteName={session ? "MainTabs" : "Gate00_Login"} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Gate00_Login" component={Gate00_Login} />
        
        {/* Make sure this name exactly matches what your Login screen uses to navigate */}
        <Stack.Screen name="Gate00_Awakening" component={Gate00_Awakening} />
        
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}