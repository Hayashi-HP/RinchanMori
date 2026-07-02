/* Backup log helpers */

const BACKUP_SOURCE_SHEETS = [
  SHEET_USERS,
  SHEET_ACTIVITIES,
  SHEET_THANKS,
  SHEET_LOGS,
  SHEET_ERROR_LOGS,
  SHEET_AUDIT_LOGS,
  SHEET_DEPARTMENTS,
  SHEET_USER_READS
];

function writeBackupLog(ss, record, data) {
  const sheet = ensureSheet(ss, SHEET_BACKUP_LOGS, [
    'createdAt', 'label', 'actorEmployeeId', 'copiedCount', 'sourceCount', 'ok', 'detailJson', 'version'
  ]);
  sheet.appendRow([
    record.finishedAt || new Date().toISOString(),
    record.label || '',
    data.employeeId || data.id || data.participantId || '',
    record.copiedCount || 0,
    record.sourceCount || 0,
    record.ok ? '1' : '0',
    JSON.stringify(record).slice(0, 5000),
    VERSION
  ]);
}

function getRecentBackups(ss, limit) {
  const sheet = ss.getSheetByName(SHEET_BACKUP_LOGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const max = Math.max(1, Math.min(Number(limit || 50), 200));
  const lastRow = sheet.getLastRow();
  const startRow = Math.max(2, lastRow - max + 1);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();

  return values.reverse().map(row => ({
    createdAt: row[0],
    label: row[1],
    actorEmployeeId: row[2],
    copiedCount: row[3],
    sourceCount: row[4],
    ok: String(row[5]) === '1',
    detailJson: row[6],
    version: row[7]
  }));
}
