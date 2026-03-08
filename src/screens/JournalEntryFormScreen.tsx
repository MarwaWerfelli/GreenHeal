import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveJournalEntry, initDatabase } from '../modules/storage';
import { capturePhoto, pickFromGallery, saveImage } from '../modules/image';
import { COLORS } from '../utils/constants';
import type { JournalEntryFormScreenProps } from '../types';

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];

export default function JournalEntryFormScreen({ navigation }: JournalEntryFormScreenProps) {
  const { t } = useTranslation();
  const [moodScore, setMoodScore] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleTakePhoto() {
    try {
      const result = await capturePhoto();
      if (result && typeof result === 'string') {
        setPhotoUri(result);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('errors.generic'));
    }
  }

  async function handleChooseFromGallery() {
    try {
      const results = await pickFromGallery(false); // Single image selection
      if (results && results.length > 0) {
        console.log('Selected image:', results[0]);
        setPhotoUri(results[0]);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert(t('errors.generic'));
    }
  }

  function showPhotoOptions() {
    Alert.alert(
      t('journal.addPhoto'),
      '',
      [
        {
          text: t('journal.takePhoto'),
          onPress: handleTakePhoto,
        },
        {
          text: t('journal.chooseFromGallery'),
          onPress: handleChooseFromGallery,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }

  async function handleSave() {
    if (!moodScore) {
      Alert.alert(t('errors.generic'), 'Please select your mood');
      return;
    }

    setSaving(true);
    try {
      await initDatabase();

      let savedPhotoPath: string | undefined;
      if (photoUri) {
        console.log('Saving photo:', photoUri);
        savedPhotoPath = await saveImage(photoUri, 'journal_photos');
        console.log('Photo saved to:', savedPhotoPath);
      }

      const entryData = {
        moodScore,
        notes: notes.trim() || undefined,
        photoPath: savedPhotoPath,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Saving journal entry:', entryData);
      await saveJournalEntry(entryData);
      console.log('Journal entry saved successfully');

      navigation.goBack();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert(t('errors.save_failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('journal.moodScale')}</Text>
        <View style={styles.moodSelector}>
          {MOOD_EMOJIS.map((emoji, index) => {
            const score = (index + 1) as 1 | 2 | 3 | 4 | 5;
            const isSelected = moodScore === score;
            return (
              <TouchableOpacity
                key={score}
                style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
                onPress={() => setMoodScore(score)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('journal.notes')}</Text>
        <TextInput
          style={styles.notesInput}
          placeholder={t('journal.notesPlaceholder')}
          placeholderTextColor={COLORS.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
            >
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
            <Text style={styles.addPhotoText}>📷 {t('journal.addPhoto')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  moodEmoji: {
    fontSize: 32,
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
    marginBottom: 24,
    minHeight: 150,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary + '30',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  addPhotoText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
