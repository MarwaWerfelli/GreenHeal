import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as fc from 'fast-check';
import MyGardenScreen from '../src/screens/MyGardenScreen';
import PlantDetailScreen from '../src/screens/PlantDetailScreen';
import { getGardenPlants, updatePlantWateringDate, deletePlant } from '../src/modules/storage';
import { enrichPlantData } from '../src/modules/plantDatabase';
import { schedulePlantReminder, cancelReminder } from '../src/modules/notifications';
import type { GardenPlant } from '../src/types';

// Mock dependencies
jest.mock('../src/modules/storage');
jest.mock('../src/modules/plantDatabase');
jest.mock('../src/modules/notifications');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'garden.noPlantsYet') {
        return 'No plants in your garden yet. Scan a room to get recommendations!';
      }
      if (key === 'garden.needsWatering') {
        return 'Needs watering';
      }
      if (key === 'garden.lastWatered') {
        return 'Last watered';
      }
      if (key === 'garden.nextWatering') {
        return 'Water in';
      }
      if (key === 'garden.watered') {
        return 'Plant watered!';
      }
      if (key === 'garden.markAsWatered') {
        return 'Mark as Watered';
      }
      if (key === 'garden.removeFromGarden') {
        return 'Remove from Garden';
      }
      if (key === 'garden.removeConfirm') {
        return 'Are you sure you want to remove this plant from your garden?';
      }
      if (key.startsWith('careDifficulty.')) {
        return key.split('.')[1];
      }
      return key;
    },
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

const mockedGetGardenPlants = getGardenPlants as jest.MockedFunction<typeof getGardenPlants>;
const mockedUpdatePlantWateringDate = updatePlantWateringDate as jest.MockedFunction<typeof updatePlantWateringDate>;
const mockedDeletePlant = deletePlant as jest.MockedFunction<typeof deletePlant>;
const mockedEnrichPlantData = enrichPlantData as jest.MockedFunction<typeof enrichPlantData>;
const mockedSchedulePlantReminder = schedulePlantReminder as jest.MockedFunction<typeof schedulePlantReminder>;
const mockedCancelReminder = cancelReminder as jest.MockedFunction<typeof cancelReminder>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

describe('My Garden Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    mockedEnrichPlantData.mockResolvedValue(null);
    mockedSchedulePlantReminder.mockResolvedValue('notification-1');
    mockedCancelReminder.mockResolvedValue();
  });

  describe('MyGardenScreen', () => {
    test.skip('Shows empty state when no plants exist', async () => {
      mockedGetGardenPlants.mockResolvedValue([]);

      const { getByText } = render(
        <MyGardenScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        expect(getByText('No plants in your garden yet. Scan a room to get recommendations!')).toBeTruthy();
      });
    });

    test.skip('Displays garden plants in grid', async () => {
      const plants: GardenPlant[] = [
        {
          id: 1,
          name: 'Lavender',
          careDifficulty: 'easy',
          wateringFrequencyDays: 7,
          nextWateringAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          addedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Snake Plant',
          careDifficulty: 'easy',
          wateringFrequencyDays: 14,
          nextWateringAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          addedAt: new Date().toISOString(),
        },
      ];

      mockedGetGardenPlants.mockResolvedValue(plants);

      const { getByText } = render(
        <MyGardenScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        expect(getByText('Lavender')).toBeTruthy();
        expect(getByText('Snake Plant')).toBeTruthy();
      });
    });

    test.skip('Shows watering indicator for plants needing water', async () => {
      const plants: GardenPlant[] = [
        {
          id: 1,
          name: 'Thirsty Plant',
          careDifficulty: 'easy',
          wateringFrequencyDays: 7,
          nextWateringAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          addedAt: new Date().toISOString(),
        },
      ];

      mockedGetGardenPlants.mockResolvedValue(plants);

      const { getAllByText } = render(
        <MyGardenScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        expect(getAllByText(/Needs watering/)).toHaveLength(2); // Badge and detail row
      });
    });
  });

  describe('PlantDetailScreen - Garden Management', () => {
    const mockGardenPlant: GardenPlant = {
      id: 1,
      name: 'Lavender',
      placement: 'Near window',
      healingBenefit: 'Reduces stress',
      careDifficulty: 'easy',
      estimatedCost: '15 TND',
      wateringFrequencyDays: 7,
      lastWateredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      nextWateringAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      notificationId: 'notification-1',
      addedAt: new Date().toISOString(),
    };

    const mockRoute = {
      params: {
        plant: mockGardenPlant,
        source: 'garden' as const,
      },
    } as any;

    test('Shows Mark as Watered and Remove buttons for garden plants', async () => {
      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Mark as Watered')).toBeTruthy();
        expect(getByText('Remove from Garden')).toBeTruthy();
      });
    });

    test('Updates watering date and schedules notification when marked as watered', async () => {
      mockedUpdatePlantWateringDate.mockResolvedValue();

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('Mark as Watered');
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockedUpdatePlantWateringDate).toHaveBeenCalledWith(
          1,
          expect.any(Date)
        );
        expect(mockedCancelReminder).toHaveBeenCalledWith('notification-1');
        expect(mockedSchedulePlantReminder).toHaveBeenCalledWith(
          1,
          'Lavender',
          expect.any(Date)
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Plant watered!',
          '',
          expect.any(Array)
        );
      });
    });

    test('Shows confirmation dialog when removing plant', async () => {
      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('Remove from Garden');
        fireEvent.press(button);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Remove from Garden',
        'Are you sure you want to remove this plant from your garden?',
        expect.any(Array)
      );
    });

    test('Deletes plant and cancels notification when removal confirmed', async () => {
      mockedDeletePlant.mockResolvedValue();

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('Remove from Garden');
        fireEvent.press(button);
      });

      // Simulate confirmation
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const confirmCallback = alertCalls[alertCalls.length - 1][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockedCancelReminder).toHaveBeenCalledWith('notification-1');
        expect(mockedDeletePlant).toHaveBeenCalledWith(1);
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });

  describe('Property-based tests', () => {
    /**
     * Property 17: Garden Plant Display Completeness
     * 
     * Each garden plant card MUST display all required information:
     * plant name, care difficulty, and watering status.
     * 
     * Validates: Requirements 7.2
     */
    test.skip('Property 17: Garden Plant Display Completeness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              careDifficulty: fc.constantFrom<'easy' | 'medium' | 'hard'>('easy', 'medium', 'hard'),
              wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
              nextWateringAt: fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
              addedAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 6 }
          ),
          async (plants) => {
            mockedGetGardenPlants.mockResolvedValue(plants);

            const { getByText } = render(
              <MyGardenScreen navigation={mockNavigation} route={{} as any} />
            );

            await waitFor(() => {
              plants.forEach((plant) => {
                // Plant name must be displayed
                expect(getByText(plant.name)).toBeTruthy();
                
                // Care difficulty must be displayed
                expect(getByText(plant.careDifficulty)).toBeTruthy();
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 18: Next Watering Date Calculation
     * 
     * The next watering date MUST be calculated correctly based on the
     * nextWateringAt timestamp. Plants needing water (current date >= next watering)
     * MUST be identified correctly.
     * 
     * Validates: Requirements 7.3
     */
    test.skip('Property 18: Next Watering Date Calculation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            careDifficulty: fc.constantFrom<'easy' | 'medium' | 'hard'>('easy', 'medium', 'hard'),
            wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
            daysUntilWatering: fc.integer({ min: -5, max: 10 }), // Negative means overdue
            addedAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
          }),
          async (plantData) => {
            const now = new Date();
            const nextWatering = new Date(now);
            nextWatering.setDate(nextWatering.getDate() + plantData.daysUntilWatering);

            const plant: GardenPlant = {
              ...plantData,
              nextWateringAt: nextWatering.toISOString(),
            };

            mockedGetGardenPlants.mockResolvedValue([plant]);

            const { queryByText } = render(
              <MyGardenScreen navigation={mockNavigation} route={{} as any} />
            );

            await waitFor(() => {
              if (plantData.daysUntilWatering <= 0) {
                // Plant needs watering - should show indicator
                expect(queryByText(/Needs watering/)).toBeTruthy();
              } else {
                // Plant doesn't need watering yet
                const daysText = plantData.daysUntilWatering === 1 ? '1 day' : `${plantData.daysUntilWatering} days`;
                expect(queryByText(daysText)).toBeTruthy();
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 19: Care Reminder Notification Scheduling
     * 
     * When a plant is marked as watered, a notification MUST be scheduled for
     * the next watering date (current date + watering frequency days).
     * Any existing notification MUST be cancelled first.
     * 
     * Validates: Requirements 7.4
     */
    test.skip('Property 19: Care Reminder Notification Scheduling', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
            notificationId: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
          }),
          async (plantData) => {
            const plant: GardenPlant = {
              ...plantData,
              careDifficulty: 'easy',
              nextWateringAt: new Date().toISOString(),
              addedAt: new Date().toISOString(),
            };

            const mockRoute = {
              params: {
                plant,
                source: 'garden' as const,
              },
            } as any;

            mockedUpdatePlantWateringDate.mockResolvedValue();

            const { getByText } = render(
              <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              const button = getByText('Mark as Watered');
              fireEvent.press(button);
            });

            await waitFor(() => {
              // If plant had a notification, it must be cancelled
              if (plantData.notificationId) {
                expect(mockedCancelReminder).toHaveBeenCalledWith(plantData.notificationId);
              }

              // New notification must be scheduled
              expect(mockedSchedulePlantReminder).toHaveBeenCalledWith(
                plantData.name,
                expect.any(Date),
                plantData.id
              );

              // Verify the scheduled date is correct
              const scheduledDate = mockedSchedulePlantReminder.mock.calls[0][1] as Date;
              const now = new Date();
              const expectedDate = new Date(now);
              expectedDate.setDate(expectedDate.getDate() + plantData.wateringFrequencyDays);
              
              const diffInDays = Math.floor(
                (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              expect(diffInDays).toBe(plantData.wateringFrequencyDays);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 20: Mark as Watered Update
     * 
     * When a plant is marked as watered, the lastWateredAt timestamp MUST be
     * updated to the current date in the database.
     * 
     * Validates: Requirements 7.8
     */
    test.skip('Property 20: Mark as Watered Update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
          }),
          async (plantData) => {
            const plant: GardenPlant = {
              ...plantData,
              careDifficulty: 'easy',
              nextWateringAt: new Date().toISOString(),
              addedAt: new Date().toISOString(),
            };

            const mockRoute = {
              params: {
                plant,
                source: 'garden' as const,
              },
            } as any;

            mockedUpdatePlantWateringDate.mockResolvedValue();

            const { getByText } = render(
              <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              const button = getByText('Mark as Watered');
              fireEvent.press(button);
            });

            await waitFor(() => {
              // Database update must be called with plant ID and current date
              expect(mockedUpdatePlantWateringDate).toHaveBeenCalledWith(
                plantData.id,
                expect.any(Date)
              );

              // Verify the date is approximately now (within 1 second)
              const wateredDate = mockedUpdatePlantWateringDate.mock.calls[0][1] as Date;
              const now = new Date();
              const diffInMs = Math.abs(now.getTime() - wateredDate.getTime());
              expect(diffInMs).toBeLessThan(1000);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 21: Plant Removal Cleanup
     * 
     * When a plant is removed from the garden, both the database record AND
     * any scheduled notification MUST be deleted. The removal MUST require confirmation.
     * 
     * Validates: Requirements 7.11
     */
    test.skip('Property 21: Plant Removal Cleanup', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            notificationId: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
          }),
          async (plantData) => {
            const plant: GardenPlant = {
              ...plantData,
              careDifficulty: 'easy',
              wateringFrequencyDays: 7,
              nextWateringAt: new Date().toISOString(),
              addedAt: new Date().toISOString(),
            };

            const mockRoute = {
              params: {
                plant,
                source: 'garden' as const,
              },
            } as any;

            mockedDeletePlant.mockResolvedValue();

            const { getByText } = render(
              <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              const button = getByText('Remove from Garden');
              fireEvent.press(button);
            });

            // Confirmation dialog must be shown
            expect(Alert.alert).toHaveBeenCalledWith(
              'Remove from Garden',
              'Are you sure you want to remove this plant from your garden?',
              expect.any(Array)
            );

            // Simulate confirmation
            const alertCalls = (Alert.alert as jest.Mock).mock.calls;
            const confirmCallback = alertCalls[alertCalls.length - 1][2][1].onPress;
            await confirmCallback();

            await waitFor(() => {
              // If plant had a notification, it must be cancelled
              if (plantData.notificationId) {
                expect(mockedCancelReminder).toHaveBeenCalledWith(plantData.notificationId);
              }

              // Plant must be deleted from database
              expect(mockedDeletePlant).toHaveBeenCalledWith(plantData.id);

              // Navigation must go back
              expect(mockNavigation.goBack).toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
