import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

Sentry.init({
  dsn: 'https://e7544a7e96270de69f204895d145c6bf@o4511488040501248.ingest.us.sentry.io/4511488077987840',
  environment: 'production',
  tracesSampleRate: 0.2,
});
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Componente separado — useUpdates() precisa rodar sempre no mesmo contexto
function OtaWatcher({ onUpdateDisponivel }: { onUpdateDisponivel: () => void }) {
  const Updates = require('expo-updates');
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  // Mostra o modal tanto para update disponível quanto para update já baixado.
  // Novos usuários frequentemente têm isUpdatePending=true ao montar (o nativo
  // baixou antes do React inicializar), então precisamos cobrir os dois casos.
  useEffect(() => {
    if (isUpdateAvailable || isUpdatePending) onUpdateDisponivel();
  }, [isUpdateAvailable, isUpdatePending, onUpdateDisponivel]);

  return null;
}

const BIOMETRIA_KEY = "@educaplay_biometria";

SplashScreen.preventAutoHideAsync();

// Acorda o servidor Render imediatamente ao abrir o app
fetch('https://backend-educaplay.onrender.com/api/ping', { method: 'GET' }).catch(() => {});

function RootNavigator() {
  const { usuario, carregando, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [biometriaOk, setBiometriaOk] = useState(false);
  const biometriaVerificada = useRef(false);

  // Pop-up in-app para notificações de ponto (professor com app aberto)
  const [modalPonto, setModalPonto] = useState<{ visivel: boolean; titulo: string; corpo: string } | null>(null);

  // Modal OTA — controlado pelo OtaWatcher abaixo
  const [atualizacaoDisponivel, setAtualizacaoDisponivel] = useState(false);
  const [aplicandoUpdate, setAplicandoUpdate] = useState(false);

  const aplicarUpdate = async () => {
    if (isExpoGo || Platform.OS === 'web') return;
    setAplicandoUpdate(true);
    try {
      const Updates = require('expo-updates');
      // fetchUpdateAsync baixa o bundle; se já foi baixado (isUpdatePending),
      // pode retornar { isNew: false } ou lançar — tudo bem, ignora e recarrega.
      try { await Updates.fetchUpdateAsync(); } catch {}
      await Updates.reloadAsync();
    } catch {
      setAplicandoUpdate(false);
      setAtualizacaoDisponivel(false);
    }
  };

  useEffect(() => {
    if (isExpoGo || Platform.OS === 'web') return;
    const Notif = require('expo-notifications') as typeof import('expo-notifications');
    const sub = Notif.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as any;
      const titulo = notification.request.content.title ?? '';
      const corpo = notification.request.content.body ?? '';
      const isPonto = data?.tipo === 'ponto' || titulo.toLowerCase().includes('ponto');
      if (isPonto && usuario?.papel === 'Professor') {
        setModalPonto({ visivel: true, titulo, corpo });
      }
    });
    return () => sub.remove();
  }, [usuario]);

  // Esconde splash nativa assim que o app estiver pronto
  useEffect(() => {
    if (biometriaOk) {
      SplashScreen.hideAsync();
    }
  }, [biometriaOk]);

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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {/* OtaWatcher: usa useUpdates() nativo para detectar updates automaticamente */}
      {!isExpoGo && Platform.OS !== 'web' && (
        <OtaWatcher onUpdateDisponivel={() => setAtualizacaoDisponivel(true)} />
      )}

      {/* Modal OTA — bloqueante, força atualização */}
      <Modal visible={atualizacaoDisponivel} transparent animationType="fade">
        <View style={mp.updateOverlay}>
          <View style={mp.updateCard}>
            <View style={mp.updateIconWrap}>
              <Ionicons name="rocket-outline" size={36} color="#3a7d44" />
            </View>
            <Text style={mp.updateTitulo}>Nova versão disponível!</Text>
            <Text style={mp.updateDescricao}>
              Uma atualização foi preparada para você.{"\n"}
              Toque em <Text style={{ fontWeight: "800", color: "#3a7d44" }}>Atualizar agora</Text> para continuar usando o EducaPlay.
            </Text>
            <TouchableOpacity
              style={[mp.updateBtn, aplicandoUpdate && { opacity: 0.7 }]}
              onPress={aplicarUpdate}
              activeOpacity={0.85}
              disabled={aplicandoUpdate}
            >
              {aplicandoUpdate ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={mp.updateBtnText}>Atualizar agora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pop-up in-app: notificação de ponto para professor */}
      <Modal
        visible={!!modalPonto?.visivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalPonto(null)}
      >
        <View style={mp.overlay}>
          <View style={mp.card}>
            <View style={mp.iconWrap}>
              <Ionicons name="time-outline" size={30} color="#3a7d44" />
            </View>
            <Text style={mp.titulo}>{modalPonto?.titulo ?? "Lembrete de Ponto"}</Text>
            <Text style={mp.corpo}>{modalPonto?.corpo}</Text>
            <TouchableOpacity
              style={mp.btnIr}
              activeOpacity={0.85}
              onPress={() => {
                setModalPonto(null);
                router.push("/professor/cronogramas-professor" as any);
              }}
            >
              <Ionicons name="finger-print" size={18} color="#fff" />
              <Text style={mp.btnIrText}>Ir para Cronograma</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mp.btnFechar} activeOpacity={0.7} onPress={() => setModalPonto(null)}>
              <Text style={mp.btnFecharText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);

const mp = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, alignItems: "center", gap: 12,
    paddingBottom: 36,
    elevation: 20,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#bbf7d0",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 18, fontWeight: "800", color: "#1a1a2e",
    textAlign: "center",
  },
  corpo: {
    fontSize: 14, color: "#555", textAlign: "center",
    lineHeight: 22, paddingHorizontal: 8,
  },
  btnIr: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#3a7d44", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 28,
    width: "100%", justifyContent: "center",
    marginTop: 8, elevation: 3,
  },
  btnIrText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  btnFechar: {
    paddingVertical: 10, paddingHorizontal: 24,
  },
  btnFecharText: { fontSize: 14, color: "#888", fontWeight: "600" },
  updateOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 28,
  },
  updateCard: {
    backgroundColor: "#fff", borderRadius: 28, padding: 32,
    alignItems: "center", gap: 12, width: "100%",
    elevation: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20,
  },
  updateIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#bbf7d0",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  updateTitulo: {
    fontSize: 20, fontWeight: "800", color: "#1a1a2e", textAlign: "center",
  },
  updateDescricao: {
    fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22,
    marginBottom: 8,
  },
  updateBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#3a7d44", borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 32,
    width: "100%", justifyContent: "center",
    elevation: 4, marginTop: 4,
  },
  updateBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
