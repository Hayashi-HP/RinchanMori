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

function auditLogCategory(action, status) {
  const key = String(action || '');
  if (String(status || '').toLowerCase() !== 'ok') return 'error';
  if (/login/i.test(key)) return 'access';
  if (/(save|update|delete|publish|unpublish)/i.test(key) || ['createBackup', 'clearCache'].indexOf(key) >= 0) return 'change';
  return 'view';
}

function getRecentAuditLogs(ss, options) {
  const sheet = ss.getSheetByName(SHEET_AUDIT_LOGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = typeof options === 'object' && options ? options : { limit:options };
  const requestedLimit = Number(data.limit || 100);
  const max = Math.max(1, Math.min(isFinite(requestedLimit) ? requestedLimit : 100, 300));
  const category = String(data.category || '').trim();
  const status = String(data.status || '').trim().toLowerCase();
  const query = String(data.query || '').trim().toLowerCase();
  const lastRow = sheet.getLastRow();
  const startRow = Math.max(2, lastRow - 999);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 12).getValues();

  return values.reverse().map(row => {
    const item = {
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
    };
    item.category = auditLogCategory(item.action, item.status);
    return item;
  }).filter(item => {
    if (category && item.category !== category) return false;
    if (status && String(item.status || '').toLowerCase() !== status) return false;
    if (query) {
      const haystack = [item.actorEmployeeId, item.actorName, item.actorDept, item.action, item.targetType, item.targetId, item.message].join(' ').toLowerCase();
      if (haystack.indexOf(query) < 0) return false;
    }
    return true;
  }).slice(0, max);
}
