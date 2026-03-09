import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { DESIGN_SYSTEM } from '../utils/constants';
import { runShimmer, createShimmerAnimation } from '../utils/animations';

interface SkeletonScreenProps {
  type?: 'list' | 'card' | 'detail';
}

export default function SkeletonScreen({ type = 'list' }: SkeletonScreenProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    runShimmer(shimmerAnim);
  }, []);

  const shimmerStyle = createShimmerAnimation(shimmerAnim);

  if (type === 'card') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.card, shimmerStyle]} />
        <Animated.View style={[styles.card, shimmerStyle]} />
      </View>
    );
  }

  if (type === 'detail') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.title, shimmerStyle]} />
        <Animated.View style={[styles.section, shimmerStyle]} />
        <Animated.View style={[styles.section, shimmerStyle]} />
        <Animated.View style={[styles.section, shimmerStyle]} />
      </View>
    );
  }

  // Default: list type
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.listItem, shimmerStyle]} />
      <Animated.View style={[styles.listItem, shimmerStyle]} />
      <Animated.View style={[styles.listItem, shimmerStyle]} />
      <Animated.View style={[styles.listItem, shimmerStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: DESIGN_SYSTEM.spacing.md,
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  card: {
    height: 200,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  listItem: {
    height: 80,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  title: {
    height: 32,
    width: '60%',
    borderRadius: DESIGN_SYSTEM.borderRadius.small,
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  section: {
    height: 100,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
});
