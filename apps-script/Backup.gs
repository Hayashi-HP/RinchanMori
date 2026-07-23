/* Backup helpers */

function getBackupSourceSheets() {
  return [
    SHEET_USERS,
    SHEET_ACTIVITIES,
    SHEET_THANKS,
    SHEET_LOGS,
    SHEET_ERROR_LOGS,
    SHEET_AUDIT_LOGS,
    SHEET_DEPARTMENTS,
    SHEET_CHALLENGES,
    SHEET_BADGES,
    SHEET_USER_READS
  ];
}

function sanitizeBackupLabel(label) {
  return String(label || 'manual').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'manual';
}

function makeBackupName(sourceName, label) {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  return 'bk_' + date + '_' + sanitizeBackupLabel(label) + '_' + sourceName;
}

function backupSheet(ss, sourceName, label) {
  const source = ss.getSheetByName(sourceName);
  if (!source) return { sourceName, copied: false, reason: 'not_found' };

  const copied = source.copyTo(ss);
  copied.setName(makeBackupName(sourceName, label));
  copied.hideSheet();

  return {
    sourceName,
    backupName: copied.getName(),
    copied: true,
    rows: source.getLastRow(),
    columns: source.getLastColumn()
  };
}

function createBackup(ss, data) {
  const label = sanitizeBackupLabel(data && data.label);
  const startedAt = new Date().toISOString();
  const sourceSheets = getBackupSourceSheets();
  const results = sourceSheets.map(name => backupSheet(ss, name, label));
  const copiedCount = results.filter(item => item.copied).length;

  const record = {
    ok: copiedCount > 0,
    label,
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceCount: sourceSheets.length,
    copiedCount,
    results
  };

  writeBackupLog(ss, record, data || {});
  return record;
}

function createDailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupProject(ss);
  return createBackup(ss, { label: 'daily' });
}

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
