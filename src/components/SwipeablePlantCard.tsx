import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PlantCard from './PlantCard';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { GardenPlant } from '../types';

interface SwipeablePlantCardProps {
  plant: GardenPlant;
  layout: 'grid' | 'list';
  onPress: () => void;
  onWater: (plant: GardenPlant) => void;
}

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 80;

export default function SwipeablePlantCard({
  plant,
  layout,
  onPress,
  onWater,
}: SwipeablePlantCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          const clampedDx = Math.max(gestureState.dx, SWIPE_THRESHOLD);
          translateX.setValue(clampedDx);
          
          // Fade in action button as user swipes
          const opacity = Math.min(Math.abs(clampedDx) / Math.abs(SWIPE_THRESHOLD), 1);
          actionOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD / 2) {
          // Swipe far enough - reveal action
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          
          Animated.timing(actionOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // Swipe not far enough - reset
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    Animated.timing(actionOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleWaterPress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show success animation
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the water handler
    onWater(plant);
  };

  return (
    <View style={styles.container}>
      {/* Action Button (behind the card) */}
      <Animated.View
        style={[
          styles.actionContainer,
          {
            opacity: actionOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleWaterPress}
          activeOpacity={0.8}
          accessibilityLabel="Water plant"
          accessibilityHint="Tap to mark this plant as watered"
          accessibilityRole="button"
        >
          <Ionicons name="water" size={24} color={DESIGN_SYSTEM.colors.surface} />
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
        accessible={true}
        accessibilityLabel={`${plant.name} card`}
        accessibilityHint="Swipe left to reveal water action"
      >
        <PlantCard plant={plant} layout={layout} onPress={onPress} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  actionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  cardContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
  },
});
