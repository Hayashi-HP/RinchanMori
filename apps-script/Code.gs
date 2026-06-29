const SHEET_USERS = 'users';
const SHEET_ACTIVITIES = 'activities';
const SHEET_LOGS = 'logs';
const VERSION = 'v0.3.0';

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets(ss);
  if (action === 'dashboard') {
    return jsonOutput({ ok: true, action: action, data: getDashboard(ss), version: VERSION });
  }
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

    if (action === 'dashboard') {
      return jsonOutput({ ok: true, action: action, data: getDashboard(ss), version: VERSION });
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

function getDashboard(ss) {
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const byUser = {};

  users.forEach(user => {
    const id = user.id || '';
    if (!id) return;
    byUser[id] = {
      id: id,
      name: maskName(user.name || ''),
      nick: user.nick || '',
      dept: user.dept || '',
      declaration: user.declaration || '',
      weeklyGoal: user.weeklyGoal || '',
      activityCount: 0,
      totalSteps: 0,
      lastDate: ''
    };
  });

  activities.forEach(item => {
    const id = item.participantId || '';
    if (!id) return;
    if (!byUser[id]) {
      byUser[id] = { id: id, name: 'ゲスト', nick: '', dept: '', declaration: '', weeklyGoal: '', activityCount: 0, totalSteps: 0, lastDate: '' };
    }
    byUser[id].activityCount += 1;
    byUser[id].totalSteps += Number(item.steps || 0);
    if (!byUser[id].lastDate || String(item.date || '') > byUser[id].lastDate) byUser[id].lastDate = String(item.date || '');
  });

  const members = Object.keys(byUser).map(id => byUser[id]);
  const ranking = members.slice().sort((a, b) => {
    if (b.totalSteps !== a.totalSteps) return b.totalSteps - a.totalSteps;
    return b.activityCount - a.activityCount;
  }).slice(0, 20);

  return {
    generatedAt: new Date().toISOString(),
    totalUsers: members.length,
    totalActivities: activities.length,
    totalSteps: activities.reduce((sum, item) => sum + Number(item.steps || 0), 0),
    members: members,
    ranking: ranking
  };
}

function readTable(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function maskName(name) {
  const text = String(name || '').trim();
  if (!text) return 'ゲスト';
  if (text.length <= 2) return text;
  return text.slice(0, 1) + '＊' + text.slice(-1);
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
