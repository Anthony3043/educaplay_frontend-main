import 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIA_KEY = "@educaplay_biometria";
const MIN_SPLASH_MS = 400; // tempo mínimo da splash nativa antes de revelar a JS

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { usuario, carregando, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [biometriaOk, setBiometriaOk] = useState(false);
  const biometriaVerificada = useRef(false);
  const [splashPronto, setSplashPronto] = useState(false);
  const splashStartTime = useRef(Date.now());

  // Timer mínimo: garante que o splash apareça por pelo menos 2 s
  useEffect(() => {
    const elapsed = Date.now() - splashStartTime.current;
    const delay = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = setTimeout(() => setSplashPronto(true), delay);
    return () => clearTimeout(t);
  }, []);

  // Oculta o splash somente quando o app estiver pronto E o timer mínimo tiver passado
  useEffect(() => {
    if (biometriaOk && splashPronto) {
      SplashScreen.hideAsync();
    }
  }, [biometriaOk, splashPronto]);

  useEffect(() => {
    if (carregando) return;
    if (biometriaVerificada.current) return;
    biometriaVerificada.current = true;

    const checarBiometria = async () => {
      if (!usuario) {
        setBiometriaOk(true);
        return;
      }
      const salvo = await AsyncStorage.getItem(BIOMETRIA_KEY);
      if (salvo !== "true") {
        setBiometriaOk(true);
        return;
      }
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua identidade para acessar o EducaPlay",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar senha",
      });
      if (resultado.success) {
        setBiometriaOk(true);
      } else {
        await logout();
        setBiometriaOk(true);
      }
    };

    checarBiometria();
  }, [carregando, usuario, logout]);

  useEffect(() => {
    if (carregando || !biometriaOk) return;

    // segments[0] agora é o nome da pasta: 'auth', 'supervisao', 'professor', 'shared' ou 'index'
    const grupo = (segments[0] as string) ?? 'index';
    const estaEmRotaPublica = grupo === 'auth' || grupo === 'index';

    if (!usuario && !estaEmRotaPublica) {
      router.replace('/auth/Login');
      return;
    }

    if (usuario) {
      const isProfessor = usuario.papel === 'Professor';
      const isSupervisao = usuario.papel === 'Supervisao';

      if (isProfessor && grupo === 'supervisao') {
        router.replace('/professor/home-professor');
        return;
      }
      if (isSupervisao && grupo === 'professor') {
        router.replace('/supervisao/home');
        return;
      }
    }
  }, [usuario, carregando, segments, biometriaOk, router]);

  if (!biometriaOk) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3a7d44' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
