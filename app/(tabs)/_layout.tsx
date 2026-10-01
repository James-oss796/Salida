import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import React from 'react';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.outline,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.onSurfaceMuted,
      }}
    >
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Music',
        }}
      />
      <Tabs.Screen
        name="images"
        options={{
          title: 'Images',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
