import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DESIGN_SYSTEM } from '../utils/constants';
import * as SQLite from 'expo-sqlite';

interface MoodData {
  day: string;
  score: number;
}

function MoodChart() {
  const { t } = useTranslation();
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [average, setAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const animatedValues = useRef<Animated.Value[]>([]).current;
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadMoodData();

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const loadMoodData = async () => {
    try {
      setIsLoading(true);
      const db = await SQLite.openDatabaseAsync('greenheal.db');
      
      // Get last 7 days of mood check-ins
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const rows = await db.getAllAsync<{ mood_score: number; created_at: string }>(
        'SELECT mood_score, created_at FROM mood_checkins WHERE created_at >= ? ORDER BY created_at ASC',
        [sevenDaysAgo.toISOString()]
      );

      // Group by day and get average for each day
      const dayMap = new Map<string, number[]>();
      
      rows.forEach(row => {
        const date = new Date(row.created_at);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, []);
        }
        dayMap.get(dayKey)!.push(row.mood_score);
      });

      // Calculate averages and prepare data
      const data: MoodData[] = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      
      // Get last 7 days in order
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        const dayName = days[dayIndex];
        const scores = dayMap.get(dayName) || [];
        const avgScore = scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0;
        
        data.push({ day: dayName, score: avgScore });
      }

      setMoodData(data);

      // Calculate overall average
      const allScores = Array.from(dayMap.values()).flat();
      const avg = allScores.length > 0
        ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
        : 0;
      setAverage(Math.round(avg * 10) / 10);

      // Initialize animated values
      if (data.length > 0) {
        // Clear any existing values
        animatedValues.splice(0, animatedValues.length);
        // Add new values for each data point
        data.forEach(() => {
          animatedValues.push(new Animated.Value(0));
        });
        
        // Animate bars after state is set
        animationTimeoutRef.current = setTimeout(() => {
          if (animatedValues.length > 0) {
            Animated.stagger(
              100,
              animatedValues.map(anim =>
                Animated.spring(anim, {
                  toValue: 1,
                  friction: 4,
                  tension: 40,
                  useNativeDriver: false,
                })
              )
            ).start();
          }
        }, 100);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading mood data:', error);
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return null;
  }

  if (moodData.length === 0 || moodData.every(d => d.score === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {t('home.trackMoodDaily')}
        </Text>
      </View>
    );
  }

  const maxScore = 5;
  const chartWidth = Dimensions.get('window').width - DESIGN_SYSTEM.spacing.md * 4;
  const barWidth = (chartWidth - DESIGN_SYSTEM.spacing.sm * 6) / 7;

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Mood chart showing ${moodData.filter(d => d.score > 0).length} days of data. Weekly average: ${average.toFixed(1)} out of 5`}
    >
      <View style={styles.chartContainer}>
        {moodData.map((data, index) => {
          const barHeight = (data.score / maxScore) * 100;
          const animValue = animatedValues.length > index ? animatedValues[index] : null;
          const animatedHeight = animValue ? animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, barHeight],
          }) : barHeight;

          // Color based on mood score
          let barColor = DESIGN_SYSTEM.colors.textSecondary;
          if (data.score >= 4) barColor = DESIGN_SYSTEM.colors.success;
          else if (data.score >= 3) barColor = DESIGN_SYSTEM.colors.warning;
          else if (data.score > 0) barColor = DESIGN_SYSTEM.colors.error;

          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: animatedHeight,
                      backgroundColor: barColor,
                      width: barWidth,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{data.day}</Text>
            </View>
          );
        })}
      </View>
      
      {average > 0 && (
        <Text style={styles.averageText}>
          Weekly average: {average.toFixed(1)} / 5
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: DESIGN_SYSTEM.borderRadius.small,
    borderTopRightRadius: DESIGN_SYSTEM.borderRadius.small,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginTop: DESIGN_SYSTEM.spacing.xs,
    fontWeight: '500',
  },
  averageText: {
    textAlign: 'center',
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginTop: DESIGN_SYSTEM.spacing.md,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: DESIGN_SYSTEM.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
  },
});


// Memoize to prevent unnecessary re-renders
export default React.memo(MoodChart);
