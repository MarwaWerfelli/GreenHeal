import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { getJournalEntries } from '../modules/storage';
import { COLORS } from '../utils/constants';
import type { JournalEntry } from '../types';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, BottomTabParamList } from '../types';

type HealingJournalScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'HealingJournal'>,
  StackScreenProps<RootStackParamList>
>;

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];

export default function HealingJournalScreen({ navigation }: HealingJournalScreenProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  async function loadEntries() {
    setLoading(true);
    try {
      const journalEntries = await getJournalEntries();
      // Sort by date descending (newest first)
      const sorted = journalEntries.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setEntries(sorted);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  function renderEntry({ item }: { item: JournalEntry }) {
    const moodEmoji = MOOD_EMOJIS[item.moodScore - 1];
    const notesPreview = item.notes
      ? item.notes.length > 100
        ? item.notes.substring(0, 100) + '...'
        : item.notes
      : t('journal.noNotes');

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => {
          if (item.id) {
            navigation.navigate('JournalEntryDetail', { entryId: item.id });
          }
        }}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        {item.photoPath && (
          <Image
            source={{ uri: item.photoPath }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.notesPreview}>{notesPreview}</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('journal.noEntries')}</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id!.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.newEntryButton}
        onPress={() => {
          // @ts-ignore - navigation type issue
          navigation.navigate('JournalEntryForm');
        }}
      >
        <Text style={styles.newEntryButtonText}>+ {t('journal.newEntry')}</Text>
      </TouchableOpacity>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  entryDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesPreview: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  newEntryButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  newEntryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
