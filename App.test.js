import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple test app to verify Expo is working
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🌿 GreenHeal Test</Text>
      <Text style={styles.subtext}>If you see this, Expo is working!</Text>
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
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 18,
    color: '#74C69D',
  },
});
