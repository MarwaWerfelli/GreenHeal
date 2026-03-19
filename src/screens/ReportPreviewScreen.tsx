import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { exportReportDraftToFile } from '../modules/reportExport';
import { getGardenPlants, getJournalEntries, getOnboardingData, saveOnboardingData } from '../modules/storage';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { GardenPlant, JournalEntry, OnboardingData, ReportExportRecord, ReportHandoffMethod } from '../types';

type PreviewState = {
  onboarding: OnboardingData | null;
  plants: GardenPlant[];
  recentEntries: JournalEntry[];
  recentNotes: string[];
  averageMood: string | null;
  hadPartialFailure: boolean;
};

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const HANDOFF_METHODS: ReportHandoffMethod[] = ['care_team_email', 'hospital_portal', 'print_packet'];
const colors = DESIGN_SYSTEM.colors;
const shadows = DESIGN_SYSTEM.shadows;

function isWithinLastWeek(value?: string): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp) && Date.now() - timestamp <= WEEK_IN_MS;
}

function formatReviewDate(value?: string): string | null {
  if (!value) return null;

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp.toLocaleDateString();
}

function getFileNameFromUri(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const segments = value.split('/').filter(Boolean);
  return segments.length ? segments[segments.length - 1] : value;
}

function getNormalizedExportHistory(reportSharing?: OnboardingData['reportSharing'] | null): ReportExportRecord[] {
  const persistedHistory = Array.isArray(reportSharing?.exportHistory)
    ? reportSharing.exportHistory.filter((record): record is ReportExportRecord => (
      Boolean(record?.generatedAt) && Boolean(record?.fileUri)
    ))
    : [];

  if (reportSharing?.exportGeneratedAt && reportSharing.exportFileUri) {
    const latestPersistedRecord = persistedHistory[persistedHistory.length - 1];

    if (
      !latestPersistedRecord ||
      latestPersistedRecord.generatedAt !== reportSharing.exportGeneratedAt ||
      latestPersistedRecord.fileUri !== reportSharing.exportFileUri
    ) {
      return [
        ...persistedHistory,
        {
          generatedAt: reportSharing.exportGeneratedAt,
          fileUri: reportSharing.exportFileUri,
        },
      ];
    }
  }

  return persistedHistory;
}

function getExportHistoryRecordKey(record: ReportExportRecord): string {
  return `${record.generatedAt}::${record.fileUri}`;
}

function getDraftStatusKey(
  hasPartialFailure: boolean,
  isReadyForFutureSharing: boolean,
  hasPreparedHandoff: boolean,
  hasGeneratedExport: boolean,
): string {
  if (hasPartialFailure) {
    return 'reportPreview.artifactStatusPartial';
  }

  if (hasGeneratedExport) {
    return 'reportPreview.artifactStatusExported';
  }

  if (hasPreparedHandoff) {
    return 'reportPreview.artifactStatusPrepared';
  }

  return isReadyForFutureSharing
    ? 'reportPreview.artifactStatusReady'
    : 'reportPreview.artifactStatusPending';
}

function getHandoffMethodLabel(t: (key: string) => string, method: ReportHandoffMethod): string {
  if (method === 'care_team_email') {
    return t('reportPreview.handoffMethodEmail');
  }

  if (method === 'hospital_portal') {
    return t('reportPreview.handoffMethodPortal');
  }

  return t('reportPreview.handoffMethodPrint');
}

type ReportDraftTextOptions = {
  patientName: string;
  recipient: string;
  healingFocus: string;
  recentEntryCount: number;
  plantsInCareCount: number;
  averageMood: string | null;
  newPlantsThisWeek: number;
  recentNotes: string[];
  reportStatus: string;
  handoffStatus: string;
  handoffMethodLabel: string | null;
  t: (key: string) => string;
};

function buildReportDraftText({
  patientName,
  recipient,
  healingFocus,
  recentEntryCount,
  plantsInCareCount,
  averageMood,
  newPlantsThisWeek,
  recentNotes,
  reportStatus,
  handoffStatus,
  handoffMethodLabel,
  t,
}: ReportDraftTextOptions): string {
  const reflectionLines = recentNotes.length > 0
    ? recentNotes.map((note) => `- ${note}`)
    : [`- ${t('reportPreview.noReflections')}`];

  const handoffLines = handoffMethodLabel
    ? [`${t('reportPreview.handoffMethodLabel')}: ${handoffMethodLabel}`]
    : [];

  return [
    t('reportPreview.artifactTitle'),
    `${t('reportPreview.patient')}: ${patientName}`,
    `${t('reportPreview.careTeam')}: ${recipient}`,
    `${t('reportPreview.healingFocus')}: ${healingFocus}`,
    `${t('reportPreview.artifactStatusLabel')}: ${reportStatus}`,
    `${t('reportPreview.handoffStatusLabel')}: ${handoffStatus}`,
    ...handoffLines,
    `${t('reportPreview.artifactWindowLabel')}: ${t('reportPreview.windowLabel')}`,
    '',
    `${t('reportPreview.summaryTitle')}:`,
    `- ${t('reportPreview.entriesThisWeek')}: ${recentEntryCount}`,
    `- ${t('reportPreview.plantsInCare')}: ${plantsInCareCount}`,
    `- ${t('reportPreview.averageMood')}: ${averageMood ?? t('reportPreview.notAvailable')}`,
    `- ${t('reportPreview.newPlantsThisWeek')}: ${newPlantsThisWeek}`,
    '',
    `${t('reportPreview.reflectionsTitle')}:`,
    ...reflectionLines,
  ].join('\n');
}

export default function ReportPreviewScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasReviewedSummary, setHasReviewedSummary] = useState(false);
  const [understandsOptionalSharing, setUnderstandsOptionalSharing] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedReviewAt, setSavedReviewAt] = useState<string | null>(null);
  const [selectedHandoffMethod, setSelectedHandoffMethod] = useState<ReportHandoffMethod | null>(null);
  const [isSavingHandoff, setIsSavingHandoff] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [savedHandoffAt, setSavedHandoffAt] = useState<string | null>(null);
  const [isExportingDraft, setIsExportingDraft] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedExportAt, setSavedExportAt] = useState<string | null>(null);
  const [savedExportUri, setSavedExportUri] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ReportExportRecord[]>([]);
  const [selectedHistoryRecordKey, setSelectedHistoryRecordKey] = useState<string | null>(null);
  const [isCleaningHistory, setIsCleaningHistory] = useState(false);
  const [historyCleanupError, setHistoryCleanupError] = useState<string | null>(null);
  const [isOpeningShare, setIsOpeningShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [hasOpenedShareSheet, setHasOpenedShareSheet] = useState(false);
  const [sharedExportUri, setSharedExportUri] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({
    onboarding: null,
    plants: [],
    recentEntries: [],
    recentNotes: [],
    averageMood: null,
    hadPartialFailure: false,
  });

  useEffect(() => {
    async function loadPreview() {
      const results = await Promise.allSettled([
        getOnboardingData(),
        getGardenPlants(),
        getJournalEntries(),
      ]);

      const onboarding = results[0].status === 'fulfilled' ? results[0].value : null;
      const plants = results[1].status === 'fulfilled' ? results[1].value : [];
      const journalEntries = results[2].status === 'fulfilled' ? results[2].value : [];
      const recentEntries = journalEntries.filter((entry) => isWithinLastWeek(entry.createdAt));
      const recentNotes = recentEntries
        .map((entry) => entry.notes?.trim())
        .filter((note): note is string => Boolean(note))
        .slice(0, 2);
      const averageMood = recentEntries.length
        ? (recentEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / recentEntries.length).toFixed(1)
        : null;
      const reportSharing = onboarding?.reportSharing;

      setPreview({
        onboarding,
        plants,
        recentEntries,
        recentNotes,
        averageMood,
        hadPartialFailure: results.some((result) => result.status === 'rejected'),
      });
      setHasReviewedSummary(Boolean(reportSharing?.reviewedAt));
      setUnderstandsOptionalSharing(Boolean(reportSharing?.consentConfirmedAt));
      setSelectedHandoffMethod(reportSharing?.handoffMethod ?? null);
      setSavedReviewAt(
        reportSharing?.readyForFutureSharing
          ? reportSharing.reviewedAt ?? reportSharing.consentConfirmedAt ?? null
          : null
      );
      setSavedHandoffAt(reportSharing?.handoffPreparedAt ?? null);
      setSavedExportAt(reportSharing?.exportGeneratedAt ?? null);
      setSavedExportUri(reportSharing?.exportFileUri ?? null);
      setExportHistory(getNormalizedExportHistory(reportSharing));
      setIsLoading(false);
    }

    loadPreview();
  }, []);

  const profile = preview.onboarding?.reportProfile;
  const patientName = profile?.preferredName || profile?.fullName || t('reportPreview.notAvailable');
  const recipient = [profile?.clinicianName, profile?.hospitalName].filter(Boolean).join(' • ') || t('reportPreview.notAssigned');
  const healingFocusKey = preview.onboarding?.healingGoal ?? 'wellness';
  const healingFocus = t(`onboarding.healingGoals.${healingFocusKey}`);
  const newPlantsThisWeek = preview.plants.filter((plant) => isWithinLastWeek(plant.addedAt)).length;
  const isConfirmDisabled =
    !preview.onboarding ||
    preview.hadPartialFailure ||
    !hasReviewedSummary ||
    !understandsOptionalSharing ||
    isSavingReview;
  const reviewDateLabel = formatReviewDate(savedReviewAt ?? preview.onboarding?.reportSharing?.reviewedAt);
  const handoffDateLabel = formatReviewDate(savedHandoffAt ?? preview.onboarding?.reportSharing?.handoffPreparedAt);
  const exportDateLabel = formatReviewDate(savedExportAt ?? preview.onboarding?.reportSharing?.exportGeneratedAt);
  const isReadyForFutureSharing = Boolean(
    (savedReviewAt || preview.onboarding?.reportSharing?.readyForFutureSharing) &&
    hasReviewedSummary &&
    understandsOptionalSharing
  );
  const hasPreparedHandoff = Boolean(savedHandoffAt || preview.onboarding?.reportSharing?.handoffPreparedAt);
  const hasGeneratedExport = Boolean(
    (savedExportAt || preview.onboarding?.reportSharing?.exportGeneratedAt) &&
    (savedExportUri || preview.onboarding?.reportSharing?.exportFileUri)
  );
  const draftStatusKey = getDraftStatusKey(
    preview.hadPartialFailure,
    isReadyForFutureSharing,
    hasPreparedHandoff,
    hasGeneratedExport,
  );
  const draftStatus = t(draftStatusKey);
  const handoffStatus = t(
    hasPreparedHandoff
      ? 'reportPreview.handoffStatusPrepared'
      : isReadyForFutureSharing
        ? 'reportPreview.handoffStatusReady'
        : 'reportPreview.handoffStatusPending'
  );
  const selectedHandoffMethodLabel = selectedHandoffMethod
    ? getHandoffMethodLabel(t, selectedHandoffMethod)
    : null;
  const reportDraftText = buildReportDraftText({
    patientName,
    recipient,
    healingFocus,
    recentEntryCount: preview.recentEntries.length,
    plantsInCareCount: preview.plants.length,
    averageMood: preview.averageMood,
    newPlantsThisWeek,
    recentNotes: preview.recentNotes,
    reportStatus: draftStatus,
    handoffStatus,
    handoffMethodLabel: selectedHandoffMethodLabel,
    t,
  });
  const isHandoffDisabled =
    !preview.onboarding ||
    preview.hadPartialFailure ||
    !isReadyForFutureSharing ||
    !selectedHandoffMethod ||
    isSavingHandoff;
  const isExportDisabled =
    !preview.onboarding ||
    preview.hadPartialFailure ||
    !hasPreparedHandoff ||
    isExportingDraft;
  const exportUri = savedExportUri ?? preview.onboarding?.reportSharing?.exportFileUri ?? null;
  const exportedFileName = getFileNameFromUri(exportUri);
  const exportHistoryItems = exportHistory.slice().reverse();
  const latestExportRecord = exportHistory[exportHistory.length - 1] ?? null;
  const latestExportHistoryItem = exportHistoryItems[0] ?? null;
  const previousExportHistoryItems = exportHistoryItems.slice(1);
  const selectedHistoryRecord = selectedHistoryRecordKey
    ? exportHistoryItems.find((record) => getExportHistoryRecordKey(record) === selectedHistoryRecordKey) ?? null
    : null;
  const sharedExportFileName = getFileNameFromUri(sharedExportUri);
  const selectedHistoryFileName = getFileNameFromUri(selectedHistoryRecord?.fileUri ?? null);
  const selectedHistoryDateLabel = formatReviewDate(selectedHistoryRecord?.generatedAt);
  const isSelectedHistoryLatest = Boolean(
    selectedHistoryRecord &&
    latestExportRecord &&
    selectedHistoryRecord.generatedAt === latestExportRecord.generatedAt &&
    selectedHistoryRecord.fileUri === latestExportRecord.fileUri
  );
  const canClearOlderExports = Boolean(preview.onboarding) && exportHistory.length > 1 && !isCleaningHistory;
  const isShareDisabled =
    !preview.onboarding ||
    preview.hadPartialFailure ||
    !hasGeneratedExport ||
    !exportUri ||
    isOpeningShare;

  const resetShareState = () => {
    setShareError(null);
    setHasOpenedShareSheet(false);
    setSharedExportUri(null);
  };

  const resetHistoryCleanupState = () => {
    setHistoryCleanupError(null);
  };

  const resetExportState = () => {
    setExportError(null);
    setSavedExportAt(null);
    setSavedExportUri(null);
    resetHistoryCleanupState();
    resetShareState();
  };

  const handleToggleSummaryReview = () => {
    setHasReviewedSummary((previous) => !previous);
    setSaveError(null);
    setHandoffError(null);
    setSavedReviewAt(null);
    setSavedHandoffAt(null);
    resetExportState();
  };

  const handleToggleConsentReview = () => {
    setUnderstandsOptionalSharing((previous) => !previous);
    setSaveError(null);
    setHandoffError(null);
    setSavedReviewAt(null);
    setSavedHandoffAt(null);
    resetExportState();
  };

  const handleSelectHandoffMethod = (method: ReportHandoffMethod) => {
    setSelectedHandoffMethod(method);
    setHandoffError(null);
    setSavedHandoffAt(null);
    resetExportState();
  };

  const handleSaveReview = async () => {
    if (isConfirmDisabled || !preview.onboarding) {
      return;
    }

    setIsSavingReview(true);
    setSaveError(null);

    const now = new Date().toISOString();
    const updatedOnboarding: OnboardingData = {
      ...preview.onboarding,
      reportSharing: {
        ...preview.onboarding.reportSharing,
        readyForFutureSharing: true,
        reviewedAt: now,
        consentConfirmedAt: now,
        handoffPreparedAt: undefined,
        exportGeneratedAt: undefined,
        exportFileUri: undefined,
      },
    };

    try {
      await saveOnboardingData(updatedOnboarding);
      setPreview((currentPreview) => ({
        ...currentPreview,
        onboarding: updatedOnboarding,
      }));
      setSavedReviewAt(now);
      setSavedHandoffAt(null);
      resetExportState();
    } catch (error) {
      setSaveError(t('reportPreview.saveError'));
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleSaveHandoff = async () => {
    if (isHandoffDisabled || !preview.onboarding || !selectedHandoffMethod) {
      return;
    }

    setIsSavingHandoff(true);
    setHandoffError(null);

    const now = new Date().toISOString();
    const updatedOnboarding: OnboardingData = {
      ...preview.onboarding,
      reportSharing: {
        ...preview.onboarding.reportSharing,
        readyForFutureSharing: true,
        handoffMethod: selectedHandoffMethod,
        handoffPreparedAt: now,
        exportGeneratedAt: undefined,
        exportFileUri: undefined,
      },
    };

    try {
      await saveOnboardingData(updatedOnboarding);
      setPreview((currentPreview) => ({
        ...currentPreview,
        onboarding: updatedOnboarding,
      }));
      setSavedHandoffAt(now);
      resetExportState();
    } catch (error) {
      setHandoffError(t('reportPreview.handoffSaveError'));
    } finally {
      setIsSavingHandoff(false);
    }
  };

  const handleGenerateExport = async () => {
    if (isExportDisabled || !preview.onboarding) {
      return;
    }

    setIsExportingDraft(true);
    setExportError(null);
    resetHistoryCleanupState();
    resetShareState();

    try {
      const fileUri = await exportReportDraftToFile(reportDraftText, patientName);
      const now = new Date().toISOString();
      const updatedExportHistory = [
        ...getNormalizedExportHistory(preview.onboarding.reportSharing),
        {
          generatedAt: now,
          fileUri,
        },
      ];
      const updatedOnboarding: OnboardingData = {
        ...preview.onboarding,
        reportSharing: {
          ...preview.onboarding.reportSharing,
          exportGeneratedAt: now,
          exportFileUri: fileUri,
          exportHistory: updatedExportHistory,
        },
      };

      await saveOnboardingData(updatedOnboarding);
      setPreview((currentPreview) => ({
        ...currentPreview,
        onboarding: updatedOnboarding,
      }));
      setSavedExportAt(now);
      setSavedExportUri(fileUri);
      setExportHistory(updatedExportHistory);
    } catch (error) {
      setExportError(t('reportPreview.exportSaveError'));
    } finally {
      setIsExportingDraft(false);
    }
  };

  const openShareSheetForUri = async (fileUri: string) => {
    setIsOpeningShare(true);
    setShareError(null);

    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        setShareError(t('reportPreview.shareError'));
        return;
      }

      await Sharing.shareAsync(fileUri, {
        dialogTitle: t('reportPreview.shareSheetTitle'),
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
      });

      setSharedExportUri(fileUri);
      setHasOpenedShareSheet(true);
    } catch (error) {
      setShareError(t('reportPreview.shareError'));
    } finally {
      setIsOpeningShare(false);
    }
  };

  const handleShareExport = async () => {
    if (isShareDisabled || !exportUri) {
      return;
    }

    await openShareSheetForUri(exportUri);
  };

  const handleShareHistoryExport = async (fileUri?: string | null) => {
    if (isOpeningShare || !fileUri) {
      return;
    }

    await openShareSheetForUri(fileUri);
  };

  const handleSelectHistoryExport = (record: ReportExportRecord) => {
    setSelectedHistoryRecordKey(getExportHistoryRecordKey(record));
  };

  const handleRemoveHistoryExport = async (recordToRemove: ReportExportRecord) => {
    if (!preview.onboarding || isCleaningHistory || exportHistory.length <= 1) {
      return;
    }

    if (
      latestExportRecord &&
      latestExportRecord.generatedAt === recordToRemove.generatedAt &&
      latestExportRecord.fileUri === recordToRemove.fileUri
    ) {
      return;
    }

    setIsCleaningHistory(true);
    resetHistoryCleanupState();
    resetShareState();

    try {
      const updatedExportHistory = exportHistory.filter(
        (record) =>
          record.generatedAt !== recordToRemove.generatedAt ||
          record.fileUri !== recordToRemove.fileUri
      );

      if (!latestExportRecord || updatedExportHistory.length === exportHistory.length) {
        return;
      }

      const updatedOnboarding: OnboardingData = {
        ...preview.onboarding,
        reportSharing: {
          ...preview.onboarding.reportSharing,
          exportGeneratedAt: latestExportRecord.generatedAt,
          exportFileUri: latestExportRecord.fileUri,
          exportHistory: updatedExportHistory,
        },
      };

      await saveOnboardingData(updatedOnboarding);
      setPreview((currentPreview) => ({
        ...currentPreview,
        onboarding: updatedOnboarding,
      }));
      setSavedExportAt(latestExportRecord.generatedAt);
      setSavedExportUri(latestExportRecord.fileUri);
      setExportHistory(updatedExportHistory);
      setSelectedHistoryRecordKey((currentKey) => (
        currentKey === getExportHistoryRecordKey(recordToRemove)
          ? null
          : currentKey
      ));
    } catch (error) {
      setHistoryCleanupError(t('reportPreview.exportHistoryCleanupError'));
    } finally {
      setIsCleaningHistory(false);
    }
  };

  const handleClearOlderExports = async () => {
    if (!preview.onboarding || exportHistory.length <= 1 || isCleaningHistory) {
      return;
    }

    setIsCleaningHistory(true);
    resetHistoryCleanupState();
    resetShareState();

    try {
      const latestExport = exportHistory[exportHistory.length - 1];

      if (!latestExport) {
        return;
      }

      const updatedExportHistory = [latestExport];
      const updatedOnboarding: OnboardingData = {
        ...preview.onboarding,
        reportSharing: {
          ...preview.onboarding.reportSharing,
          exportGeneratedAt: latestExport.generatedAt,
          exportFileUri: latestExport.fileUri,
          exportHistory: updatedExportHistory,
        },
      };

      await saveOnboardingData(updatedOnboarding);
      setPreview((currentPreview) => ({
        ...currentPreview,
        onboarding: updatedOnboarding,
      }));
      setSavedExportAt(latestExport.generatedAt);
      setSavedExportUri(latestExport.fileUri);
      setExportHistory(updatedExportHistory);
      setSelectedHistoryRecordKey((currentKey) => {
        const latestKey = getExportHistoryRecordKey(latestExport);

        if (!currentKey || currentKey === latestKey) {
          return currentKey;
        }

        return null;
      });
    } catch (error) {
      setHistoryCleanupError(t('reportPreview.exportHistoryCleanupError'));
    } finally {
      setIsCleaningHistory(false);
    }
  };

  const renderExportHistoryItem = (record: ReportExportRecord, index: number) => {
    const historyFileName = getFileNameFromUri(record.fileUri);
    const historyDateLabel = formatReviewDate(record.generatedAt);
    const isLatestHistoryItem =
      latestExportRecord?.generatedAt === record.generatedAt &&
      latestExportRecord.fileUri === record.fileUri;
    const isSelectedHistoryItem = getExportHistoryRecordKey(record) === selectedHistoryRecordKey;

    return (
      <View
        key={`${record.generatedAt}-${record.fileUri}`}
        testID={`report-preview-export-history-item-${index}`}
        style={styles.historyItem}
      >
        {historyFileName ? (
          <Text style={styles.savedStateMeta}>{t('reportPreview.exportFileLabel')}: {historyFileName}</Text>
        ) : null}
        {historyDateLabel ? (
          <Text style={styles.savedStateMeta}>{t('reportPreview.exportGeneratedAt')}: {historyDateLabel}</Text>
        ) : null}
        <Text style={styles.exportPathText}>{record.fileUri}</Text>
        <TouchableOpacity
          testID={`report-preview-export-history-share-${index}`}
          style={[styles.historyActionButton, (isOpeningShare || isCleaningHistory) && styles.historyActionButtonDisabled]}
          onPress={() => handleShareHistoryExport(record.fileUri)}
          disabled={isOpeningShare || isCleaningHistory}
          activeOpacity={0.85}
        >
          <Text style={styles.historyActionButtonText}>
            {isOpeningShare ? t('reportPreview.shareOpening') : t('reportPreview.exportHistoryShareButton')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`report-preview-export-history-detail-${index}`}
          style={[
            styles.historyDetailButton,
            isSelectedHistoryItem && styles.historyDetailButtonSelected,
          ]}
          onPress={() => handleSelectHistoryExport(record)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.historyDetailButtonText,
              isSelectedHistoryItem && styles.historyDetailButtonTextSelected,
            ]}
          >
            {isSelectedHistoryItem
              ? t('reportPreview.exportHistoryDetailSelectedButton')
              : t('reportPreview.exportHistoryDetailButton')}
          </Text>
        </TouchableOpacity>
        {!isLatestHistoryItem ? (
          <TouchableOpacity
            testID={`report-preview-export-history-remove-${index}`}
            style={[styles.historyRemoveButton, isCleaningHistory && styles.historyActionButtonDisabled]}
            onPress={() => handleRemoveHistoryExport(record)}
            disabled={isCleaningHistory}
            activeOpacity={0.85}
          >
            <Text style={styles.historyRemoveButtonText}>
              {isCleaningHistory
                ? t('reportPreview.exportHistoryRemoving')
                : t('reportPreview.exportHistoryRemoveButton')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('reportPreview.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text testID="report-preview-screen" style={styles.title}>{t('reportPreview.title')}</Text>
        <Text style={styles.subtitle}>{t('reportPreview.subtitle')}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{t('reportPreview.previewBadge')}</Text></View>

        {preview.hadPartialFailure && (
          <View testID="report-preview-partial-data" style={styles.noticeCard}>
            <Text style={styles.noticeText}>{t('reportPreview.partialDataNotice')}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.profileTitle')}</Text>
          <Text style={styles.detailLabel}>{t('reportPreview.patient')}</Text>
          <Text style={styles.detailValue}>{patientName}</Text>
          <Text style={styles.detailLabel}>{t('reportPreview.careTeam')}</Text>
          <Text style={styles.detailValue}>{recipient}</Text>
          <Text style={styles.detailLabel}>{t('reportPreview.healingFocus')}</Text>
          <Text style={styles.detailValue}>{healingFocus}</Text>
          {profile?.careProgram ? <Text style={styles.metaText}>{t('reportPreview.program')}: {profile.careProgram}</Text> : null}
          {profile?.patientId ? <Text style={styles.metaText}>{t('reportPreview.patientId')}: {profile.patientId}</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.summaryTitle')}</Text>
          <Text style={styles.windowText}>{t('reportPreview.windowLabel')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue} testID="report-preview-stat-entries">{preview.recentEntries.length}</Text>
              <Text style={styles.statLabel}>{t('reportPreview.entriesThisWeek')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{preview.plants.length}</Text>
              <Text style={styles.statLabel}>{t('reportPreview.plantsInCare')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue} testID="report-preview-stat-mood">{preview.averageMood ?? t('reportPreview.notAvailable')}</Text>
              <Text style={styles.statLabel}>{t('reportPreview.averageMood')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{newPlantsThisWeek}</Text>
              <Text style={styles.statLabel}>{t('reportPreview.newPlantsThisWeek')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.reflectionsTitle')}</Text>
          {preview.recentNotes.length > 0 ? (
            preview.recentNotes.map((note, index) => (
              <View key={`${note}-${index}`} style={styles.noteCard}>
                <Text testID={`report-preview-note-${index}`} style={styles.noteText}>{note}</Text>
              </View>
            ))
          ) : (
            <Text testID="report-preview-no-reflections" style={styles.emptyText}>{t('reportPreview.noReflections')}</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.includesTitle')}</Text>
          <Text style={styles.listItem}>• {t('reportPreview.includesProfile')}</Text>
          <Text style={styles.listItem}>• {t('reportPreview.includesJournal')}</Text>
          <Text style={styles.listItem}>• {t('reportPreview.includesPlants')}</Text>
          <Text style={styles.listItem}>• {t('reportPreview.includesConsent')}</Text>
        </View>

        <View style={[styles.sectionCard, styles.consentCard]}>
          <Text style={styles.sectionTitle}>{t('reportPreview.consentTitle')}</Text>
          <Text style={styles.consentBody}>{t('reportPreview.consentBody')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.artifactTitle')}</Text>
          <Text style={styles.reviewIntro}>{t('reportPreview.artifactSubtitle')}</Text>

          <View style={styles.draftMetaRow}>
            <Text style={styles.draftMetaLabel}>{t('reportPreview.artifactStatusLabel')}</Text>
            <View
              style={[
                styles.draftStatusBadge,
                preview.hadPartialFailure
                  ? styles.draftStatusBadgePartial
                  : hasGeneratedExport
                    ? styles.draftStatusBadgeReady
                  : isReadyForFutureSharing
                    ? styles.draftStatusBadgeReady
                    : styles.draftStatusBadgePending,
              ]}
            >
              <Text testID="report-preview-draft-status" style={styles.draftStatusText}>{draftStatus}</Text>
            </View>
          </View>

          <Text style={styles.helperText}>{t('reportPreview.artifactLocalNote')}</Text>

          <View style={styles.draftSurface}>
            <Text testID="report-preview-draft-text" style={styles.draftText}>{reportDraftText}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.reviewTitle')}</Text>
          <Text style={styles.reviewIntro}>{t('reportPreview.reviewSubtitle')}</Text>

          <TouchableOpacity
            testID="report-preview-review-summary-toggle"
            style={[styles.reviewRow, hasReviewedSummary && styles.reviewRowActive]}
            onPress={handleToggleSummaryReview}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, hasReviewedSummary && styles.checkboxActive]}>
              <Text style={styles.checkboxMark}>{hasReviewedSummary ? '✓' : ''}</Text>
            </View>
            <Text style={styles.reviewLabel}>{t('reportPreview.reviewSummaryItem')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="report-preview-review-consent-toggle"
            style={[styles.reviewRow, understandsOptionalSharing && styles.reviewRowActive]}
            onPress={handleToggleConsentReview}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, understandsOptionalSharing && styles.checkboxActive]}>
              <Text style={styles.checkboxMark}>{understandsOptionalSharing ? '✓' : ''}</Text>
            </View>
            <Text style={styles.reviewLabel}>{t('reportPreview.reviewConsentItem')}</Text>
          </TouchableOpacity>

          {!savedReviewAt && (
            <Text style={styles.helperText}>
              {!preview.onboarding
                ? t('reportPreview.missingProfileNote')
                : preview.hadPartialFailure
                  ? t('reportPreview.reviewPartialDataNote')
                  : t('reportPreview.reviewRequiredNote')}
            </Text>
          )}

          {saveError ? (
            <Text testID="report-preview-save-error" style={styles.errorText}>{saveError}</Text>
          ) : null}

          <TouchableOpacity
            testID="report-preview-save-consent"
            style={[styles.submitButton, isConfirmDisabled && styles.submitButtonDisabled]}
            onPress={handleSaveReview}
            disabled={isConfirmDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {isSavingReview ? t('reportPreview.saving') : t('reportPreview.confirmButton')}
            </Text>
          </TouchableOpacity>

          {savedReviewAt && (
            <View testID="report-preview-saved-state" style={styles.savedStateCard}>
              <Text style={styles.savedStateTitle}>{t('reportPreview.savedTitle')}</Text>
              <Text style={styles.savedStateBody}>{t('reportPreview.savedBody')}</Text>
              {reviewDateLabel ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.lastReviewed')}: {reviewDateLabel}</Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.handoffTitle')}</Text>
          <Text style={styles.reviewIntro}>{t('reportPreview.handoffSubtitle')}</Text>

          <View style={styles.handoffMethodsRow}>
            {HANDOFF_METHODS.map((method) => {
              const isSelected = selectedHandoffMethod === method;

              return (
                <TouchableOpacity
                  key={method}
                  testID={`report-preview-handoff-method-${method}`}
                  style={[styles.handoffMethodChip, isSelected && styles.handoffMethodChipSelected]}
                  onPress={() => handleSelectHandoffMethod(method)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.handoffMethodText, isSelected && styles.handoffMethodTextSelected]}>
                    {getHandoffMethodLabel(t, method)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!savedHandoffAt && (
            <Text style={styles.helperText}>
              {!preview.onboarding
                ? t('reportPreview.missingProfileNote')
                : preview.hadPartialFailure
                  ? t('reportPreview.handoffPartialDataNote')
                  : !isReadyForFutureSharing
                    ? t('reportPreview.handoffNeedsReviewNote')
                    : !selectedHandoffMethod
                      ? t('reportPreview.handoffMethodRequiredNote')
                      : t('reportPreview.handoffLocalOnlyNote')}
            </Text>
          )}

          {handoffError ? (
            <Text testID="report-preview-handoff-save-error" style={styles.errorText}>{handoffError}</Text>
          ) : null}

          <TouchableOpacity
            testID="report-preview-save-handoff"
            style={[styles.submitButton, isHandoffDisabled && styles.submitButtonDisabled]}
            onPress={handleSaveHandoff}
            disabled={isHandoffDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {isSavingHandoff ? t('reportPreview.handoffSaving') : t('reportPreview.handoffConfirmButton')}
            </Text>
          </TouchableOpacity>

          {savedHandoffAt && (
            <View testID="report-preview-handoff-saved-state" style={styles.savedStateCard}>
              <Text style={styles.savedStateTitle}>{t('reportPreview.handoffSavedTitle')}</Text>
              <Text style={styles.savedStateBody}>{t('reportPreview.handoffSavedBody')}</Text>
              {selectedHandoffMethodLabel ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.handoffMethodLabel')}: {selectedHandoffMethodLabel}</Text>
              ) : null}
              {handoffDateLabel ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.handoffPreparedAt')}: {handoffDateLabel}</Text>
              ) : null}
              <Text style={styles.helperText}>{t('reportPreview.handoffNextStepsTitle')}</Text>
              <Text style={styles.listItem}>• {t('reportPreview.handoffNextStepReview')}</Text>
              <Text style={styles.listItem}>• {t('reportPreview.handoffNextStepDeliver')}</Text>
              <Text style={styles.listItem}>• {t('reportPreview.handoffNextStepManual')}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.exportTitle')}</Text>
          <Text style={styles.reviewIntro}>{t('reportPreview.exportSubtitle')}</Text>

          {!savedExportAt && (
            <Text style={styles.helperText}>
              {!preview.onboarding
                ? t('reportPreview.missingProfileNote')
                : preview.hadPartialFailure
                  ? t('reportPreview.exportPartialDataNote')
                  : !hasPreparedHandoff
                    ? t('reportPreview.exportNeedsHandoffNote')
                    : t('reportPreview.exportLocalOnlyNote')}
            </Text>
          )}

          {exportError ? (
            <Text testID="report-preview-export-save-error" style={styles.errorText}>{exportError}</Text>
          ) : null}

          <TouchableOpacity
            testID="report-preview-generate-export"
            style={[styles.submitButton, isExportDisabled && styles.submitButtonDisabled]}
            onPress={handleGenerateExport}
            disabled={isExportDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {isExportingDraft
                ? t('reportPreview.exporting')
                : hasGeneratedExport
                  ? t('reportPreview.exportRegenerateButton')
                  : t('reportPreview.exportButton')}
            </Text>
          </TouchableOpacity>

          {savedExportAt && (
            <View testID="report-preview-export-saved-state" style={styles.savedStateCard}>
              <Text style={styles.savedStateTitle}>{t('reportPreview.exportSavedTitle')}</Text>
              <Text style={styles.savedStateBody}>{t('reportPreview.exportSavedBody')}</Text>
              {exportedFileName ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.exportFileLabel')}: {exportedFileName}</Text>
              ) : null}
              {exportDateLabel ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.exportGeneratedAt')}: {exportDateLabel}</Text>
              ) : null}
              {exportUri ? <Text style={styles.exportPathText}>{exportUri}</Text> : null}
            </View>
          )}

          {exportHistoryItems.length > 0 && (
            <View testID="report-preview-export-history" style={styles.historyCard}>
              <Text style={styles.savedStateTitle}>{t('reportPreview.exportHistoryTitle')}</Text>
              <Text style={styles.helperText}>{t('reportPreview.exportHistorySubtitle')}</Text>
              {historyCleanupError ? (
                <Text testID="report-preview-export-history-error" style={styles.errorText}>{historyCleanupError}</Text>
              ) : null}
              {latestExportHistoryItem ? (
                <View testID="report-preview-export-history-current-group" style={styles.historyGroup}>
                  <Text style={styles.historyGroupTitle}>{t('reportPreview.exportHistoryCurrentTitle')}</Text>
                  {renderExportHistoryItem(latestExportHistoryItem, 0)}
                </View>
              ) : null}
              {previousExportHistoryItems.length > 0 ? (
                <View testID="report-preview-export-history-previous-group" style={styles.historyGroup}>
                  <Text style={styles.historyGroupTitle}>{t('reportPreview.exportHistoryPreviousTitle')}</Text>
                  {previousExportHistoryItems.map((record, index) => renderExportHistoryItem(record, index + 1))}
                  <TouchableOpacity
                    testID="report-preview-export-history-clear-older"
                    style={[styles.historyCleanupButton, !canClearOlderExports && styles.historyActionButtonDisabled]}
                    onPress={handleClearOlderExports}
                    disabled={!canClearOlderExports}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.historyCleanupButtonText}>
                      {isCleaningHistory
                        ? t('reportPreview.exportHistoryClearing')
                        : t('reportPreview.exportHistoryClearOlderButton')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {selectedHistoryRecord ? (
                <View testID="report-preview-export-history-detail" style={styles.savedStateCard}>
                  <Text style={styles.savedStateTitle}>{t('reportPreview.exportHistoryDetailTitle')}</Text>
                  <Text style={styles.savedStateBody}>{t('reportPreview.exportHistoryDetailBody')}</Text>
                  <Text style={styles.savedStateMeta}>
                    {t('reportPreview.exportHistoryDetailStatusLabel')}: {isSelectedHistoryLatest
                      ? t('reportPreview.exportHistoryDetailStatusCurrent')
                      : t('reportPreview.exportHistoryDetailStatusPrevious')}
                  </Text>
                  {selectedHistoryFileName ? (
                    <Text style={styles.savedStateMeta}>{t('reportPreview.exportFileLabel')}: {selectedHistoryFileName}</Text>
                  ) : null}
                  {selectedHistoryDateLabel ? (
                    <Text style={styles.savedStateMeta}>{t('reportPreview.exportGeneratedAt')}: {selectedHistoryDateLabel}</Text>
                  ) : null}
                  <Text style={styles.exportPathText}>{selectedHistoryRecord.fileUri}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reportPreview.shareTitle')}</Text>
          <Text style={styles.reviewIntro}>{t('reportPreview.shareSubtitle')}</Text>

          {!hasOpenedShareSheet && (
            <Text style={styles.helperText}>
              {!preview.onboarding
                ? t('reportPreview.missingProfileNote')
                : preview.hadPartialFailure
                  ? t('reportPreview.exportPartialDataNote')
                  : !hasGeneratedExport
                    ? t('reportPreview.shareNeedsExportNote')
                    : t('reportPreview.shareLocalOnlyNote')}
            </Text>
          )}

          {shareError ? (
            <Text testID="report-preview-share-error" style={styles.errorText}>{shareError}</Text>
          ) : null}

          <TouchableOpacity
            testID="report-preview-share-export"
            style={[styles.submitButton, isShareDisabled && styles.submitButtonDisabled]}
            onPress={handleShareExport}
            disabled={isShareDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {isOpeningShare ? t('reportPreview.shareOpening') : t('reportPreview.shareButton')}
            </Text>
          </TouchableOpacity>

          {hasOpenedShareSheet && (
            <View testID="report-preview-share-opened-state" style={styles.savedStateCard}>
              <Text style={styles.savedStateTitle}>{t('reportPreview.shareOpenedTitle')}</Text>
              <Text style={styles.savedStateBody}>{t('reportPreview.shareOpenedBody')}</Text>
              {sharedExportFileName ? (
                <Text style={styles.savedStateMeta}>{t('reportPreview.exportFileLabel')}: {sharedExportFileName}</Text>
              ) : null}
              <Text style={styles.savedStateMeta}>{t('reportPreview.shareManualNote')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase, padding: 24 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 15 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.accentWarmPale, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: colors.accentWarm, fontWeight: '700', fontSize: 12 },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.small,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },
  detailLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  metaText: { fontSize: 14, color: colors.textSecondary },
  windowText: { fontSize: 14, color: colors.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    backgroundColor: colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  statLabel: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  noteCard: { backgroundColor: colors.bgBase, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.borderSubtle },
  noteText: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  listItem: { fontSize: 14, lineHeight: 22, color: colors.textPrimary },
  consentCard: { backgroundColor: colors.accentBlue },
  consentBody: { fontSize: 14, lineHeight: 22, color: colors.textPrimary },
  reviewIntro: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  draftMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  draftMetaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  draftStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  draftStatusBadgeReady: {
    backgroundColor: colors.primaryPale,
  },
  draftStatusBadgePending: {
    backgroundColor: colors.accentWarmPale,
  },
  draftStatusBadgePartial: {
    backgroundColor: colors.accentBlue,
  },
  draftStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  draftSurface: {
    backgroundColor: colors.bgBase,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  draftText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  handoffMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  handoffMethodChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  handoffMethodChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  handoffMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  handoffMethodTextSelected: {
    color: colors.bgSurface,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  reviewRowActive: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primaryLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: colors.bgSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.small,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    color: colors.bgSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  savedStateCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  savedStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  savedStateBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  savedStateMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  historyCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  historyGroup: {
    gap: 10,
  },
  historyGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  historyItem: {
    gap: 4,
  },
  historyActionButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryPale,
  },
  historyActionButtonDisabled: {
    opacity: 0.6,
  },
  historyActionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  historyDetailButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  historyDetailButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  historyDetailButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyDetailButtonTextSelected: {
    color: colors.primary,
  },
  historyCleanupButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accentWarmPale,
  },
  historyCleanupButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentWarm,
  },
  historyRemoveButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bgBase,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  historyRemoveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  exportPathText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  noticeCard: { backgroundColor: colors.accentWarmPale, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.borderSubtle },
  noticeText: { color: colors.primaryDark, fontSize: 14, lineHeight: 20 },
});