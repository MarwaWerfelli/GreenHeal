import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * Returns true if permissions are granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Register notification channels for Android
 * Required for Android 8.0+ to display notifications
 */
export async function registerNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('plant-care', {
      name: 'Plant Care Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D6A4F',
    });
  }
}

/**
 * Schedule a plant care reminder notification
 * Returns the notification ID that can be used to cancel the notification later
 */
export async function schedulePlantReminder(
  plantId: number,
  plantName: string,
  nextWateringDate: Date
): Promise<string> {
  try {
    // Check if we have permission
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission, skipping reminder');
      return '';
    }

    // Don't schedule notifications for past dates
    if (nextWateringDate.getTime() < Date.now()) {
      console.log('Cannot schedule notification for past date');
      return '';
    }

    // Schedule notification at 9 AM on the watering date
    const trigger = new Date(nextWateringDate);
    trigger.setHours(9, 0, 0, 0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Time to Water Your Plant!',
        body: `${plantName.trim()} needs watering today. Don't forget to check on it!`,
        data: {
          plantId,
          plantName: plantName.trim(),
          type: 'plant-care',
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling plant reminder:', error);
    throw new Error('Failed to schedule plant reminder');
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    if (!notificationId) {
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error cancelling reminder:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling all reminders:', error);
  }
}

/**
 * Reschedule a plant reminder (cancel old and schedule new)
 */
export async function reschedulePlantReminder(
  oldNotificationId: string,
  plantId: number,
  plantName: string,
  nextWateringDate: Date
): Promise<string> {
  try {
    // Cancel old notification
    await cancelReminder(oldNotificationId);

    // Schedule new notification
    return await schedulePlantReminder(plantId, plantName, nextWateringDate);
  } catch (error) {
    console.error('Error rescheduling plant reminder:', error);
    throw new Error('Failed to reschedule plant reminder');
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
