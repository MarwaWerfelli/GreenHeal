import * as FileSystem from 'expo-file-system';

const REPORT_EXPORT_DIRECTORY = 'greenheal/reports/';

function getReportExportDirectoryPath(): string {
  const baseDirectory = FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('Document directory not available');
  }

  return `${baseDirectory}${REPORT_EXPORT_DIRECTORY}`;
}

function sanitizeFileSegment(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || 'weekly-report';
}

export async function exportReportDraftToFile(reportText: string, patientName: string): Promise<string> {
  const directoryPath = getReportExportDirectoryPath();
  const directoryInfo = await FileSystem.getInfoAsync(directoryPath);

  if (!directoryInfo?.exists) {
    await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
  }

  const fileName = `weekly-report-${sanitizeFileSegment(patientName)}-${Date.now()}.txt`;
  const fileUri = `${directoryPath}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, reportText);

  return fileUri;
}