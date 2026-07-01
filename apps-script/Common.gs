/* Common helpers */

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readTable(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => obj[header] = row[index]);
    return obj;
  });
}

function rowToObject(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((header, index) => obj[header] = values[index]);
  return obj;
}

function findRowByValue(sheet, col, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (let index = 0; index < values.length; index++) {
    if (String(values[index][0]) === String(value)) return index + 2;
  }
  return -1;
}

function toDateKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function normalizeEmployeeId(value) {
  return String(value || '').trim();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePin(pin) {
  const digits = String(pin || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-4).padStart(4, '0');
}

function maskName(name) {
  const text = String(name || '').trim();
  if (!text) return 'ゲスト';
  if (text.length <= 2) return text;
  return text.slice(0, 1) + '＊' + text.slice(-1);
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
