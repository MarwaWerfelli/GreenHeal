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

// ============================================================================
// Watering Reminder Service Enhancement
// ============================================================================

/**
 * Schedule a watering reminder for a plant
 * Creates a notification with plant name, last watered info, and action buttons
 */
export async function scheduleWateringReminder(plant: {
  id: number;
  name: string;
  nextWateringDate?: string;
  lastWateredDate?: string;
  reminderTime?: string;
}): Promise<string> {
  try {
    // Check if we have permission
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission, skipping watering reminder');
      return '';
    }

    // Validate next watering date
    if (!plant.nextWateringDate) {
      console.log('No next watering date provided, skipping reminder');
      return '';
    }

    const nextWateringDate = new Date(plant.nextWateringDate);
    
    // Don't schedule notifications for past dates
    if (nextWateringDate.getTime() < Date.now()) {
      console.log('Cannot schedule notification for past date');
      return '';
    }

    // Set the reminder time (default to 9:00 AM if not specified)
    const [hours, minutes] = (plant.reminderTime || '09:00').split(':').map(Number);
    const trigger = new Date(nextWateringDate);
    trigger.setHours(hours, minutes, 0, 0);

    // Create notification content with last watered info
    let bodyText = `${plant.name} needs watering today.`;
    if (plant.lastWateredDate) {
      const lastWatered = new Date(plant.lastWateredDate);
      const daysAgo = Math.floor((Date.now() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      bodyText += ` Last watered ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago.`;
    }

    // Schedule notification with action buttons
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Time to Water Your Plant!',
        body: bodyText,
        data: {
          plantId: plant.id,
          plantName: plant.name,
          type: 'watering-reminder',
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'watering-reminder',
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling watering reminder:', error);
    // Don't throw - handle gracefully
    return '';
  }
}

/**
 * Cancel a watering reminder for a specific plant
 */
export async function cancelWateringReminder(plantId: number): Promise<void> {
  try {
    // Get all scheduled notifications
    const scheduled = await getScheduledNotifications();
    
    // Find and cancel notifications for this plant
    for (const notification of scheduled) {
      const data = notification.content.data as { plantId?: number; type?: string };
      if (data?.plantId === plantId && data?.type === 'watering-reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error cancelling watering reminder:', error);
    // Don't throw - handle gracefully
  }
}

/**
 * Reschedule a watering reminder with a delay (for snooze functionality)
 */
export async function rescheduleWateringReminder(
  plantId: number,
  delayMinutes: number
): Promise<string> {
  try {
    // Check if we have permission
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission, skipping reschedule');
      return '';
    }

    // Cancel existing reminder
    await cancelWateringReminder(plantId);

    // Get all scheduled notifications to find the plant info
    const scheduled = await getScheduledNotifications();
    let plantName = 'Your plant';
    
    for (const notification of scheduled) {
      const data = notification.content.data as { plantId?: number; plantName?: string };
      if (data?.plantId === plantId) {
        plantName = data.plantName || plantName;
        break;
      }
    }

    // Schedule new notification with delay
    const trigger = new Date(Date.now() + delayMinutes * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Watering Reminder (Snoozed)',
        body: `${plantName} still needs watering. Don't forget!`,
        data: {
          plantId,
          plantName,
          type: 'watering-reminder',
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'watering-reminder',
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error rescheduling watering reminder:', error);
    // Don't throw - handle gracefully
    return '';
  }
}

/**
 * Set up notification categories with actions for watering reminders
 * Should be called during app initialization
 */
export async function setupWateringReminderCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync('watering-reminder', [
      {
        identifier: 'water-now',
        buttonTitle: 'Water Now',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'snooze-1h',
        buttonTitle: 'Snooze 1h',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (error) {
    console.error('Error setting up watering reminder categories:', error);
    // Don't throw - handle gracefully
  }
}

/**
 * Handle notification response for watering reminder actions
 * Returns the action identifier and plant ID
 */
export function handleWateringReminderResponse(
  response: Notifications.NotificationResponse
): { action: string; plantId: number } | null {
  try {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as { plantId?: number; type?: string };
    
    // Only handle watering reminder notifications
    if (data?.type !== 'watering-reminder' || !data.plantId) {
      return null;
    }

    return {
      action: actionIdentifier,
      plantId: data.plantId,
    };
  } catch (error) {
    console.error('Error handling watering reminder response:', error);
    return null;
  }
}

/**
 * Set up notification response listener for watering reminders
 * This should be called during app initialization
 * Returns a subscription that should be removed on cleanup
 */
export function setupWateringReminderListener(
  onWaterNow: (plantId: number) => Promise<void>,
  onSnooze: (plantId: number) => Promise<void>
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const result = handleWateringReminderResponse(response);
    
    if (!result) {
      return;
    }

    const { action, plantId } = result;

    try {
      switch (action) {
        case 'water-now':
          await onWaterNow(plantId);
          break;
        case 'snooze-1h':
          await onSnooze(plantId);
          break;
        case 'dismiss':
          // Just dismiss, no action needed
          break;
        default:
          // Default action (tapping notification) - treat as water now
          if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            await onWaterNow(plantId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  });
}
