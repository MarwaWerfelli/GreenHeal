import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { subscribeToConnectivity } from '../modules/connectivity';
import { DESIGN_SYSTEM } from '../utils/constants';

const colors = DESIGN_SYSTEM.colors;
const shadows = DESIGN_SYSTEM.shadows;

export default function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((connected) => {
      setIsOffline(!connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📡 {t('offline.indicator')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  text: {
    color: colors.bgSurface,
    fontSize: 14,
    fontWeight: '600',
  },
});
