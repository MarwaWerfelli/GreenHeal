import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { STORAGE_KEYS, CACHE_DURATION_DAYS } from '../utils/constants';
import type {
  OnboardingData,
  Language,
  JournalEntry,
  GardenPlant,
  MoodCheckIn,
  PlantAPIResponse,
  PlantCacheEntry,
} from '../types';

// ============================================================================
// AsyncStorage Operations
// ============================================================================

/**
 * Save onboarding data to AsyncStorage
 */
export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw new Error('Failed to save onboarding data');
  }
}

/**
 * Get onboarding data from AsyncStorage
 */
export async function getOnboardingData(): Promise<OnboardingData | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    return null;
  }
}

/**
 * Save language preference to AsyncStorage
 */
export async function saveLanguagePreference(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
    throw new Error('Failed to save language preference');
  }
}

/**
 * Get language preference from AsyncStorage
 */
export async function getLanguagePreference(): Promise<Language | null> {
  try {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return language as Language | null;
  } catch (error) {
    console.error('Error getting language preference:', error);
    return null;
  }
}

/**
 * Save AI request count and reset time to AsyncStorage
 */
export async function saveAIRequestCount(data: { count: number; resetAt: string }): Promise<void> {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_REQUEST_COUNT, jsonData);
  } catch (error) {
    console.error('Error saving AI request count:', error);
    throw new Error('Failed to save AI request count');
  }
}

/**
 * Get AI request count and reset time from AsyncStorage
 */
export async function getAIRequestCount(): Promise<{ count: number; resetAt: string } | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AI_REQUEST_COUNT);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting AI request count:', error);
    return null;
  }
}

/**
 * Clear all onboarding data from AsyncStorage
 */
export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING);
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
    throw new Error('Failed to clear onboarding data');
  }
}

// ============================================================================
// SQLite Operations
// ============================================================================

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Reset the database instance (for testing purposes only)
 */
export function resetDatabase(): void {
  db = null;
}

/**
 * Initialize the SQLite database and create tables
 */
export async function initDatabase(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync('greenheal.db');

    // Create journal_entries table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood_score INTEGER NOT NULL CHECK(mood_score >= 1 AND mood_score <= 5),
        notes TEXT,
        photo_path TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Create garden_plants table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS garden_plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        placement TEXT,
        healing_benefit TEXT,
        care_difficulty TEXT,
        estimated_cost TEXT,
        watering_frequency_days INTEGER NOT NULL,
        last_watered_at TEXT,
        next_watering_at TEXT,
        care_instructions TEXT,
        notification_id TEXT,
        added_at TEXT NOT NULL
      );
    `);

    // Create mood_checkins table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mood_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood_score INTEGER NOT NULL CHECK(mood_score >= 1 AND mood_score <= 5),
        created_at TEXT NOT NULL
      );
    `);

    // Create plant_cache table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plant_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_name TEXT UNIQUE NOT NULL,
        api_response TEXT NOT NULL,
        cached_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    `);

    // Create indexes for performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_garden_next_watering ON garden_plants(next_watering_at);
      CREATE INDEX IF NOT EXISTS idx_mood_created ON mood_checkins(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_cache_expiry ON plant_cache(plant_name, expires_at);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}

/**
 * Get the database instance
 */
function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save a journal entry to the database
 */
export async function saveJournalEntry(entry: JournalEntry): Promise<number> {
  try {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO journal_entries (mood_score, notes, photo_path, created_at) VALUES (?, ?, ?, ?)',
      [entry.moodScore, entry.notes || null, entry.photoPath || null, entry.createdAt]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    // Re-throw database initialization errors
    if (error instanceof Error && error.message.includes('Database not initialized')) {
      throw error;
    }
    throw new Error('Failed to save journal entry');
  }
}

/**
 * Get all journal entries from the database
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const database = getDatabase();
    const rows = await database.getAllAsync<JournalEntry>(
      'SELECT * FROM journal_entries ORDER BY created_at DESC'
    );
    return rows.map(row => ({
      id: row.id,
      moodScore: row.moodScore,
      notes: row.notes,
      photoPath: row.photoPath,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw new Error('Failed to get journal entries');
  }
}

/**
 * Delete a journal entry from the database
 */
export async function deleteJournalEntry(id: number): Promise<void> {
  try {
    const database = getDatabase();
    await database.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw new Error('Failed to delete journal entry');
  }
}

/**
 * Save a plant to the garden
 */
export async function savePlant(plant: GardenPlant): Promise<number> {
  try {
    const database = getDatabase();
    const result = await database.runAsync(
      `INSERT INTO garden_plants (
        name, placement, healing_benefit, care_difficulty, estimated_cost,
        watering_frequency_days, last_watered_at, next_watering_at,
        care_instructions, notification_id, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant.name,
        plant.placement || null,
        plant.healingBenefit || null,
        plant.careDifficulty,
        plant.estimatedCost || null,
        plant.wateringFrequencyDays,
        plant.lastWateredAt || null,
        plant.nextWateringAt,
        plant.careInstructions || null,
        plant.notificationId || null,
        plant.addedAt,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error saving plant:', error);
    throw new Error('Failed to save plant');
  }
}

/**
 * Get all plants from the garden
 */
export async function getGardenPlants(): Promise<GardenPlant[]> {
  try {
    const database = getDatabase();
    const rows = await database.getAllAsync<GardenPlant>(
      'SELECT * FROM garden_plants ORDER BY added_at DESC'
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      placement: row.placement,
      healingBenefit: row.healingBenefit,
      careDifficulty: row.careDifficulty as 'easy' | 'medium' | 'hard',
      estimatedCost: row.estimatedCost,
      wateringFrequencyDays: row.wateringFrequencyDays,
      lastWateredAt: row.lastWateredAt,
      nextWateringAt: row.nextWateringAt,
      careInstructions: row.careInstructions,
      notificationId: row.notificationId,
      addedAt: row.addedAt,
    }));
  } catch (error) {
    console.error('Error getting garden plants:', error);
    throw new Error('Failed to get garden plants');
  }
}

/**
 * Update plant watering date
 */
export async function updatePlantWateringDate(plantId: number, date: Date): Promise<void> {
  try {
    const database = getDatabase();
    const lastWatered = date.toISOString();
    
    // Get the plant to calculate next watering date
    const plant = await database.getFirstAsync<GardenPlant>(
      'SELECT watering_frequency_days FROM garden_plants WHERE id = ?',
      [plantId]
    );
    
    if (!plant) {
      throw new Error('Plant not found');
    }
    
    const nextWateringDate = new Date(date);
    nextWateringDate.setDate(nextWateringDate.getDate() + plant.wateringFrequencyDays);
    const nextWatering = nextWateringDate.toISOString();
    
    await database.runAsync(
      'UPDATE garden_plants SET last_watered_at = ?, next_watering_at = ? WHERE id = ?',
      [lastWatered, nextWatering, plantId]
    );
  } catch (error) {
    console.error('Error updating plant watering date:', error);
    throw new Error('Failed to update plant watering date');
  }
}

/**
 * Delete a plant from the garden
 */
export async function deletePlant(plantId: number): Promise<void> {
  try {
    const database = getDatabase();
    await database.runAsync('DELETE FROM garden_plants WHERE id = ?', [plantId]);
  } catch (error) {
    console.error('Error deleting plant:', error);
    throw new Error('Failed to delete plant');
  }
}

/**
 * Save a mood check-in
 */
export async function saveMoodCheckIn(mood: MoodCheckIn): Promise<void> {
  try {
    const database = getDatabase();
    await database.runAsync(
      'INSERT INTO mood_checkins (mood_score, created_at) VALUES (?, ?)',
      [mood.moodScore, mood.createdAt]
    );
  } catch (error) {
    console.error('Error saving mood check-in:', error);
    throw new Error('Failed to save mood check-in');
  }
}

/**
 * Cache plant data from API
 */
export async function cachePlantData(
  plantName: string,
  data: PlantAPIResponse,
  expiryDate: Date
): Promise<void> {
  try {
    const database = getDatabase();
    const now = new Date().toISOString();
    const expires = expiryDate.toISOString();
    const apiResponse = JSON.stringify(data);
    
    await database.runAsync(
      `INSERT OR REPLACE INTO plant_cache (plant_name, api_response, cached_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [plantName, apiResponse, now, expires]
    );
  } catch (error) {
    console.error('Error caching plant data:', error);
    throw new Error('Failed to cache plant data');
  }
}

/**
 * Get cached plant data
 */
export async function getCachedPlantData(plantName: string): Promise<PlantAPIResponse | null> {
  try {
    const database = getDatabase();
    const now = new Date().toISOString();
    
    const row = await database.getFirstAsync<PlantCacheEntry>(
      'SELECT * FROM plant_cache WHERE plant_name = ? AND expires_at > ?',
      [plantName, now]
    );
    
    if (!row) {
      return null;
    }
    
    return JSON.parse(row.apiResponse);
  } catch (error) {
    console.error('Error getting cached plant data:', error);
    return null;
  }
}
