/* Audit log helpers */

function writeAuditLog(ss, data) {
  const sheet = ensureSheet(ss, SHEET_AUDIT_LOGS, [
    'loggedAt', 'actorEmployeeId', 'actorName', 'actorDept', 'actorRole',
    'action', 'targetType', 'targetId', 'status', 'message', 'detailJson', 'version'
  ]);

  const actor = getUserPermissionContext(ss, data || {}) || {};
  const detail = data && data.detail ? data.detail : {};

  sheet.appendRow([
    new Date().toISOString(),
    actor.employeeId || data.employeeId || data.id || data.participantId || '',
    actor.name || '',
    actor.dept || '',
    actor.role || '',
    String(data.action || ''),
    String(data.targetType || ''),
    String(data.targetId || ''),
    String(data.status || 'ok'),
    String(data.message || '').slice(0, 500),
    JSON.stringify(detail).slice(0, 3000),
    VERSION
  ]);

  return true;
}

function auditAction(ss, action, data, status, message, detail) {
  try {
    return writeAuditLog(ss, Object.assign({}, data || {}, {
      action,
      status: status || 'ok',
      message: message || '',
      detail: detail || {}
    }));
  } catch (e) {
    try {
      writeLog(ss, 'audit_error', data && data.deviceId, data && (data.employeeId || data.id || data.participantId), 'ng', e.message);
    } catch (ignore) {}
    return false;
  }
}

function getRecentAuditLogs(ss, limit) {
  const sheet = ss.getSheetByName(SHEET_AUDIT_LOGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const max = Math.max(1, Math.min(Number(limit || 100), 300));
  const lastRow = sheet.getLastRow();
  const startRow = Math.max(2, lastRow - max + 1);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 12).getValues();

  return values.reverse().map(row => ({
    loggedAt: row[0],
    actorEmployeeId: row[1],
    actorName: row[2],
    actorDept: row[3],
    actorRole: row[4],
    action: row[5],
    targetType: row[6],
    targetId: row[7],
    status: row[8],
    message: row[9],
    detailJson: row[10],
    version: row[11]
  }));
}
