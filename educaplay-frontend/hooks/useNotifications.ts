import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../src/services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registrarPushToken() {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;

  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;
  if (existente !== 'granted') {
    const { status: novo } = await Notifications.requestPermissionsAsync();
    status = novo;
  }
  if (status !== 'granted') return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await api.put('/auth/push-token', { token });
  } catch (e) {
    console.warn('Push token não obtido:', e);
  }
}

export async function agendarLembretes(aulas: Array<{ subject: string; timeStart: string }>) {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const aula of aulas) {
    const [hStr, mStr] = aula.timeStart.split(':');
    const hora = parseInt(hStr, 10);
    const minuto = parseInt(mStr, 10);

    // Lembrete 15 minutos antes da aula
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
      trigger: {
        hour: horaLembrete,
        minute: minLembrete,
        repeats: true,
      } as any,
    });
  }
}

export async function cancelarLembretes() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
