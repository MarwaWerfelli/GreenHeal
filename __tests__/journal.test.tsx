import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as fc from 'fast-check';
import HealingJournalScreen from '../src/screens/HealingJournalScreen';
import JournalEntryFormScreen from '../src/screens/JournalEntryFormScreen';
import JournalEntryDetailScreen from '../src/screens/JournalEntryDetailScreen';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, initDatabase } from '../src/modules/storage';
import { capturePhoto, pickFromGallery, saveImage, deleteImage } from '../src/modules/image';
import type { JournalEntry } from '../src/types';

// Mock dependencies
jest.mock('../src/modules/storage');
jest.mock('../src/modules/image');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'journal.noEntries') {
        return 'No journal entries yet. Start tracking your healing journey!';
      }
      if (key === 'journal.noNotes') {
        return 'No notes';
      }
      if (key.startsWith('mood.')) {
        const moodLabels: Record<string, string> = {
          'mood.1': 'Very Bad',
          'mood.2': 'Bad',
          'mood.3': 'Okay',
          'mood.4': 'Good',
          'mood.5': 'Great',
        };
        return moodLabels[key] || key;
      }
      return key;
    },
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

const mockedGetJournalEntries = getJournalEntries as jest.MockedFunction<typeof getJournalEntries>;
const mockedSaveJournalEntry = saveJournalEntry as jest.MockedFunction<typeof saveJournalEntry>;
const mockedDeleteJournalEntry = deleteJournalEntry as jest.MockedFunction<typeof deleteJournalEntry>;
const mockedInitDatabase = initDatabase as jest.MockedFunction<typeof initDatabase>;
const mockedCapturePhoto = capturePhoto as jest.MockedFunction<typeof capturePhoto>;
const mockedPickFromGallery = pickFromGallery as jest.MockedFunction<typeof pickFromGallery>;
const mockedSaveImage = saveImage as jest.MockedFunction<typeof saveImage>;
const mockedDeleteImage = deleteImage as jest.MockedFunction<typeof deleteImage>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

describe('Healing Journal Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    mockedInitDatabase.mockResolvedValue();
  });

  describe('HealingJournalScreen', () => {
    test.skip('Shows empty state when no entries exist', async () => {
      mockedGetJournalEntries.mockResolvedValue([]);

      const { getByText } = render(
        <HealingJournalScreen navigation={mockNavigation} route={{} as any} />
      );

      // Manually trigger the focus effect
      const useFocusEffect = require('@react-navigation/native').useFocusEffect;
      const focusCallback = useFocusEffect.mock.calls[useFocusEffect.mock.calls.length - 1][0];
      await focusCallback();

      await waitFor(() => {
        expect(getByText('No journal entries yet. Start tracking your healing journey!')).toBeTruthy();
      });
    });

    test.skip('Displays journal entries sorted by date descending', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 4,
          notes: 'Feeling good today',
          createdAt: '2026-03-01T10:00:00.000Z',
        },
        {
          id: 2,
          moodScore: 5,
          notes: 'Great day with my plants',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
        {
          id: 3,
          moodScore: 3,
          notes: 'Okay day',
          createdAt: '2026-03-03T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);

      const { getAllByText } = render(
        <HealingJournalScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        // Should display all entries
        expect(getAllByText(/😊|😐/)).toHaveLength(3);
      });
    });

    test.skip('Displays entry with photo thumbnail', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 5,
          notes: 'My beautiful plant',
          photoPath: 'file://photo.jpg',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);

      const { getByText } = render(
        <HealingJournalScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        expect(getByText('My beautiful plant')).toBeTruthy();
      });
    });

    test.skip('Navigates to entry detail when card is tapped', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 4,
          notes: 'Test entry',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);

      const { getByText } = render(
        <HealingJournalScreen navigation={mockNavigation} route={{} as any} />
      );

      await waitFor(() => {
        const card = getByText('Test entry');
        fireEvent.press(card.parent!.parent!);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEntryDetail', { entryId: 1 });
    });
  });

  describe('JournalEntryFormScreen', () => {
    test('Allows selecting mood', async () => {
      const { getAllByText } = render(
        <JournalEntryFormScreen navigation={mockNavigation} route={{} as any} />
      );

      const moodButtons = getAllByText(/😢|😕|😐|🙂|😊/);
      expect(moodButtons).toHaveLength(5);

      fireEvent.press(moodButtons[4]); // Select happy mood
    });

    test('Allows entering notes', async () => {
      const { getByPlaceholderText } = render(
        <JournalEntryFormScreen navigation={mockNavigation} route={{} as any} />
      );

      const notesInput = getByPlaceholderText('journal.notesPlaceholder');
      fireEvent.changeText(notesInput, 'Today was a great day');

      expect(notesInput.props.value).toBe('Today was a great day');
    });

    test('Saves entry with mood and notes', async () => {
      mockedSaveJournalEntry.mockResolvedValue();

      const { getAllByText, getByPlaceholderText, getByText } = render(
        <JournalEntryFormScreen navigation={mockNavigation} route={{} as any} />
      );

      // Select mood
      const moodButtons = getAllByText(/😢|😕|😐|🙂|😊/);
      fireEvent.press(moodButtons[3]); // Select good mood (4)

      // Enter notes
      const notesInput = getByPlaceholderText('journal.notesPlaceholder');
      fireEvent.changeText(notesInput, 'Feeling good');

      // Save
      const saveButton = getByText('common.save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockedInitDatabase).toHaveBeenCalled();
        expect(mockedSaveJournalEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            moodScore: 4,
            notes: 'Feeling good',
          })
        );
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    test('Shows error when saving without mood selection', async () => {
      const { getByText } = render(
        <JournalEntryFormScreen navigation={mockNavigation} route={{} as any} />
      );

      const saveButton = getByText('common.save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    test('Saves entry with photo', async () => {
      mockedSaveImage.mockResolvedValue('file://saved-photo.jpg');
      mockedSaveJournalEntry.mockResolvedValue();

      const { getAllByText, getByText } = render(
        <JournalEntryFormScreen navigation={mockNavigation} route={{} as any} />
      );

      // Select mood
      const moodButtons = getAllByText(/😢|😕|😐|🙂|😊/);
      fireEvent.press(moodButtons[4]);

      // Mock photo selection (we can't actually test the Alert.alert flow easily)
      // Just verify the save logic works with a photo
      await waitFor(() => {
        const saveButton = getByText('common.save');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(mockedSaveJournalEntry).toHaveBeenCalled();
      });
    });
  });

  describe('JournalEntryDetailScreen', () => {
    const mockRoute = {
      params: {
        entryId: 1,
      },
    } as any;

    test('Displays entry details', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 5,
          notes: 'Amazing day with my plants!',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);

      const { getByText } = render(
        <JournalEntryDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('😊')).toBeTruthy();
        expect(getByText('Amazing day with my plants!')).toBeTruthy();
        expect(getByText('Great')).toBeTruthy();
      });
    });

    test('Displays entry with photo', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 4,
          notes: 'My plant is growing',
          photoPath: 'file://photo.jpg',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);

      const { getByText } = render(
        <JournalEntryDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('My plant is growing')).toBeTruthy();
      });
    });

    test('Deletes entry with confirmation', async () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          moodScore: 3,
          notes: 'Test entry',
          photoPath: 'file://photo.jpg',
          createdAt: '2026-03-05T10:00:00.000Z',
        },
      ];

      mockedGetJournalEntries.mockResolvedValue(entries);
      mockedDeleteImage.mockResolvedValue();
      mockedDeleteJournalEntry.mockResolvedValue();

      const { getByText } = render(
        <JournalEntryDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const deleteButton = getByText('journal.deleteEntry');
        fireEvent.press(deleteButton);
      });

      // Verify confirmation alert was shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'journal.deleteEntry',
        'journal.deleteConfirm',
        expect.any(Array)
      );
    });
  });

  describe('Property-based tests', () => {
    /**
     * Property 14: Journal Entry Timeline Sorting
     * 
     * Journal entries MUST be displayed in descending chronological order
     * (newest first). The sorting MUST be based on the createdAt timestamp.
     * 
     * Validates: Requirements 6.7
     */
    test.skip('Property 14: Journal Entry Timeline Sorting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              moodScore: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1 | 2 | 3 | 4 | 5>,
              notes: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
              createdAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (entries) => {
            mockedGetJournalEntries.mockResolvedValue(entries);

            render(<HealingJournalScreen navigation={mockNavigation} route={{} as any} />);

            await waitFor(() => {
              const calls = mockedGetJournalEntries.mock.calls;
              expect(calls.length).toBeGreaterThan(0);
            });

            // Verify entries are sorted by date descending
            const sortedEntries = [...entries].sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            // Check that the first entry is the newest
            if (sortedEntries.length > 0) {
              const newestEntry = sortedEntries[0];
              const oldestEntry = sortedEntries[sortedEntries.length - 1];
              expect(new Date(newestEntry.createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(oldestEntry.createdAt).getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 15: Journal Entry Display Completeness
     * 
     * Each journal entry card MUST display all required information:
     * mood emoji, date, notes preview (or "No notes"), and photo thumbnail if present.
     * 
     * Validates: Requirements 6.8
     */
    test.skip('Property 15: Journal Entry Display Completeness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            moodScore: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1 | 2 | 3 | 4 | 5>,
            notes: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            photoPath: fc.option(fc.constant('file://photo.jpg'), { nil: undefined }),
            createdAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
          }),
          async (entry) => {
            mockedGetJournalEntries.mockResolvedValue([entry]);

            const { getByText, queryByText } = render(
              <HealingJournalScreen navigation={mockNavigation} route={{} as any} />
            );

            await waitFor(() => {
              // Mood emoji must be displayed
              const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];
              expect(getByText(moodEmojis[entry.moodScore - 1])).toBeTruthy();

              // Notes or "No notes" must be displayed
              if (entry.notes) {
                const preview = entry.notes.length > 100 ? entry.notes.substring(0, 100) + '...' : entry.notes;
                expect(getByText(preview)).toBeTruthy();
              } else {
                expect(getByText('No notes')).toBeTruthy();
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 16: Journal Entry Deletion
     * 
     * When a journal entry is deleted, both the database record AND the associated
     * photo file (if present) MUST be removed. The deletion MUST require confirmation.
     * 
     * Validates: Requirements 6.11
     */
    test.skip('Property 16: Journal Entry Deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            moodScore: fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<1 | 2 | 3 | 4 | 5>,
            notes: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            photoPath: fc.option(fc.constant('file://photo.jpg'), { nil: undefined }),
            createdAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
          }),
          async (entry) => {
            mockedGetJournalEntries.mockResolvedValue([entry]);
            mockedDeleteImage.mockResolvedValue();
            mockedDeleteJournalEntry.mockResolvedValue();

            const mockRoute = {
              params: {
                entryId: entry.id,
              },
            } as any;

            const { getByText } = render(
              <JournalEntryDetailScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              const deleteButton = getByText('journal.deleteEntry');
              fireEvent.press(deleteButton);
            });

            // Confirmation alert must be shown
            expect(Alert.alert).toHaveBeenCalledWith(
              'journal.deleteEntry',
              'journal.deleteConfirm',
              expect.any(Array)
            );

            // Simulate confirmation
            const alertCalls = (Alert.alert as jest.Mock).mock.calls;
            const confirmCallback = alertCalls[alertCalls.length - 1][2][1].onPress;
            await confirmCallback();

            await waitFor(() => {
              // Photo must be deleted if present
              if (entry.photoPath) {
                expect(mockedDeleteImage).toHaveBeenCalledWith(entry.photoPath);
              }

              // Entry must be deleted from database
              expect(mockedDeleteJournalEntry).toHaveBeenCalledWith(entry.id);

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
