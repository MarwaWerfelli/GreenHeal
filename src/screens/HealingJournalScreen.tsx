import React, { useState, useCallback } from 'react';
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
import i18n from '../i18n';
import { useFocusEffect } from '@react-navigation/native';
import { getJournalEntries } from '../modules/storage';
import { DESIGN_SYSTEM } from '../utils/constants';
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
  const colors = DESIGN_SYSTEM.colors;
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
      const sorted = [...(Array.isArray(journalEntries) ? journalEntries : [])].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setEntries(sorted);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return t('journal.today', 'Today');
      } else if (diffInDays === 1) {
        return t('journal.yesterday', 'Yesterday');
      } else if (diffInDays < 7) {
        return t('journal.daysAgo', `${diffInDays} days ago`, { days: diffInDays });
      } else {
        // Use i18n to get current language for localized date formatting
        const locale = i18n.language || 'en';
        const localeMap: Record<string, string> = {
          en: 'en-US',
          fr: 'fr-FR',
          ar: 'ar-SA',
        };
        
        return date.toLocaleDateString(localeMap[locale] || 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  }

  function renderEntry({ item }: { item: JournalEntry }) {
    const moodEmoji = MOOD_EMOJIS[item.moodScore - 1];
    const moodAccent = colors.moodScale[item.moodScore - 1] || colors.primary;
    const safeNotes = typeof item.notes === 'string' ? item.notes : '';
    const notesPreview = safeNotes
      ? safeNotes.length > 100
        ? safeNotes.substring(0, 100) + '...'
        : safeNotes
      : t('journal.noNotes');

    return (
      <TouchableOpacity
        style={[styles.entryCard, { borderColor: moodAccent }]}
        onPress={() => {
          if (item.id) {
            navigation.navigate('JournalEntryDetail', { entryId: item.id });
          }
        }}
      >
        <View style={styles.entryHeader}>
          <View style={[styles.moodBadge, { backgroundColor: `${moodAccent}18` }]}>
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
            <Text style={[styles.moodLabel, { color: moodAccent }]}>{t(`mood.${item.moodScore}`)}</Text>
          </View>
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerEyebrow}>{t('journal.title')}</Text>
          <Text style={styles.headerTitle}>{t('journal.newEntry')}</Text>
        </View>
        <View style={styles.headerCountPill}>
          <Text style={styles.headerCountText}>{entries.length}</Text>
        </View>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🫶</Text>
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
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  headerCard: {
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  headerCountPill: {
    minWidth: 44,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    alignItems: 'center',
  },
  headerCountText: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.sm,
    padding: DESIGN_SYSTEM.spacing.xl,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: 16,
    borderWidth: 1.5,
    ...DESIGN_SYSTEM.shadows.small,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  entryDate: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
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
    color: DESIGN_SYSTEM.colors.textPrimary,
    lineHeight: 22,
  },
  newEntryButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.glow,
  },
  newEntryButtonText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
