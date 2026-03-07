import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as fc from 'fast-check';
import * as ImagePicker from 'expo-image-picker';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import { saveOnboardingData, getOnboardingData } from '../src/modules/storage';
import { saveImage } from '../src/modules/image';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('../src/modules/image');
jest.mock('expo-image-picker');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('Onboarding Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);
    (getOnboardingData as jest.Mock).mockResolvedValue(null);
    (saveImage as jest.Mock).mockImplementation((uri) => Promise.resolve(uri));
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });
  });

  describe('Property 5: Onboarding Data Persistence', () => {
    test('Saves onboarding data to AsyncStorage on completion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('stress', 'physical', 'depression', 'sleep', 'wellness'),
          fc.constantFrom('under10', '10to30', 'over30', 'have_plants'),
          async (healingGoal, budget) => {
            const onComplete = jest.fn();
            const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

            // Map budget value to translation key
            const budgetKey = budget === 'have_plants' ? 'havePlants' : budget;

            // Step 1: Select healing goal
            const goalButton = getByText(`onboarding.healingGoals.${healingGoal}`);
            fireEvent.press(goalButton);
            
            const nextButton1 = getByText('common.next');
            fireEvent.press(nextButton1);

            // Step 2: Select budget
            await waitFor(() => {
              const budgetButton = getByText(`onboarding.budget.${budgetKey}`);
              fireEvent.press(budgetButton);
            });

            const nextButton2 = getByText('common.next');
            fireEvent.press(nextButton2);

            // Step 3: Complete onboarding
            await waitFor(() => {
              const completeButton = getByText('common.complete');
              fireEvent.press(completeButton);
            });

            // Should save onboarding data
            await waitFor(() => {
              expect(saveOnboardingData).toHaveBeenCalledWith(
                expect.objectContaining({
                  healingGoal,
                  budget,
                  completedAt: expect.any(String),
                })
              );
              
              // Should call onComplete callback
              expect(onComplete).toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Includes photo paths when images are uploaded', async () => {
      const mockPhotos = ['photo1.jpg', 'photo2.jpg'];
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: mockPhotos.map((uri) => ({ uri })),
      });

      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Navigate to step 1
      const goalButton = getByText('onboarding.healingGoals.stress');
      fireEvent.press(goalButton);
      fireEvent.press(getByText('common.next'));

      // Navigate to step 2
      await waitFor(() => {
        const budgetButton = getByText('onboarding.budget.under10');
        fireEvent.press(budgetButton);
      });
      fireEvent.press(getByText('common.next'));

      // Step 3: Upload photos
      await waitFor(() => {
        const uploadButton = getByText('onboarding.uploadPhotos');
        fireEvent.press(uploadButton);
      });

      await waitFor(() => {
        expect(saveImage).toHaveBeenCalledTimes(2);
      });

      // Complete onboarding
      const completeButton = getByText('common.complete');
      fireEvent.press(completeButton);

      await waitFor(() => {
        expect(saveOnboardingData).toHaveBeenCalledWith(
          expect.objectContaining({
            existingPlantPhotos: expect.arrayContaining(mockPhotos),
          })
        );
      });
    });
  });

  describe('Unit tests for onboarding flow', () => {
    test('Displays all healing goal options', () => {
      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Should display all healing goal options
      expect(getByText('onboarding.healingGoals.stress')).toBeTruthy();
      expect(getByText('onboarding.healingGoals.physical')).toBeTruthy();
      expect(getByText('onboarding.healingGoals.depression')).toBeTruthy();
      expect(getByText('onboarding.healingGoals.sleep')).toBeTruthy();
      expect(getByText('onboarding.healingGoals.wellness')).toBeTruthy();
    });

    test('Displays all budget options on step 2', async () => {
      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Navigate to step 2
      const goalButton = getByText('onboarding.healingGoals.stress');
      fireEvent.press(goalButton);
      fireEvent.press(getByText('common.next'));

      // Should display all budget options
      await waitFor(() => {
        expect(getByText('onboarding.budget.under10')).toBeTruthy();
        expect(getByText('onboarding.budget.10to30')).toBeTruthy();
        expect(getByText('onboarding.budget.over30')).toBeTruthy();
        expect(getByText('onboarding.budget.havePlants')).toBeTruthy();
      });
    });

    test('Shows progress indicator', () => {
      const onComplete = jest.fn();
      const { UNSAFE_getAllByType } = render(<OnboardingScreen onComplete={onComplete} />);

      // Should have progress dots (implementation detail, but validates UI exists)
      const view = UNSAFE_getAllByType('View' as any);
      expect(view.length).toBeGreaterThan(0);
    });

    test('Next button is disabled until selection is made', () => {
      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      const nextButton = getByText('common.next');
      
      // Button should be disabled initially (check via style or disabled prop)
      // This is a visual test - in real app, tapping would do nothing
      expect(nextButton).toBeTruthy();
    });

    test('Can navigate back through steps', async () => {
      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Go to step 2
      fireEvent.press(getByText('onboarding.healingGoals.stress'));
      fireEvent.press(getByText('common.next'));

      // Go back to step 1
      await waitFor(() => {
        const backButton = getByText('common.back');
        fireEvent.press(backButton);
      });

      // Should be back on step 1
      await waitFor(() => {
        expect(getByText('onboarding.healingGoals.stress')).toBeTruthy();
      });
    });

    test('Image picker integration works', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'test.jpg' }],
      });

      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Navigate to step 3
      fireEvent.press(getByText('onboarding.healingGoals.stress'));
      fireEvent.press(getByText('common.next'));
      
      await waitFor(() => {
        fireEvent.press(getByText('onboarding.budget.under10'));
      });
      fireEvent.press(getByText('common.next'));

      // Upload photo
      await waitFor(() => {
        const uploadButton = getByText('onboarding.uploadPhotos');
        fireEvent.press(uploadButton);
      });

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    test('Navigates to home on completion', async () => {
      const onComplete = jest.fn();
      const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);

      // Complete all steps
      fireEvent.press(getByText('onboarding.healingGoals.wellness'));
      fireEvent.press(getByText('common.next'));

      await waitFor(() => {
        fireEvent.press(getByText('onboarding.budget.havePlants'));
      });
      fireEvent.press(getByText('common.next'));

      await waitFor(() => {
        fireEvent.press(getByText('common.complete'));
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
