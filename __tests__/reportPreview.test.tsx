import React from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import ReportPreviewScreen from '../src/screens/ReportPreviewScreen';
import { getGardenPlants, getJournalEntries, getOnboardingData, saveOnboardingData } from '../src/modules/storage';

jest.mock('../src/modules/storage');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ReportPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
  });

  test('renders weekly summary data from onboarding, journal, and garden activity', async () => {
    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'stress',
      budget: 'under10',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
        hospitalName: 'GreenHeal Clinic',
        clinicianName: 'Dr. Sami',
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Lavender',
        careDifficulty: 'easy',
        wateringFrequencyDays: 4,
        nextWateringAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
        wateringReminderEnabled: true,
      },
    ]);
    (getJournalEntries as jest.Mock).mockResolvedValue([
      {
        id: 1,
        moodScore: 4,
        notes: 'I felt calmer after watering the plants.',
        createdAt: new Date().toISOString(),
      },
    ]);

    const { getByText, getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      const draftText = getByTestId('report-preview-draft-text').props.children as string;

      expect(getByTestId('report-preview-screen')).toBeTruthy();
      expect(getByText('Amina')).toBeTruthy();
      expect(getByText('Dr. Sami • GreenHeal Clinic')).toBeTruthy();
      expect(getByTestId('report-preview-stat-entries').props.children).toBe(1);
      expect(getByTestId('report-preview-stat-mood').props.children).toBe('4.0');
      expect(getByTestId('report-preview-note-0')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusPending');
      expect(draftText).toContain('Amina');
      expect(draftText).toContain('Dr. Sami • GreenHeal Clinic');
      expect(draftText).toContain('reportPreview.handoffStatusPending');
      expect(draftText).toContain('I felt calmer after watering the plants.');
    });
  });

  test('saves review confirmation after both consent items are checked', async () => {
    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'stress',
      budget: 'under10',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-review-summary-toggle'));
    fireEvent.press(getByTestId('report-preview-review-consent-toggle'));
    fireEvent.press(getByTestId('report-preview-save-consent'));

    await waitFor(() => {
      expect(saveOnboardingData).toHaveBeenCalledWith(
        expect.objectContaining({
          reportSharing: expect.objectContaining({
            readyForFutureSharing: true,
          }),
        })
      );
      expect(getByTestId('report-preview-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusReady');
    });
  });

  test('restores saved review confirmation from onboarding data', async () => {
    const reviewedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusReady');
    });
  });

  test('saves a local handoff plan after review is ready', async () => {
    const reviewedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'stress',
      budget: 'under10',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-handoff-method-care_team_email'));
    fireEvent.press(getByTestId('report-preview-save-handoff'));

    await waitFor(() => {
      expect(saveOnboardingData).toHaveBeenCalledWith(
        expect.objectContaining({
          reportSharing: expect.objectContaining({
            handoffMethod: 'care_team_email',
            handoffPreparedAt: expect.any(String),
          }),
        })
      );
      expect(getByTestId('report-preview-handoff-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusPrepared');
    });
  });

  test('restores a saved local handoff plan from onboarding data', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-handoff-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusPrepared');
    });
  });

  test('generates a local export file after handoff is prepared', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'stress',
      budget: 'under10',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'care_team_email',
        handoffPreparedAt,
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-screen')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-generate-export'));

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('file:///mock/documents/greenheal/reports/weekly-report-amina-'),
        expect.stringContaining('reportPreview.artifactTitle')
      );
      expect(saveOnboardingData).toHaveBeenCalledWith(
        expect.objectContaining({
          reportSharing: expect.objectContaining({
            exportGeneratedAt: expect.any(String),
            exportFileUri: expect.stringContaining('weekly-report-amina-'),
            exportHistory: [
              expect.objectContaining({
                generatedAt: expect.any(String),
                fileUri: expect.stringContaining('weekly-report-amina-'),
              }),
            ],
          }),
        })
      );
      expect(getByTestId('report-preview-export-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusExported');
    });
  });

  test('restores a generated local export from onboarding data', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const exportGeneratedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-saved-state')).toBeTruthy();
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusExported');
    });
  });

  test('keeps earlier local exports when generating a replacement export', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const exportGeneratedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'stress',
      budget: 'under10',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'care_team_email',
        handoffPreparedAt,
        exportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-saved-state')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-generate-export'));

    await waitFor(() => {
      const savedPayload = (saveOnboardingData as jest.Mock).mock.calls.at(-1)?.[0];

      expect(savedPayload.reportSharing.exportHistory).toHaveLength(2);
      expect(savedPayload.reportSharing.exportHistory[0]).toEqual({
        generatedAt: exportGeneratedAt,
        fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
      });
      expect(savedPayload.reportSharing.exportHistory[1]).toEqual(
        expect.objectContaining({
          generatedAt: expect.any(String),
          fileUri: expect.stringContaining('weekly-report-amina-'),
        })
      );
    });
  });

  test('groups local export history into current and previous sections', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const currentExportGeneratedAt = new Date().toISOString();
    const previousExportGeneratedAt = new Date(Date.now() - 86400000).toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt: currentExportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        exportHistory: [
          {
            generatedAt: previousExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
          },
          {
            generatedAt: currentExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
          },
        ],
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(getByTestId('report-preview-export-history-current-group')).toBeTruthy();
      expect(getByTestId('report-preview-export-history-previous-group')).toBeTruthy();
      expect(within(getByTestId('report-preview-export-history-current-group')).getByTestId(
        'report-preview-export-history-item-0'
      )).toBeTruthy();
      expect(within(getByTestId('report-preview-export-history-current-group')).getByText(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt'
      )).toBeTruthy();
      expect(within(getByTestId('report-preview-export-history-previous-group')).getByTestId(
        'report-preview-export-history-item-1'
      )).toBeTruthy();
      expect(within(getByTestId('report-preview-export-history-previous-group')).getByText(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt'
      )).toBeTruthy();
    });
  });

  test('opens native file sharing for a previous export history item', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const currentExportGeneratedAt = new Date().toISOString();
    const previousExportGeneratedAt = new Date(Date.now() - 86400000).toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt: currentExportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        exportHistory: [
          {
            generatedAt: previousExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
          },
          {
            generatedAt: currentExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
          },
        ],
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-export-history-share-1'));

    await waitFor(() => {
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
        expect.objectContaining({
          dialogTitle: 'reportPreview.shareSheetTitle',
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
        })
      );
      expect(getByTestId('report-preview-share-opened-state')).toBeTruthy();
      expect(within(getByTestId('report-preview-share-opened-state')).getByText(/weekly-report-amina-123\.txt/)).toBeTruthy();
    });
  });

  test('clears older export history entries while keeping the latest export', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const currentExportGeneratedAt = new Date().toISOString();
    const previousExportGeneratedAt = new Date(Date.now() - 86400000).toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt: currentExportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        exportHistory: [
          {
            generatedAt: previousExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
          },
          {
            generatedAt: currentExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
          },
        ],
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, queryByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(getByTestId('report-preview-export-history-clear-older')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-export-history-clear-older'));

    await waitFor(() => {
      const savedPayload = (saveOnboardingData as jest.Mock).mock.calls.at(-1)?.[0];

      expect(savedPayload.reportSharing.exportGeneratedAt).toBe(currentExportGeneratedAt);
      expect(savedPayload.reportSharing.exportFileUri).toBe(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt'
      );
      expect(savedPayload.reportSharing.exportHistory).toEqual([
        {
          generatedAt: currentExportGeneratedAt,
          fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        },
      ]);
      expect(within(getByTestId('report-preview-export-history-item-0')).getByText(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt'
      )).toBeTruthy();
      expect(getByTestId('report-preview-export-history-current-group')).toBeTruthy();
      expect(queryByTestId('report-preview-export-history-previous-group')).toBeNull();
      expect(queryByTestId('report-preview-export-history-item-1')).toBeNull();
      expect(queryByTestId('report-preview-export-history-clear-older')).toBeNull();
    });
  });

  test('removes one selected older export history entry while keeping the latest export', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const currentExportGeneratedAt = new Date().toISOString();
    const middleExportGeneratedAt = new Date(Date.now() - 86400000).toISOString();
    const oldestExportGeneratedAt = new Date(Date.now() - 172800000).toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt: currentExportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        exportHistory: [
          {
            generatedAt: oldestExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
          },
          {
            generatedAt: middleExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-234.txt',
          },
          {
            generatedAt: currentExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
          },
        ],
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);
    (saveOnboardingData as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, queryByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(queryByTestId('report-preview-export-history-remove-0')).toBeNull();
      expect(getByTestId('report-preview-export-history-remove-1')).toBeTruthy();
      expect(getByTestId('report-preview-export-history-remove-2')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-export-history-remove-1'));

    await waitFor(() => {
      const savedPayload = (saveOnboardingData as jest.Mock).mock.calls.at(-1)?.[0];

      expect(savedPayload.reportSharing.exportGeneratedAt).toBe(currentExportGeneratedAt);
      expect(savedPayload.reportSharing.exportFileUri).toBe(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt'
      );
      expect(savedPayload.reportSharing.exportHistory).toEqual([
        {
          generatedAt: oldestExportGeneratedAt,
          fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
        },
        {
          generatedAt: currentExportGeneratedAt,
          fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        },
      ]);
      expect(within(getByTestId('report-preview-export-history-item-0')).getByText(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt'
      )).toBeTruthy();
      expect(within(getByTestId('report-preview-export-history-item-1')).getByText(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt'
      )).toBeTruthy();
      expect(queryByTestId('report-preview-export-history-item-2')).toBeNull();
      expect(queryByTestId('report-preview-export-history-remove-0')).toBeNull();
      expect(getByTestId('report-preview-export-history-remove-1')).toBeTruthy();
    });
  });

  test('shows a detail card for a selected previous export history entry', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const currentExportGeneratedAt = new Date().toISOString();
    const previousExportGeneratedAt = new Date(Date.now() - 86400000).toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt: currentExportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
        exportHistory: [
          {
            generatedAt: previousExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
          },
          {
            generatedAt: currentExportGeneratedAt,
            fileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-456.txt',
          },
        ],
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId, queryByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-history')).toBeTruthy();
      expect(queryByTestId('report-preview-export-history-detail')).toBeNull();
    });

    fireEvent.press(getByTestId('report-preview-export-history-detail-1'));

    await waitFor(() => {
      const detailCard = getByTestId('report-preview-export-history-detail');

      expect(detailCard).toBeTruthy();
      expect(within(detailCard).getByText('file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt')).toBeTruthy();
      expect(within(detailCard).getByText(/reportPreview\.exportHistoryDetailStatusPrevious/)).toBeTruthy();
    });
  });

  test('opens native file sharing for a generated local export', async () => {
    const reviewedAt = new Date().toISOString();
    const handoffPreparedAt = new Date().toISOString();
    const exportGeneratedAt = new Date().toISOString();

    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
      reportProfile: {
        fullName: 'Amina Rahal',
        preferredName: 'Amina',
        hospitalName: 'GreenHeal Clinic',
        clinicianName: 'Dr. Sami',
      },
      reportSharing: {
        readyForFutureSharing: true,
        reviewedAt,
        consentConfirmedAt: reviewedAt,
        handoffMethod: 'hospital_portal',
        handoffPreparedAt,
        exportGeneratedAt,
        exportFileUri: 'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
      },
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-export-saved-state')).toBeTruthy();
    });

    fireEvent.press(getByTestId('report-preview-share-export'));

    await waitFor(() => {
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///mock/documents/greenheal/reports/weekly-report-amina-123.txt',
        expect.objectContaining({
          dialogTitle: 'reportPreview.shareSheetTitle',
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
        })
      );
      expect(getByTestId('report-preview-share-opened-state')).toBeTruthy();
    });
  });

  test('shows partial-data notice and empty reflections fallback when journal loading fails', async () => {
    (getOnboardingData as jest.Mock).mockResolvedValue({
      healingGoal: 'wellness',
      budget: 'have_plants',
      completedAt: new Date().toISOString(),
    });
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getJournalEntries as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

    const { getByTestId } = render(<ReportPreviewScreen />);

    await waitFor(() => {
      expect(getByTestId('report-preview-partial-data')).toBeTruthy();
      expect(getByTestId('report-preview-no-reflections')).toBeTruthy();
      expect(getByTestId('report-preview-draft-status').props.children).toBe('reportPreview.artifactStatusPartial');
    });
  });
});