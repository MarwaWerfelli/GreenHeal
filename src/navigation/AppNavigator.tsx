import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getOnboardingData, clearOnboardingData } from '../modules/storage';
import { init as initI18n } from '../i18n';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import HealingJournalScreen from '../screens/HealingJournalScreen';
import JournalEntryFormScreen from '../screens/JournalEntryFormScreen';
import JournalEntryDetailScreen from '../screens/JournalEntryDetailScreen';
import MyGardenScreen from '../screens/MyGardenScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OfflineIndicator from '../components/OfflineIndicator';
import { COLORS } from '../utils/constants';
import type { RootStackParamList, BottomTabParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

function MainTabs() {
  const { t } = useTranslation();

  return (
    <>
      <OfflineIndicator />
      <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.primary + '20',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
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
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="MyGarden"
        component={MyGardenScreen}
        options={{
          title: t('garden.title'),
          tabBarLabel: t('garden.title'),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🌱</Text>,
        }}
      />
      <Tab.Screen
        name="HealingJournal"
        component={HealingJournalScreen}
        options={{
          title: t('journal.title'),
          tabBarLabel: t('journal.title'),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📔</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings.title'),
          tabBarLabel: t('settings.title'),
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
    </>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 }}>
        <Text style={{ fontSize: 24, color: 'red', marginBottom: 10 }}>⚠️</Text>
        <Text style={{ fontSize: 18, color: 'red', fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 24, color: COLORS.primary, marginBottom: 10 }}>🌿</Text>
        <Text style={{ fontSize: 18, color: COLORS.primary, fontWeight: 'bold' }}>GreenHeal</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 10 }}>Loading...</Text>
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
                title: 'AI Analysis',
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.primary,
              }}
            />
            <Stack.Screen 
              name="PlantDetail" 
              component={PlantDetailScreen}
              options={{ 
                title: 'Plant Details',
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.primary,
              }}
            />
            <Stack.Screen 
              name="JournalEntryForm" 
              component={JournalEntryFormScreen}
              options={{ 
                title: 'New Journal Entry',
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.primary,
              }}
            />
            <Stack.Screen 
              name="JournalEntryDetail" 
              component={JournalEntryDetailScreen}
              options={{ 
                title: 'Journal Entry',
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.primary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
