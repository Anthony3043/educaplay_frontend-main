import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../src/services/api';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

function getNotif() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

// Configura handler e canais Android logo que o módulo carrega
if (Platform.OS !== 'web' && !isExpoGo) {
  const Notif = getNotif();

  Notif.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowAlert: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Canais Android (obrigatório Android 8+)
  if (Platform.OS === 'android') {
    // IDs _v2 forçam recriação dos canais com som — Android trava configurações do canal original
    Notif.setNotificationChannelAsync('geral_v2', {
      name: 'Geral',
      importance: Notif.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lightColor: '#3a7d44',
      sound: 'default',
      showBadge: true,
    });
    Notif.setNotificationChannelAsync('avisos_v2', {
      name: 'Avisos de Professores',
      importance: Notif.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      enableVibrate: true,
      lightColor: '#f97316',
      sound: 'default',
      showBadge: true,
    });
    Notif.setNotificationChannelAsync('ponto_v2', {
      name: 'Registro de Ponto',
      importance: Notif.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lightColor: '#3b82f6',
      sound: 'default',
      showBadge: true,
    });
  }
}

export async function registrarPushToken() {
  if (Platform.OS === 'web' || isExpoGo || !Device.isDevice) return;

  const Notifications = getNotif();

  const perms = await Notifications.getPermissionsAsync() as any;
  let isGranted: boolean = perms.granted;
  if (!isGranted) {
    const resultado = await Notifications.requestPermissionsAsync() as any;
    isGranted = resultado.granted;
  }
  if (!isGranted) return;

  try {
    // Busca projectId de múltiplas fontes para garantir que funciona em produção
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '82bd4f03-c8df-487b-80a1-928dee68f7db'; // fallback fixo do projeto

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Token obtido:', tokenData.data);
    await api.put('/auth/push-token', { token: tokenData.data });
    console.log('[Push] Token salvo no servidor');
  } catch (e) {
    console.warn('[Push] Erro ao obter/salvar token:', e);
  }
}

export async function agendarLembretes(aulas: { subject: string; timeStart: string }[]) {
  if (Platform.OS === 'web' || isExpoGo) return;

  const Notifications = getNotif();
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const aula of aulas) {
    const [hStr, mStr] = aula.timeStart.split(':');
    const hora = parseInt(hStr, 10);
    const minuto = parseInt(mStr, 10);

    let minLembrete = minuto - 15;
    let horaLembrete = hora;
    if (minLembrete < 0) { minLembrete += 60; horaLembrete -= 1; }
    if (horaLembrete < 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de Aula',
        body: `Sua aula de "${aula.subject}" começa em 15 minutos (${aula.timeStart}).`,
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'geral' }),
      },
      trigger: { hour: horaLembrete, minute: minLembrete, repeats: true } as any,
    });
  }
}

export async function cancelarLembretes() {
  if (Platform.OS === 'web' || isExpoGo) return;
  getNotif().cancelAllScheduledNotificationsAsync();
}
