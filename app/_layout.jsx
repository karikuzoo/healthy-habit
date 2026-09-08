import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../src/context/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="register-profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout/[category]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="workout/session"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="nutrition/add-food"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="nutrition/detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="sleep/input"
            options={{ headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </UserProvider>
  );
}
