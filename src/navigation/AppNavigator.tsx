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
import GuidedDialogueScreen from '../screens/GuidedDialogueScreen';
import CameraScreen from '../screens/CameraScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import RoomVisualizationScreen from '../screens/RoomVisualizationScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import HealingJournalScreen from '../screens/HealingJournalScreen';
import JournalEntryFormScreen from '../screens/JournalEntryFormScreen';
import JournalEntryDetailScreen from '../screens/JournalEntryDetailScreen';
import MyGardenScreen from '../screens/MyGardenScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ReportPreviewScreen from '../screens/ReportPreviewScreen';
import OfflineIndicator from '../components/OfflineIndicator';
import FloatingActionButton from '../components/FloatingActionButton';
import { DESIGN_SYSTEM } from '../utils/constants';
import type {
  RootStackParamList,
  BottomTabParamList,
  OnboardingData,
  HealingGoal,
  Budget,
  ReportExportRecord,
  ReportProfile,
  ReportHandoffMethod,
  ReportSharingPreferences,
} from '../types';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();
const VALID_HEALING_GOALS: HealingGoal[] = ['stress', 'physical', 'depression', 'sleep', 'wellness'];
const VALID_BUDGETS: Budget[] = ['under10', '10to30', 'over30', 'have_plants'];
const VALID_REPORT_HANDOFF_METHODS: ReportHandoffMethod[] = ['care_team_email', 'hospital_portal', 'print_packet'];
const SCREEN_HEADER_OPTIONS = {
  headerStyle: {
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    shadowColor: 'transparent',
  },
  headerTintColor: DESIGN_SYSTEM.colors.primary,
  headerTitleStyle: {
    fontWeight: '700' as const,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
};

function hasOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function hasOptionalDateString(value: unknown): value is string | undefined {
  return (
    value === undefined ||
    (
      typeof value === 'string' &&
      value.length > 0 &&
      !Number.isNaN(Date.parse(value))
    )
  );
}

function isValidReportProfile(profile: unknown): profile is ReportProfile {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  const candidate = profile as Partial<ReportProfile>;

  return (
    typeof candidate.fullName === 'string' &&
    candidate.fullName.trim().length > 0 &&
    typeof candidate.preferredName === 'string' &&
    candidate.preferredName.trim().length > 0 &&
    hasOptionalString(candidate.age) &&
    hasOptionalString(candidate.hospitalName) &&
    hasOptionalString(candidate.patientId) &&
    hasOptionalString(candidate.careProgram) &&
    hasOptionalString(candidate.clinicianName)
  );
}

function isValidReportExportRecord(record: unknown): record is ReportExportRecord {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const candidate = record as Partial<ReportExportRecord>;

  return (
    typeof candidate.generatedAt === 'string' &&
    candidate.generatedAt.length > 0 &&
    !Number.isNaN(Date.parse(candidate.generatedAt)) &&
    typeof candidate.fileUri === 'string' &&
    candidate.fileUri.trim().length > 0
  );
}

function isValidReportSharingPreferences(preferences: unknown): preferences is ReportSharingPreferences {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  const candidate = preferences as Partial<ReportSharingPreferences>;

  return (
    (candidate.readyForFutureSharing === undefined || typeof candidate.readyForFutureSharing === 'boolean') &&
    hasOptionalDateString(candidate.reviewedAt) &&
    hasOptionalDateString(candidate.consentConfirmedAt) &&
    hasOptionalDateString(candidate.handoffPreparedAt) &&
    hasOptionalDateString(candidate.exportGeneratedAt) &&
    hasOptionalString(candidate.exportFileUri) &&
    (
      candidate.exportHistory === undefined ||
      (
        Array.isArray(candidate.exportHistory) &&
        candidate.exportHistory.every(isValidReportExportRecord)
      )
    ) &&
    (
      candidate.handoffMethod === undefined ||
      VALID_REPORT_HANDOFF_METHODS.includes(candidate.handoffMethod)
    )
  );
}

function isValidOnboardingData(data: unknown): data is OnboardingData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Partial<OnboardingData>;
  const hasValidHealingGoal =
    typeof candidate.healingGoal === 'string' &&
    VALID_HEALING_GOALS.includes(candidate.healingGoal as HealingGoal);
  const hasValidBudget =
    typeof candidate.budget === 'string' &&
    VALID_BUDGETS.includes(candidate.budget as Budget);
  const hasValidCompletedAt =
    typeof candidate.completedAt === 'string' &&
    candidate.completedAt.length > 0 &&
    !Number.isNaN(Date.parse(candidate.completedAt));
  const hasValidExistingPlantPhotos =
    candidate.existingPlantPhotos === undefined ||
    (
      Array.isArray(candidate.existingPlantPhotos) &&
      candidate.existingPlantPhotos.every(photo => typeof photo === 'string')
    );
  const hasValidReportProfile =
    candidate.reportProfile === undefined || isValidReportProfile(candidate.reportProfile);
  const hasValidReportSharing =
    candidate.reportSharing === undefined || isValidReportSharingPreferences(candidate.reportSharing);

  return (
    hasValidHealingGoal &&
    hasValidBudget &&
    hasValidCompletedAt &&
    hasValidExistingPlantPhotos &&
    hasValidReportProfile &&
    hasValidReportSharing
  );
}

// Custom floating tab bar component
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();

  return (
    <View style={tabBarStyles.container}>
      <BlurView intensity={60} tint="light" style={tabBarStyles.blurContainer}>
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
            const color = isFocused
              ? DESIGN_SYSTEM.colors.primary
              : DESIGN_SYSTEM.colors.textSecondary;

            return (
              <View key={route.key} style={tabBarStyles.tab}>
                <View
                  accessible
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onTouchEnd={onPress}
                  style={[
                    tabBarStyles.tabButton,
                    isFocused && tabBarStyles.tabButtonFocused,
                  ]}
                >
                  <View
                    style={[
                      tabBarStyles.iconShell,
                      isFocused && tabBarStyles.iconShellFocused,
                    ]}
                  >
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <Text
                    style={[
                      tabBarStyles.tabLabel,
                      { color },
                      isFocused && tabBarStyles.tabLabelFocused,
                    ]}
                  >
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
          onPress={() => navigation.navigate('GuidedDialogue')}
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
        screenOptions={SCREEN_HEADER_OPTIONS}
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

type ReadyNavigatorProps = {
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: React.Dispatch<React.SetStateAction<boolean>>;
};

function ReadyNavigator({
  isOnboardingComplete,
  setIsOnboardingComplete,
}: ReadyNavigatorProps) {
  const { t } = useTranslation();

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
              name="GuidedDialogue"
              component={GuidedDialogueScreen}
              options={{
                title: t('guidedDialogue.title'),
                ...SCREEN_HEADER_OPTIONS,
              }}
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
              name="Feedback"
              component={FeedbackScreen}
              options={{
                title: t('feedback.title'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen
              name="ReportPreview"
              component={ReportPreviewScreen}
              options={{
                title: t('reportPreview.title'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen 
              name="AIAnalysis" 
              component={AIAnalysisScreen}
              options={{ 
                title: t('aiAnalysis.title'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen 
              name="RoomVisualization" 
              component={RoomVisualizationScreen}
              options={{ 
                title: t('aiAnalysis.yourRoom'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen 
              name="PlantDetail" 
              component={PlantDetailScreen}
              options={{ 
                title: t('plantDetail.title'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen 
              name="JournalEntryForm" 
              component={JournalEntryFormScreen}
              options={{ 
                title: t('journal.newEntryTitle'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
            <Stack.Screen 
              name="JournalEntryDetail" 
              component={JournalEntryDetailScreen}
              options={{ 
                title: t('journal.entryTitle'),
                ...SCREEN_HEADER_OPTIONS,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
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
          const hasValidOnboarding = isValidOnboardingData(onboardingData);
          console.log(
            'Onboarding data:',
            hasValidOnboarding ? 'valid' : onboardingData ? 'invalid' : 'not found'
          );

          if (onboardingData && !hasValidOnboarding) {
            console.warn('Invalid onboarding data detected, clearing stored onboarding state');
            await clearOnboardingData();
          }

          setIsOnboardingComplete(hasValidOnboarding);
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
      <View style={appStateStyles.screen}>
        <View style={appStateStyles.card}>
          <Text style={appStateStyles.icon}>⚠️</Text>
          <Text style={appStateStyles.title}>Something interrupted GreenHeal</Text>
          <Text style={appStateStyles.message}>{error}</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={appStateStyles.screen}>
        <View style={appStateStyles.card}>
          <Text style={appStateStyles.icon}>🌿</Text>
          <Text style={appStateStyles.brand}>GreenHeal</Text>
          <Text style={appStateStyles.message}>Preparing your healing journey...</Text>
        </View>
      </View>
    );
  }

  return (
    <ReadyNavigator
      isOnboardingComplete={isOnboardingComplete}
      setIsOnboardingComplete={setIsOnboardingComplete}
    />
  );
}

// Floating tab bar styles - healing journey shell
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
    borderTopColor: DESIGN_SYSTEM.colors.glassBorder,
    backgroundColor: DESIGN_SYSTEM.colors.glassOverlay,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: DESIGN_SYSTEM.colors.glassOverlay,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
  },
  tabButtonFocused: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  iconShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconShellFocused: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: '50%',
    marginLeft: -32, // Half of FAB size (64/2)
    zIndex: 10,
  },
});

const appStateStyles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.xl,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  icon: {
    fontSize: 30,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginTop: DESIGN_SYSTEM.spacing.sm,
  },
});
