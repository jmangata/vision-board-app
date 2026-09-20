// Service de notifications locales Expo.
// Gère la demande de permission et la planification de rappels locaux liés
// aux échéances des objectifs (aucune infrastructure serveur requise).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Comportement des notifications reçues pendant que l'app est au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Demande la permission d'afficher des notifications (iOS + Android 13+)
// et crée le canal Android. À appeler une fois au démarrage de l'app.
export async function initNotifications() {
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    finalStatus = res.status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return finalStatus === 'granted';
}

// Programme un rappel local la veille de l'échéance d'un objectif à 9h00,
// avec un message incitant l'utilisateur à terminer son objectif.
// Ne fait rien si la date est absente, déjà passée ou si la permission est refusée.
export async function scheduleGoalReminder(goal) {
  if (!goal?.targetDate) return null;
  const trigger = new Date(goal.targetDate);
  trigger.setDate(trigger.getDate() - 1);
  trigger.setHours(9, 0, 0, 0);
  if (trigger.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Échéance proche',
      body: `Plus qu'un jour pour terminer « ${goal.title} ». Encore un effort, vous êtes presque au bout !`,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger,
  });
}

// Annule le rappel précédemment planifié pour un objectif (ex. suppression).
export async function cancelGoalReminder(notificationId) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
