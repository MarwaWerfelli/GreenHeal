import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  saveJournalEntry,
  getJournalEntries,
  savePlant,
  getGardenPlants,
  resetDatabase,
} from '../src/modules/storage';
import type { JournalEntry, GardenPlant } from '../src/types';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

/**
 * Property 22: Database Error Handling
 * 
 * For any database operation that fails, the app should handle the error
 * gracefully and display a user-friendly error message without crashing.
 * 
 * Validates: Requirements 9.8
 */
describe('Storage Module - Error Handling', () => {
  describe('Property 22: Database Error Handling', () => {
    test('Database initialization failure throws meaningful error', async () => {
      (SQLite.openDatabaseAsync as jest.Mock).mockRejectedValue(
        new Error('Failed to open database')
      );

      await expect(initDatabase()).rejects.toThrow('Failed to initialize database');
    });

    test('Save journal entry with database error throws meaningful error', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockRejectedValue(new Error('Database write error')),
        getAllAsync: jest.fn(),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      const entry: JournalEntry = {
        moodScore: 3,
        notes: 'Test',
        createdAt: new Date().toISOString(),
      };

      await expect(saveJournalEntry(entry)).rejects.toThrow('Failed to save journal entry');
    });

    test('Get journal entries with database error throws meaningful error', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockRejectedValue(new Error('Database read error')),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      await expect(getJournalEntries()).rejects.toThrow('Failed to get journal entries');
    });

    test('Save plant with database error throws meaningful error', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockRejectedValue(new Error('Database write error')),
        getAllAsync: jest.fn(),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      const plant: GardenPlant = {
        name: 'Test Plant',
        careDifficulty: 'easy',
        wateringFrequencyDays: 7,
        nextWateringAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
        wateringReminderEnabled: true,
      };

      await expect(savePlant(plant)).rejects.toThrow('Failed to save plant');
    });

    test('Get garden plants with database error throws meaningful error', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockRejectedValue(new Error('Database read error')),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      await expect(getGardenPlants()).rejects.toThrow('Failed to get garden plants');
    });

    test('Operations without database initialization throw meaningful error', async () => {
      // Reset database to null
      resetDatabase();
      (SQLite.openDatabaseAsync as jest.Mock).mockClear();

      const entry: JournalEntry = {
        moodScore: 3,
        createdAt: new Date().toISOString(),
      };

      await expect(saveJournalEntry(entry)).rejects.toThrow(
        'Database not initialized. Call initDatabase() first.'
      );
    });

    test('Errors are logged to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockRejectedValue(new Error('Test error')),
        getAllAsync: jest.fn(),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      const entry: JournalEntry = {
        moodScore: 3,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveJournalEntry(entry);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving journal entry:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    test('Database operations handle null/undefined gracefully', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      // Entry with optional fields as undefined
      const entry: JournalEntry = {
        moodScore: 3,
        notes: undefined,
        photoPath: undefined,
        createdAt: new Date().toISOString(),
      };

      // Should not throw
      const id = await saveJournalEntry(entry);
      expect(id).toBe(1);
    });

    test('Getter operations normalize malformed query result shapes', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn(),
        getAllAsync: jest.fn().mockResolvedValue(undefined),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      await expect(getJournalEntries()).resolves.toEqual([]);
      await expect(getGardenPlants()).resolves.toEqual([]);
    });

    test('Database handles concurrent operations', async () => {
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async () => {
          // Simulate async delay
          await new Promise(resolve => setTimeout(resolve, 10));
          return { lastInsertRowId: Math.floor(Math.random() * 1000) };
        }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      // Create multiple concurrent save operations
      const entries: JournalEntry[] = Array.from({ length: 10 }, (_, i) => ({
        moodScore: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        notes: `Entry ${i}`,
        createdAt: new Date().toISOString(),
      }));

      // All should complete without errors
      const promises = entries.map(entry => saveJournalEntry(entry));
      const ids = await Promise.all(promises);

      expect(ids).toHaveLength(10);
      ids.forEach(id => expect(id).toBeGreaterThan(0));
    });
  });

  describe('Graceful degradation', () => {
    test('App continues functioning after database error', async () => {
      let callCount = 0;
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary error');
          }
          return { lastInsertRowId: callCount };
        }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn(),
      };

      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
      await initDatabase();

      const entry: JournalEntry = {
        moodScore: 3,
        createdAt: new Date().toISOString(),
      };

      // First call fails
      await expect(saveJournalEntry(entry)).rejects.toThrow();

      // Second call succeeds
      const id = await saveJournalEntry(entry);
      expect(id).toBe(2);
    });
  });
});
