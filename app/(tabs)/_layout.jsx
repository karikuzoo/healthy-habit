import React from 'react';
import { Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { tabBarShadow } from '../../src/theme/shadows';
import { useUser } from '../../src/context/UserContext';

/**
 * Ikon tab: versi solid saat aktif, outline saat tidak.
 * Semua tab memakai bentuk yang sama — mockup tidak punya tombol mengambang.
 */
const TABS = [
  { name: 'workout', title: 'Workout', icon: 'barbell' },
  { name: 'nutrition', title: 'Nutrition', icon: 'nutrition' },
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'sleep', title: 'Sleep', icon: 'moon' },
  { name: 'profile', title: 'Profile', icon: 'person' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useUser();

  // Tanpa ini layar Welcome/Login tidak pernah terjangkau, karena '/' langsung
  // dipetakan ke dashboard di dalam grup (tabs).
  if (!isLoggedIn) {
    return <Redirect href="/welcome" />;
  }

  const bottomInset = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.DEFAULT,
        tabBarInactiveTintColor: colors.ink.subtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface.DEFAULT,
          borderTopWidth: 1,
          borderTopColor: colors.line.soft,
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          ...tabBarShadow,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
