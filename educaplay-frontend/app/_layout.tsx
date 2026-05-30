import 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import AppSplashScreen from '../components/AppSplashScreen';

const BIOMETRIA_KEY = "@educaplay_biometria";
const MIN_JS_SPLASH = 2600; // a JS splash cuida do tempo mínimo

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { usuario, carregando, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [biometriaOk, setBiometriaOk]     = useState(false);
  const [jsSplashOk, setJsSplashOk]       = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);
  const biometriaVerificada = useRef(false);
  const [splashPronto, setSplashPronto]   = useState(false);

  // Esconde splash nativa imediatamente (JS splash cuida do tempo)
  useEffect(() => {
    const t = setTimeout(() => setSplashPronto(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Timer mínimo da splash JS animada (2.6s)
  useEffect(() => {
    const t = setTimeout(() => setJsSplashOk(true), MIN_JS_SPLASH);
    return () => clearTimeout(t);
  }, []);

  // Esconde a splash NATIVA assim que o JS estiver pronto — a animada cuida do resto
  useEffect(() => {
    if (splashPronto) {
      SplashScreen.hideAsync();
    }
  }, [splashPronto]);

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

  const splashVisible = !biometriaOk || !jsSplashOk;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {splashMounted && (
        <AppSplashScreen
          visible={splashVisible}
          onDismiss={() => setSplashMounted(false)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
