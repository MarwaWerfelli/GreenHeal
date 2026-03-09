import { Animated, Easing } from 'react-native';

/**
 * Animation System
 * 
 * Provides reusable animation helpers for consistent animations throughout the app.
 * All animations use native driver for 60fps performance.
 */

// Animation constants
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const SPRING_CONFIG = {
  tension: 100,
  friction: 10,
  useNativeDriver: true,
};

/**
 * Screen transition animation (fade + slide)
 * Used for screen navigation transitions
 */
export const createScreenTransition = (animatedValue: Animated.Value) => {
  return {
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };
};

export const runScreenTransition = (animatedValue: Animated.Value) => {
  animatedValue.setValue(0);
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: ANIMATION_DURATION.normal,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

/**
 * Modal transition animation (slide up from bottom)
 * Used for modal dialogs and bottom sheets
 */
export const createModalTransition = (animatedValue: Animated.Value) => {
  return {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
  };
};

export const runModalSlideIn = (animatedValue: Animated.Value) => {
  animatedValue.setValue(0);
  Animated.spring(animatedValue, {
    toValue: 1,
    ...SPRING_CONFIG,
  }).start();
};

export const runModalSlideOut = (
  animatedValue: Animated.Value,
  onComplete?: () => void
) => {
  Animated.timing(animatedValue, {
    toValue: 0,
    duration: ANIMATION_DURATION.fast,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start(onComplete);
};

/**
 * Button press animation (scale down)
 * Used for interactive buttons and cards
 */
export const createPressAnimation = (animatedValue: Animated.Value) => {
  return {
    transform: [{ scale: animatedValue }],
  };
};

export const runPressIn = (animatedValue: Animated.Value) => {
  Animated.spring(animatedValue, {
    toValue: 0.95,
    ...SPRING_CONFIG,
  }).start();
};

export const runPressOut = (animatedValue: Animated.Value) => {
  Animated.spring(animatedValue, {
    toValue: 1,
    ...SPRING_CONFIG,
  }).start();
};

/**
 * Card tap animation (elevation change)
 * Used for card components with tap interactions
 */
export const createCardTapAnimation = (animatedValue: Animated.Value) => {
  return {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        }),
      },
    ],
  };
};

export const runCardTapIn = (animatedValue: Animated.Value) => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: 100,
    useNativeDriver: true,
  }).start();
};

export const runCardTapOut = (animatedValue: Animated.Value) => {
  Animated.timing(animatedValue, {
    toValue: 0,
    duration: 100,
    useNativeDriver: true,
  }).start();
};

/**
 * Swipe reveal animation (spring physics)
 * Used for swipeable components
 */
export const createSwipeRevealAnimation = (animatedValue: Animated.Value) => {
  return {
    transform: [{ translateX: animatedValue }],
  };
};

export const runSwipeReveal = (
  animatedValue: Animated.Value,
  toValue: number
) => {
  Animated.spring(animatedValue, {
    toValue,
    ...SPRING_CONFIG,
  }).start();
};

export const runSwipeReset = (animatedValue: Animated.Value) => {
  Animated.spring(animatedValue, {
    toValue: 0,
    ...SPRING_CONFIG,
  }).start();
};

/**
 * Fade animation
 * Used for showing/hiding elements
 */
export const runFadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal
) => {
  animatedValue.setValue(0);
  Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  }).start();
};

export const runFadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.normal,
  onComplete?: () => void
) => {
  Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  }).start(onComplete);
};

/**
 * Bounce animation
 * Used for emoji selections and success indicators
 */
export const runBounce = (animatedValue: Animated.Value) => {
  animatedValue.setValue(1);
  Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.2,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }),
  ]).start();
};

/**
 * Pulse animation (continuous loop)
 * Used for attention-grabbing elements like FAB
 */
export const runPulse = (animatedValue: Animated.Value) => {
  animatedValue.setValue(1);
  Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();
};

/**
 * Shimmer animation (loading skeleton)
 * Used for loading states
 */
export const runShimmer = (animatedValue: Animated.Value) => {
  animatedValue.setValue(0);
  Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
};

export const createShimmerAnimation = (animatedValue: Animated.Value) => {
  return {
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.6, 0.3],
    }),
  };
};
