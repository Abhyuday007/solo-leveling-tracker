import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

// Screens
import Gate00_Login from './src/screens/Gate00_Login';
import Gate01_Dungeons from './src/screens/Gate01_Dungeons';
import Gate02_Archives from './src/screens/Gate02_Archives';
import Gate03_Lore from './src/screens/Gate03_Lore';

const Tab = createBottomTabNavigator();

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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout events
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // If the player is not authenticated, show Gate 00
  if (!session) {
    return <Gate00_Login />;
  }

  // If authenticated, grant access to the System
  return (
    <NavigationContainer theme={ThorgalTheme}>
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
    </NavigationContainer>
  );
}