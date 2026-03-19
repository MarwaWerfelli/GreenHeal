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
        added_at TEXT NOT NULL,
        watering_reminder_enabled INTEGER DEFAULT 1,
        last_watered_date TEXT,
        next_watering_date TEXT,
        reminder_time TEXT
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

    // Migrate existing plants to add new watering reminder fields
    await migrateWateringReminderFields();

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

function isRowRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeQueryRows<Row extends Record<string, unknown>>(rows: unknown): Row[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(isRowRecord) as Row[];
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function coerceMoodScore(value: unknown): JournalEntry['moodScore'] {
  const moodScore = coerceNumber(value, 3);
  return moodScore >= 1 && moodScore <= 5 ? moodScore as JournalEntry['moodScore'] : 3;
}

function coerceCareDifficulty(value: unknown): GardenPlant['careDifficulty'] {
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : 'easy';
}

/**
 * Calculate next watering date based on last watered date and frequency
 */
export function calculateNextWateringDate(lastWateredDate: string, wateringFrequencyDays: number): string {
  const lastWatered = new Date(lastWateredDate);
  const nextWatering = new Date(lastWatered);
  nextWatering.setDate(nextWatering.getDate() + wateringFrequencyDays);
  return nextWatering.toISOString();
}

/**
 * Migrate existing plants to add watering reminder fields
 */
async function migrateWateringReminderFields(): Promise<void> {
  try {
    const database = getDatabase();
    
    // Check if the new columns already exist
    const tableInfo = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(garden_plants)"
    );
    
    const columnNames = normalizeQueryRows<{ name?: unknown }>(tableInfo)
      .map(col => col.name)
      .filter((name): name is string => typeof name === 'string');
    const hasNewFields = columnNames.includes('watering_reminder_enabled');
    
    if (!hasNewFields) {
      // Add new columns
      await database.execAsync(`
        ALTER TABLE garden_plants ADD COLUMN watering_reminder_enabled INTEGER DEFAULT 1;
      `);
      await database.execAsync(`
        ALTER TABLE garden_plants ADD COLUMN last_watered_date TEXT;
      `);
      await database.execAsync(`
        ALTER TABLE garden_plants ADD COLUMN next_watering_date TEXT;
      `);
      await database.execAsync(`
        ALTER TABLE garden_plants ADD COLUMN reminder_time TEXT;
      `);
      
      // Migrate existing data: copy last_watered_at to last_watered_date and next_watering_at to next_watering_date
      await database.execAsync(`
        UPDATE garden_plants 
        SET last_watered_date = last_watered_at,
            next_watering_date = next_watering_at
        WHERE last_watered_at IS NOT NULL;
      `);
      
      console.log('Watering reminder fields migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating watering reminder fields:', error);
    // Don't throw - allow app to continue even if migration fails
  }
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
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM journal_entries ORDER BY created_at DESC'
    );

    return normalizeQueryRows<Record<string, unknown>>(rows).map(row => ({
      id: typeof row.id === 'number' ? row.id : coerceNumber(row.id, 0) || undefined,
      moodScore: coerceMoodScore(row.mood_score),
      notes: row.notes as string | undefined,
      photoPath: row.photo_path as string | undefined,
      createdAt: coerceString(row.created_at, new Date(0).toISOString()),
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
    
    // Set default values for new fields if not provided
    const wateringReminderEnabled = plant.wateringReminderEnabled ?? true;
    // Only use lastWateredAt as fallback if lastWateredDate is undefined (not explicitly null)
    const lastWateredDate = plant.lastWateredDate !== undefined ? plant.lastWateredDate : (plant.lastWateredAt || null);
    const nextWateredDate = plant.nextWateringDate !== undefined ? plant.nextWateringDate : (plant.nextWateringAt || null);
    const reminderTime = plant.reminderTime !== undefined ? plant.reminderTime : '09:00'; // Default to 9 AM only if undefined
    
    const result = await database.runAsync(
      `INSERT INTO garden_plants (
        name, placement, healing_benefit, care_difficulty, estimated_cost,
        watering_frequency_days, last_watered_at, next_watering_at,
        care_instructions, notification_id, added_at,
        watering_reminder_enabled, last_watered_date, next_watering_date, reminder_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        wateringReminderEnabled ? 1 : 0,
        lastWateredDate,
        nextWateredDate,
        reminderTime,
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
    const rows = await database.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM garden_plants ORDER BY added_at DESC'
    );

    return normalizeQueryRows<Record<string, unknown>>(rows).map(row => ({
      id: typeof row.id === 'number' ? row.id : coerceNumber(row.id, 0) || undefined,
      name: coerceString(row.name, 'Plant'),
      placement: coerceOptionalString(row.placement),
      healingBenefit: coerceOptionalString(row.healing_benefit ?? row.healingBenefit),
      careDifficulty: coerceCareDifficulty(row.care_difficulty ?? row.careDifficulty),
      estimatedCost: coerceOptionalString(row.estimated_cost ?? row.estimatedCost),
      wateringFrequencyDays: coerceNumber(row.watering_frequency_days ?? row.wateringFrequencyDays, 7),
      lastWateredAt: coerceOptionalString(row.last_watered_at ?? row.lastWateredAt),
      nextWateringAt: coerceString(row.next_watering_at ?? row.nextWateringAt, new Date().toISOString()),
      careInstructions: coerceOptionalString(row.care_instructions ?? row.careInstructions),
      notificationId: coerceOptionalString(row.notification_id ?? row.notificationId),
      addedAt: coerceString(row.added_at ?? row.addedAt, new Date().toISOString()),
      wateringReminderEnabled: Boolean(row.watering_reminder_enabled ?? row.wateringReminderEnabled ?? true),
      lastWateredDate: coerceOptionalString(row.last_watered_date ?? row.lastWateredDate),
      nextWateringDate: coerceOptionalString(row.next_watering_date ?? row.nextWateringDate),
      reminderTime: coerceOptionalString(row.reminder_time ?? row.reminderTime),
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
    const plant = await database.getFirstAsync<{ watering_frequency_days?: number; wateringFrequencyDays?: number }>(
      'SELECT watering_frequency_days FROM garden_plants WHERE id = ?',
      [plantId]
    );
    
    if (!plant) {
      throw new Error('Plant not found');
    }
    
    const days = plant.watering_frequency_days ?? plant.wateringFrequencyDays ?? 7;
    const nextWateringDate = new Date(date);
    nextWateringDate.setDate(nextWateringDate.getDate() + days);
    const nextWatering = nextWateringDate.toISOString();
    
    await database.runAsync(
      'UPDATE garden_plants SET last_watered_at = ?, next_watering_at = ?, last_watered_date = ?, next_watering_date = ? WHERE id = ?',
      [lastWatered, nextWatering, lastWatered, nextWatering, plantId]
    );
  } catch (error) {
    console.error('Error updating plant watering date:', error);
    throw new Error('Failed to update plant watering date');
  }
}

/**
 * Update plant watering reminder settings
 */
export async function updatePlantWateringSettings(
  plantId: number,
  settings: {
    wateringReminderEnabled?: boolean;
    wateringFrequencyDays?: number;
    reminderTime?: string;
    lastWateredDate?: string;
  }
): Promise<void> {
  try {
    const database = getDatabase();
    
    // Build dynamic update query based on provided settings
    const updates: string[] = [];
    const values: (string | number)[] = [];
    
    if (settings.wateringReminderEnabled !== undefined) {
      updates.push('watering_reminder_enabled = ?');
      values.push(settings.wateringReminderEnabled ? 1 : 0);
    }
    
    if (settings.wateringFrequencyDays !== undefined) {
      updates.push('watering_frequency_days = ?');
      values.push(settings.wateringFrequencyDays);
    }
    
    if (settings.reminderTime !== undefined) {
      updates.push('reminder_time = ?');
      values.push(settings.reminderTime);
    }
    
    if (settings.lastWateredDate !== undefined) {
      updates.push('last_watered_date = ?');
      values.push(settings.lastWateredDate);
      updates.push('last_watered_at = ?');
      values.push(settings.lastWateredDate);
      
      // Calculate and update next watering date
      const plant = await database.getFirstAsync<{ watering_frequency_days?: number }>(
        'SELECT watering_frequency_days FROM garden_plants WHERE id = ?',
        [plantId]
      );
      
      if (plant) {
        const days = settings.wateringFrequencyDays ?? plant.watering_frequency_days ?? 7;
        const nextWateringDate = calculateNextWateringDate(settings.lastWateredDate, days);
        updates.push('next_watering_date = ?');
        values.push(nextWateringDate);
        updates.push('next_watering_at = ?');
        values.push(nextWateringDate);
      }
    } else if (settings.wateringFrequencyDays !== undefined) {
      // If only frequency changed, recalculate next watering date based on last watered date
      const plant = await database.getFirstAsync<{ last_watered_date?: string }>(
        'SELECT last_watered_date FROM garden_plants WHERE id = ?',
        [plantId]
      );
      
      if (plant?.last_watered_date) {
        const nextWateringDate = calculateNextWateringDate(plant.last_watered_date, settings.wateringFrequencyDays);
        updates.push('next_watering_date = ?');
        values.push(nextWateringDate);
        updates.push('next_watering_at = ?');
        values.push(nextWateringDate);
      }
    }
    
    if (updates.length === 0) {
      return; // Nothing to update
    }
    
    values.push(plantId);
    const query = `UPDATE garden_plants SET ${updates.join(', ')} WHERE id = ?`;
    
    await database.runAsync(query, values);
  } catch (error) {
    console.error('Error updating plant watering settings:', error);
    throw new Error('Failed to update plant watering settings');
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
