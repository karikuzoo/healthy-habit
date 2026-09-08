import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../src/context/UserContext';

/**
 * Rute tidak perlu didaftarkan satu per satu — expo-router menemukannya dari
 * struktur folder, dan `screenOptions` sudah mematikan header untuk semuanya.
 */
export default function RootLayout() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </UserProvider>
  );
}
