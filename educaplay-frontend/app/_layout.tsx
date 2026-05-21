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
    // Rotas exclusivas de Supervisão
    const rotasSupervisao = ['home', 'cronogramas', 'professores', 'salas', 'CriarHorario', 'AulaDetalhe'];
    // Rotas exclusivas de Professor
    const rotasProfessor = ['home-professor', 'cronogramas-professor', 'indisponibilidade'];

    const rotaAtual = segments[0] as string;
    const estaEmRotaPublica = rotasPublicas.includes(rotaAtual);

    if (!usuario && !estaEmRotaPublica) {
      router.replace('/Login');
      return;
    }

    if (usuario) {
      const isProfessor = usuario.papel === 'Professor';
      const isSupervisao = usuario.papel === 'Supervisao';

      if (isProfessor && rotasSupervisao.includes(rotaAtual)) {
        router.replace('/home-professor');
        return;
      }
      if (isSupervisao && rotasProfessor.includes(rotaAtual)) {
        router.replace('/home');
        return;
      }
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
      <Stack.Screen name="indisponibilidade" />
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
