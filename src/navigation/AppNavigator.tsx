import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { getOnboardingData, clearOnboardingData, initDatabase } from '../modules/storage';
import { init as initI18n } from '../i18n';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import RoomVisualizationScreen from '../screens/RoomVisualizationScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import HealingJournalScreen from '../screens/HealingJournalScreen';
import JournalEntryFormScreen from '../screens/JournalEntryFormScreen';
import JournalEntryDetailScreen from '../screens/JournalEntryDetailScreen';
import MyGardenScreen from '../screens/MyGardenScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OfflineIndicator from '../components/OfflineIndicator';
import FloatingActionButton from '../components/FloatingActionButton';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { RootStackParamList, BottomTabParamList } from '../types';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom floating tab bar component
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();

  return (
    <View style={tabBarStyles.container}>
      <BlurView intensity={80} tint="light" style={tabBarStyles.blurContainer}>
        <View style={tabBarStyles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Icon mapping
            const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: 'home',
              MyGarden: 'leaf',
              HealingJournal: 'book',
              Settings: 'settings',
            };

            const icon = iconMap[route.name] || 'help-circle';
            const color = isFocused ? DESIGN_SYSTEM.colors.primary : DESIGN_SYSTEM.colors.textLight;

            return (
              <View key={route.key} style={tabBarStyles.tab}>
                <View
                  accessible
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onTouchEnd={onPress}
                  style={tabBarStyles.tabButton}
                >
                  <Ionicons name={icon} size={24} color={color} />
                  <Text style={[tabBarStyles.tabLabel, { color }]}>
                    {options.tabBarLabel as string}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </BlurView>
      
      {/* Floating Action Button */}
      <View style={tabBarStyles.fabContainer}>
        <FloatingActionButton
          onPress={() => navigation.navigate('Camera')}
          icon="camera"
        />
      </View>
    </View>
  );
}

function MainTabs() {
  const { t } = useTranslation();

  return (
    <>
      <OfflineIndicator />
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: DESIGN_SYSTEM.colors.background,
          },
          headerTintColor: DESIGN_SYSTEM.colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: t('home.title'),
            tabBarLabel: t('home.title'),
          }}
        />
        <Tab.Screen
          name="MyGarden"
          component={MyGardenScreen}
          options={{
            title: t('garden.title'),
            tabBarLabel: t('garden.title'),
          }}
        />
        <Tab.Screen
          name="HealingJournal"
          component={HealingJournalScreen}
          options={{
            title: t('journal.title'),
            tabBarLabel: t('journal.title'),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t('settings.title'),
            tabBarLabel: t('settings.title'),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        console.log('Starting app initialization...');
        
        // Initialize i18n
        await initI18n();
        console.log('i18n initialized');

        // Initialize SQLite database — non-fatal: app still opens if DB fails
        // (garden/journal features will show their own error when accessed)
        try {
          await initDatabase();
          console.log('Database initialized');
        } catch (dbError) {
          console.warn('Database init failed (non-fatal):', dbError);
        }

        // Check if onboarding is complete
        try {
          const onboardingData = await getOnboardingData();
          console.log('Onboarding data:', onboardingData ? 'exists' : 'not found');
          setIsOnboardingComplete(!!onboardingData);
        } catch (storageError) {
          // If there's a storage error (e.g., corrupted data), clear it and start fresh
          console.warn('Storage error detected, clearing corrupted data:', storageError);
          await clearOnboardingData();
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboarding();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DESIGN_SYSTEM.colors.background, padding: 20 }}>
        <Text style={{ fontSize: 24, color: 'red', marginBottom: 10 }}>⚠️</Text>
        <Text style={{ fontSize: 18, color: 'red', fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.textSecondary, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DESIGN_SYSTEM.colors.background }}>
        <Text style={{ fontSize: 24, color: DESIGN_SYSTEM.colors.primary, marginBottom: 10 }}>🌿</Text>
        <Text style={{ fontSize: 18, color: DESIGN_SYSTEM.colors.primary, fontWeight: 'bold' }}>GreenHeal</Text>
        <Text style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.textSecondary, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isOnboardingComplete ? (
          <>
            <Stack.Screen 
              name="LanguageSelection"
              options={{ headerShown: false }}
            >
              {(props) => (
                <LanguageSelectionScreen
                  {...props}
                  onLanguageSelected={() => {
                    props.navigation.navigate('Onboarding');
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="Onboarding"
              options={{ headerShown: false }}
            >
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={() => {
                    setIsOnboardingComplete(true);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{ 
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="AIAnalysis" 
              component={AIAnalysisScreen}
              options={{ 
                title: t('aiAnalysis.title'),
                headerStyle: {
                  backgroundColor: DESIGN_SYSTEM.colors.background,
                },
                headerTintColor: DESIGN_SYSTEM.colors.primary,
              }}
            />
            <Stack.Screen 
              name="RoomVisualization" 
              component={RoomVisualizationScreen}
              options={{ 
                title: t('aiAnalysis.yourRoom'),
                headerStyle: {
                  backgroundColor: DESIGN_SYSTEM.colors.background,
                },
                headerTintColor: DESIGN_SYSTEM.colors.primary,
              }}
            />
            <Stack.Screen 
              name="PlantDetail" 
              component={PlantDetailScreen}
              options={{ 
                title: t('plantDetail.title'),
                headerStyle: {
                  backgroundColor: DESIGN_SYSTEM.colors.background,
                },
                headerTintColor: DESIGN_SYSTEM.colors.primary,
              }}
            />
            <Stack.Screen 
              name="JournalEntryForm" 
              component={JournalEntryFormScreen}
              options={{ 
                title: t('journal.newEntryTitle'),
                headerStyle: {
                  backgroundColor: DESIGN_SYSTEM.colors.background,
                },
                headerTintColor: DESIGN_SYSTEM.colors.primary,
              }}
            />
            <Stack.Screen 
              name="JournalEntryDetail" 
              component={JournalEntryDetailScreen}
              options={{ 
                title: t('journal.entryTitle'),
                headerStyle: {
                  backgroundColor: DESIGN_SYSTEM.colors.background,
                },
                headerTintColor: DESIGN_SYSTEM.colors.primary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Floating tab bar styles - Fresh light theme
const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
  },
  blurContainer: {
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.medium,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.borderSubtle,
    backgroundColor: '#ffffff',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: '50%',
    marginLeft: -32, // Half of FAB size (64/2)
    zIndex: 10,
  },
});
