const SHEET_USERS = 'users';
const SHEET_ACTIVITIES = 'activities';
const SHEET_LOGS = 'logs';
const VERSION = 'v0.2.2';

function doGet(e) {
  return jsonOutput({ ok: true, app: 'RinchanMori', version: VERSION, message: 'Apps Script is running.' });
}

function doPost(e) {
  try {
    const data = parseRequest(e);
    const action = String(data.action || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);

    if (action === 'setup') {
      return jsonOutput({ ok: true, action: action, version: VERSION });
    }

    if (action === 'saveUser') {
      const saved = saveUser(ss, data);
      writeLog(ss, action, data.deviceId, data.participantId || data.id, 'ok', '');
      return jsonOutput({ ok: true, action: action, saved: saved, version: VERSION });
    }

    if (action === 'saveActivity') {
      const saved = saveActivity(ss, data);
      writeLog(ss, action, data.deviceId, data.participantId || data.id, 'ok', '');
      return jsonOutput({ ok: true, action: action, saved: saved, version: VERSION });
    }

    writeLog(ss, action || 'unknown', data.deviceId, data.participantId || data.id, 'ng', 'unknown_action');
    return jsonOutput({ ok: false, error: 'unknown_action', version: VERSION });
  } catch (err) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      setupSheets(ss);
      writeLog(ss, 'error', '', '', 'ng', err.message);
    } catch (ignore) {}
    return jsonOutput({ ok: false, error: err.message, version: VERSION });
  }
}

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheets(ss) {
  ensureSheet(ss, SHEET_USERS, [
    'id', 'deviceId', 'name', 'dept', 'nick', 'declaration', 'weeklyGoal',
    'createdAt', 'updatedAt', 'version', 'lastSavedAt'
  ]);
  ensureSheet(ss, SHEET_ACTIVITIES, [
    'activityId', 'participantId', 'deviceId', 'date', 'steps', 'challenge',
    'comment', 'createdAt', 'version', 'savedAt'
  ]);
  ensureSheet(ss, SHEET_LOGS, [
    'loggedAt', 'action', 'deviceId', 'participantId', 'status', 'message'
  ]);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const current = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
  let changed = false;
  headers.forEach((h, i) => {
    if (current[i] !== h) {
      sheet.getRange(1, i + 1).setValue(h);
      changed = true;
    }
  });
  if (changed || sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function saveUser(ss, data) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  const id = String(data.id || data.participantId || '').trim();
  if (!id) throw new Error('user_id_required');

  const row = findRowByValue(sheet, 1, id);
  const values = [
    id,
    data.deviceId || '',
    data.name || '',
    data.dept || '',
    data.nick || '',
    data.declaration || '',
    data.weeklyGoal || '',
    data.createdAt || '',
    data.updatedAt || '',
    data.version || data.appVersion || '',
    new Date().toISOString()
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row: row, id: id };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), id: id };
}

function saveActivity(ss, data) {
  const sheet = ss.getSheetByName(SHEET_ACTIVITIES);
  const activityId = String(data.activityId || '').trim();
  if (!activityId) throw new Error('activity_id_required');

  const row = findRowByValue(sheet, 1, activityId);
  const values = [
    activityId,
    data.participantId || data.id || '',
    data.deviceId || '',
    data.date || '',
    Number(data.steps || 0),
    data.challenge === true || data.challenge === 'true',
    data.comment || '',
    data.createdAt || '',
    data.version || data.appVersion || '',
    new Date().toISOString()
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row: row, activityId: activityId };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), activityId: activityId };
}

function findRowByValue(sheet, col, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(value)) return i + 2;
  }
  return -1;
}

function writeLog(ss, action, deviceId, participantId, status, message) {
  const sheet = ss.getSheetByName(SHEET_LOGS);
  sheet.appendRow([
    new Date().toISOString(),
    action || '',
    deviceId || '',
    participantId || '',
    status || '',
    message || ''
  ]);
}
