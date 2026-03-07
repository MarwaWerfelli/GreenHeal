import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is currently connected to the internet
 */
export async function isConnected(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('Error checking connectivity:', error);
    // Assume connected if we can't determine
    return true;
  }
}

/**
 * Subscribe to connectivity changes
 * Returns an unsubscribe function
 */
export function subscribeToConnectivity(
  callback: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    const connected = state.isConnected === true && state.isInternetReachable !== false;
    callback(connected);
  });

  return unsubscribe;
}

/**
 * Get current network state details
 */
export async function getNetworkState() {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected === true,
      isInternetReachable: state.isInternetReachable !== false,
      type: state.type,
      details: state.details,
    };
  } catch (error) {
    console.error('Error getting network state:', error);
    return {
      isConnected: true,
      isInternetReachable: true,
      type: 'unknown',
      details: null,
    };
  }
}
