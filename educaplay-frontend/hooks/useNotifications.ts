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
    Notif.setNotificationChannelAsync('geral', {
      name: 'Geral',
      importance: Notif.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3a7d44',
      sound: 'default',
    });
    Notif.setNotificationChannelAsync('avisos', {
      name: 'Avisos de Professores',
      importance: Notif.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#f97316',
      sound: 'default',
    });
    Notif.setNotificationChannelAsync('ponto', {
      name: 'Registro de Ponto',
      importance: Notif.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      sound: 'default',
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
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await api.put('/auth/push-token', { token: tokenData.data });
  } catch (e) {
    console.warn('Push token não obtido:', e);
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
        title: '⏰ Lembrete de aula',
        body: `Sua aula de "${aula.subject}" começa em 15 minutos (${aula.timeStart}).`,
        sound: true,
      },
      trigger: { hour: horaLembrete, minute: minLembrete, repeats: true } as any,
    });
  }
}

export async function cancelarLembretes() {
  if (Platform.OS === 'web' || isExpoGo) return;
  getNotif().cancelAllScheduledNotificationsAsync();
}
