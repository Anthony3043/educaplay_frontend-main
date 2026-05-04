/**
 * app/_layout.tsx - Layout raiz do EducaPlay com Expo Router
 */

import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Login */}
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />

        {/* Recuperação de senha */}
        <Stack.Screen
          name="ForgotPassword"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CheckEmail"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="ResetPassword"
          options={{ headerShown: false, gestureEnabled: false }}
        />

        {/* Telas principais */}
        <Stack.Screen
          name="home"
          options={{ title: 'Salas de Chat', headerBackVisible: true }}
        />
        <Stack.Screen
          name="chat"
          options={{ title: 'Chat', headerBackVisible: true }}
        />
      </Stack>
    </ThemeProvider>
  );
}