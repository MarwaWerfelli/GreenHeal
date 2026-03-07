import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getJournalEntries, deleteJournalEntry } from '../modules/storage';
import { deleteImage } from '../modules/image';
import { COLORS } from '../utils/constants';
import type { JournalEntry } from '../types';
import type { JournalEntryDetailScreenProps } from '../types';

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];

export default function JournalEntryDetailScreen({ route, navigation }: JournalEntryDetailScreenProps) {
  const { entryId } = route.params;
  const { t } = useTranslation();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  async function loadEntry() {
    setLoading(true);
    try {
      const entries = await getJournalEntries();
      const found = entries.find((e) => e.id === entryId);
      setEntry(found || null);
    } catch (error) {
      console.error('Error loading journal entry:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function handleDelete() {
    Alert.alert(
      t('journal.deleteEntry'),
      t('journal.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  }

  async function confirmDelete() {
    if (!entry) return;

    setDeleting(true);
    try {
      // Delete photo file if exists
      if (entry.photoPath) {
        await deleteImage(entry.photoPath);
      }

      // Delete entry from database
      await deleteJournalEntry(entry.id!);

      navigation.goBack();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      Alert.alert(t('errors.generic'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  const moodEmoji = MOOD_EMOJIS[entry.moodScore - 1];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.moodLabel}>{t(`mood.${entry.moodScore}`)}</Text>
            <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
          </View>
        </View>

        {entry.photoPath && (
          <Image
            source={{ uri: entry.photoPath }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}

        {entry.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>{t('journal.notes')}</Text>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.deleteButtonText}>{t('journal.deleteEntry')}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
  },
  notesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
