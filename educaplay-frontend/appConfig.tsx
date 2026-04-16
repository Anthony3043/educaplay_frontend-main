/**
 * App.tsx - Ponto de entrada para EducaPlay com Expo Router
 */

import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Manter a splash screen visível enquanto carregandonos recursos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Tela de Login */}
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'EducaPlay',
            headerShown: false 
          }} 
        />
        {/* Tela Home */}
        <Stack.Screen 
          name="home" 
          options={{ 
            title: 'Salas de Chat',
            headerBackVisible: true
          }} 
        />
        {/* Tela Chat */}
        <Stack.Screen 
          name="chat" 
          options={{ 
            title: 'Chat',
            headerBackVisible: true
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
