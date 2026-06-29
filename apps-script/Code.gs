const SHEET_USERS = 'users';
const SHEET_ACTIVITIES = 'activities';
const SHEET_LOGS = 'logs';
const VERSION = 'v0.5.1';

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets(ss);
  if (action === 'dashboard') return jsonOutput({ ok: true, action: action, data: getDashboard(ss), version: VERSION });
  if (action === 'adminStats') return jsonOutput({ ok: true, action: action, data: getAdminStats(ss), version: VERSION });
  return jsonOutput({ ok: true, app: 'RinchanMori', version: VERSION, message: 'Apps Script is running.' });
}

function doPost(e) {
  try {
    const data = parseRequest(e);
    const action = String(data.action || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);

    if (action === 'setup') return jsonOutput({ ok: true, action: action, version: VERSION });
    if (action === 'dashboard') return jsonOutput({ ok: true, action: action, data: getDashboard(ss), version: VERSION });
    if (action === 'adminStats') return jsonOutput({ ok: true, action: action, data: getAdminStats(ss), version: VERSION });

    if (action === 'saveUser') {
      const saved = saveUser(ss, data);
      writeLog(ss, action, data.deviceId, saved.user.id, 'ok', '');
      return jsonOutput({ ok: true, action: action, saved: saved, user: saved.user, version: VERSION });
    }

    if (action === 'loginUser') {
      const user = loginUser(ss, data);
      writeLog(ss, action, data.deviceId, user ? user.id : '', user ? 'ok' : 'ng', user ? '' : 'login_failed');
      if (!user) return jsonOutput({ ok: false, error: 'login_failed', version: VERSION });
      return jsonOutput({ ok: true, action: action, user: user, version: VERSION });
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
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function setupSheets(ss) {
  ensureSheet(ss, SHEET_USERS, ['id', 'deviceId', 'name', 'dept', 'nick', 'declaration', 'weeklyGoal', 'createdAt', 'updatedAt', 'version', 'lastSavedAt', 'email', 'pin4', 'employeeId']);
  ensureSheet(ss, SHEET_ACTIVITIES, ['activityId', 'participantId', 'deviceId', 'date', 'steps', 'challenge', 'comment', 'createdAt', 'version', 'savedAt']);
  ensureSheet(ss, SHEET_LOGS, ['loggedAt', 'action', 'deviceId', 'participantId', 'status', 'message']);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const current = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
  headers.forEach((h, i) => {
    if (current[i] !== h) sheet.getRange(1, i + 1).setValue(h);
  });
  if (sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function saveUser(ss, data) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  const employeeId = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!employeeId) throw new Error('employee_id_required');

  const normalizedEmail = normalizeEmail(data.email || '');
  const pin4 = normalizePin(data.pin4 || '');
  const id = employeeId;
  const row = findRowByValue(sheet, 1, id);
  const old = row > 0 ? rowToObject(sheet, row) : {};
  const now = new Date().toISOString();
  const user = {
    id: id,
    employeeId: employeeId,
    deviceId: data.deviceId || old.deviceId || '',
    name: data.name || old.name || '',
    dept: data.dept || old.dept || '',
    nick: data.nick || old.nick || '',
    declaration: data.declaration !== undefined ? data.declaration : (old.declaration || ''),
    weeklyGoal: data.weeklyGoal || old.weeklyGoal || 'まずは無理なく続ける',
    createdAt: data.createdAt || old.createdAt || now,
    updatedAt: data.updatedAt || now,
    version: data.version || data.appVersion || VERSION,
    lastSavedAt: now,
    email: normalizedEmail || old.email || '',
    pin4: pin4 || old.pin4 || ''
  };

  const values = [user.id, user.deviceId, user.name, user.dept, user.nick, user.declaration, user.weeklyGoal, user.createdAt, user.updatedAt, user.version, user.lastSavedAt, user.email, user.pin4, user.employeeId];
  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row: row, id: id, user: publicUser(user) };
  }
  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), id: id, user: publicUser(user) };
}

function loginUser(ss, data) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  const employeeId = normalizeEmployeeId(data.employeeId || data.id || '');
  const email = normalizeEmail(data.email || '');
  const pin4 = normalizePin(data.pin4 || '');
  if ((!employeeId && !email) || !pin4) return null;
  const users = readTable(sheet);
  const user = users.find(u => {
    const sameEmployee = employeeId && (normalizeEmployeeId(u.employeeId || u.id || '') === employeeId);
    const sameEmail = email && (normalizeEmail(u.email || '') === email);
    return (sameEmployee || sameEmail) && normalizePin(u.pin4 || '') === pin4;
  });
  return user ? publicUser(user) : null;
}

function saveActivity(ss, data) {
  const sheet = ss.getSheetByName(SHEET_ACTIVITIES);
  const activityId = String(data.activityId || '').trim();
  if (!activityId) throw new Error('activity_id_required');
  const row = findRowByValue(sheet, 1, activityId);
  const values = [activityId, data.participantId || data.id || '', data.deviceId || '', data.date || '', Number(data.steps || 0), data.challenge === true || data.challenge === 'true', data.comment || '', data.createdAt || '', data.version || data.appVersion || '', new Date().toISOString()];
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
  const byUser = buildUserStats(users, activities, true);
  const members = Object.keys(byUser).map(id => byUser[id]);
  const ranking = rankMembers(members).slice(0, 20);
  return { generatedAt: new Date().toISOString(), totalUsers: members.length, totalActivities: activities.length, totalSteps: activities.reduce((sum, item) => sum + Number(item.steps || 0), 0), members: members, ranking: ranking };
}

function getAdminStats(ss) {
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const byUser = buildUserStats(users, activities, false);
  const members = Object.keys(byUser).map(id => byUser[id]);
  const deptMap = {};
  const monthMap = {};
  const csvRows = [];
  activities.forEach(item => {
    const user = byUser[item.participantId] || {};
    const dept = user.dept || '所属未設定';
    const date = String(item.date || '');
    const month = date.slice(0, 7) || '日付未設定';
    const steps = Number(item.steps || 0);
    if (!deptMap[dept]) deptMap[dept] = { dept: dept, users: {}, activityCount: 0, totalSteps: 0 };
    deptMap[dept].users[item.participantId || 'unknown'] = true;
    deptMap[dept].activityCount += 1;
    deptMap[dept].totalSteps += steps;
    if (!monthMap[month]) monthMap[month] = { month: month, activityCount: 0, totalSteps: 0 };
    monthMap[month].activityCount += 1;
    monthMap[month].totalSteps += steps;
    csvRows.push({ date: date, activityId: item.activityId || '', participantId: item.participantId || '', name: user.name || '', nick: user.nick || '', dept: dept, steps: steps, challenge: item.challenge === true || item.challenge === 'true', comment: item.comment || '', createdAt: item.createdAt || '', savedAt: item.savedAt || '' });
  });
  const deptRanking = Object.keys(deptMap).map(k => { const d = deptMap[k]; return { dept: d.dept, userCount: Object.keys(d.users).length, activityCount: d.activityCount, totalSteps: d.totalSteps }; }).sort((a, b) => b.totalSteps - a.totalSteps);
  const monthly = Object.keys(monthMap).map(k => monthMap[k]).sort((a, b) => String(b.month).localeCompare(String(a.month)));
  return { generatedAt: new Date().toISOString(), totalUsers: members.length, totalActivities: activities.length, totalSteps: activities.reduce((sum, item) => sum + Number(item.steps || 0), 0), ranking: rankMembers(members), deptRanking: deptRanking, monthly: monthly, csvRows: csvRows };
}

function buildUserStats(users, activities, masked) {
  const byUser = {};
  users.forEach(user => {
    const id = normalizeEmployeeId(user.employeeId || user.id || '');
    if (!id) return;
    byUser[id] = { id: id, employeeId: id, name: masked ? maskName(user.name || '') : (user.name || ''), nick: user.nick || '', dept: user.dept || '', declaration: user.declaration || '', weeklyGoal: user.weeklyGoal || '', activityCount: 0, totalSteps: 0, lastDate: '' };
  });
  activities.forEach(item => {
    const id = normalizeEmployeeId(item.participantId || '');
    if (!id) return;
    if (!byUser[id]) byUser[id] = { id: id, employeeId: id, name: 'ゲスト', nick: '', dept: '', declaration: '', weeklyGoal: '', activityCount: 0, totalSteps: 0, lastDate: '' };
    byUser[id].activityCount += 1;
    byUser[id].totalSteps += Number(item.steps || 0);
    if (!byUser[id].lastDate || String(item.date || '') > byUser[id].lastDate) byUser[id].lastDate = String(item.date || '');
  });
  return byUser;
}

function rankMembers(members) {
  return members.slice().sort((a, b) => b.totalSteps !== a.totalSteps ? b.totalSteps - a.totalSteps : b.activityCount - a.activityCount);
}

function rowToObject(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h, i) => obj[h] = values[i]);
  return obj;
}

function publicUser(user) {
  return { id: normalizeEmployeeId(user.employeeId || user.id || ''), employeeId: normalizeEmployeeId(user.employeeId || user.id || ''), deviceId: user.deviceId || '', name: user.name || '', dept: user.dept || '', nick: user.nick || '', declaration: user.declaration || '', weeklyGoal: user.weeklyGoal || '', createdAt: user.createdAt || '', updatedAt: user.updatedAt || '', version: user.version || VERSION, email: user.email || '' };
}

function normalizeEmployeeId(value) { return String(value || '').trim(); }
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function normalizePin(pin) { return String(pin || '').replace(/\D/g, '').slice(0, 4); }

function readTable(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.map(row => { const obj = {}; headers.forEach((h, i) => obj[h] = row[i]); return obj; });
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
  for (let i = 0; i < values.length; i++) if (String(values[i][0]) === String(value)) return i + 2;
  return -1;
}

function writeLog(ss, action, deviceId, participantId, status, message) {
  const sheet = ss.getSheetByName(SHEET_LOGS);
  sheet.appendRow([new Date().toISOString(), action || '', deviceId || '', participantId || '', status || '', message || '']);
}
