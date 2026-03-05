import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>🌿 GreenHeal</Text>
      <Text style={styles.subtitle}>Plant-Based Healing Companion</Text>
      <Text style={styles.message}>App is loading successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFAE0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#74C69D',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#52B788',
  },
});
