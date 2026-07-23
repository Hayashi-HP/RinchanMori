/* Client error log collection */

function saveErrorLog(ss, data) {
  const sheet = ensureSheet(ss, SHEET_ERROR_LOGS, [
    'loggedAt', 'receivedAt', 'employeeId', 'deviceId', 'page', 'type',
    'message', 'source', 'line', 'column', 'stack', 'url', 'userAgent', 'clientVersion'
  ]);

  const log = data.log || data.error || data;
  const now = new Date().toISOString();
  const employeeId = String(log.employeeId || data.employeeId || data.id || data.participantId || '');
  const deviceId = String(log.deviceId || data.deviceId || '');

  sheet.appendRow([
    String(log.at || log.loggedAt || ''),
    now,
    employeeId,
    deviceId,
    String(log.page || ''),
    String(log.type || ''),
    String(log.message || '').slice(0, 500),
    String(log.source || '').slice(0, 500),
    String(log.line || ''),
    String(log.column || ''),
    String(log.stack || '').slice(0, 3000),
    String(log.url || '').slice(0, 500),
    String(log.userAgent || '').slice(0, 500),
    String(log.version || data.clientVersion || '')
  ]);

  return { saved: true, receivedAt: now };
}

function getRecentErrorLogs(ss, options) {
  const sheet = ss.getSheetByName(SHEET_ERROR_LOGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = typeof options === 'object' && options ? options : { limit:options };
  const requestedLimit = Number(data.limit || 100);
  const max = Math.max(1, Math.min(isFinite(requestedLimit) ? requestedLimit : 100, 300));
  const type = String(data.type || '').trim().toLowerCase();
  const page = String(data.page || '').trim().toLowerCase();
  const query = String(data.query || '').trim().toLowerCase();
  const lastRow = sheet.getLastRow();
  const startRow = Math.max(2, lastRow - 999);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 14).getValues();

  return values.reverse().map(row => ({
      loggedAt: row[0],
      receivedAt: row[1],
      employeeId: row[2],
      deviceId: row[3],
      page: row[4],
      type: row[5],
      message: row[6],
      source: row[7],
      line: row[8],
      column: row[9],
      stack: row[10],
      url: row[11],
      userAgent: row[12],
      clientVersion: row[13]
    })).filter(item => {
      const itemType = String(item.type || '').toLowerCase();
      const itemPage = String(item.page || '').toLowerCase();
      const message = String(item.message || '').trim();
      const hasLocation = !!String(item.source || item.line || item.column || item.stack || '').trim();
      if (message === 'Script error.' && !hasLocation) return false;
      if (type && itemType !== type) return false;
      if (page && itemPage.indexOf(page) < 0) return false;
      if (query) {
        const haystack = [item.employeeId, item.deviceId, item.page, item.type, item.message, item.source, item.stack, item.clientVersion].join(' ').toLowerCase();
        if (haystack.indexOf(query) < 0) return false;
      }
      return true;
    }).slice(0, max);
}
