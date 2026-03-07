// Stub notifications module for Expo Go compatibility
// Real notifications will work in the built APK

/**
 * Request notification permissions from the user
 * Returns true if permissions are granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  console.log('Notifications: Stub mode (Expo Go)');
  return false;
}

/**
 * Register notification channels for Android
 * Required for Android 8.0+ to display notifications
 */
export async function registerNotificationChannels(): Promise<void> {
  console.log('Notifications: Stub mode (Expo Go)');
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
  console.log(`Notifications: Would schedule reminder for ${plantName} (Stub mode)`);
  return '';
}

/**
 * Cancel a scheduled notification
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  console.log('Notifications: Stub mode (Expo Go)');
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
  console.log('Notifications: Stub mode (Expo Go)');
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
  console.log(`Notifications: Would reschedule reminder for ${plantName} (Stub mode)`);
  return '';
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  return false;
}
