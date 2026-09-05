/**
 * Notifications — §32: Expo Notifications + FCM + APNs.
 * §10: workout reminders, rest timer, weekly summaries, goal milestones.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification behavior — show alert + sound when app is in foreground.
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Request notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a workout reminder notification.
 */
export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to train! 💪',
      body: "Don't skip today's workout. Your future self will thank you.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/**
 * Schedule a rest timer completion notification (immediate).
 */
export async function sendRestTimerNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest complete ⏱️',
      body: "Time for your next set!",
    },
    trigger: null, // immediate
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel a specific notification by ID.
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
