import 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { usuario, carregando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    SplashScreen.hideAsync();

    const rotasPublicas = ['index', 'Login', 'Register', 'ForgotPassword', 'CheckEmail', 'Resetpassword'];
    const rotaAtual = segments[0];
    const estaEmRotaPublica = rotasPublicas.includes(rotaAtual);

    if (!usuario && !estaEmRotaPublica) {
      router.replace('/Login');
    }
  }, [usuario, carregando, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="CheckEmail" />
      <Stack.Screen name="Resetpassword" />
      <Stack.Screen name="home" />
      <Stack.Screen name="home-professor" />
      <Stack.Screen name="cronogramas" />
      <Stack.Screen name="professores" />
      <Stack.Screen name="salas" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="configuracoes" />
      <Stack.Screen name="notificacoes" />
      <Stack.Screen name="privacidade" />
      <Stack.Screen name="sobre" />
      <Stack.Screen name="AulaDetalhe" />
      <Stack.Screen name="EditarHorario" />
      <Stack.Screen name="CriarHorario" />
      <Stack.Screen name="cronogramas-professor" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
