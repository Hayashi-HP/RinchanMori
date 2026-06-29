const SHEET_ID = 'ここにスプレッドシートIDを入れる';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.openById(SHEET_ID);

    if (data.action === 'saveUser') {
      const sheet = getSheet_(ss, 'Users', ['deviceId','userId','name','dept','nick','declaration','weeklyGoal','createdAt','updatedAt']);
      upsertUser_(sheet, data);
      return json_({ ok: true });
    }

    if (data.action === 'saveActivity') {
      const sheet = getSheet_(ss, 'Activities', ['deviceId','date','steps','challenge','comment','createdAt']);
      sheet.appendRow([data.deviceId || '', data.date || '', data.steps || 0, data.challenge === true, data.comment || '', data.createdAt || new Date()]);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, name: 'RinchanMoriAPI' });
}

function getSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function upsertUser_(sheet, data) {
  const values = sheet.getDataRange().getValues();
  const deviceId = data.deviceId || '';
  let row = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === deviceId) { row = i + 1; break; }
  }
  const newRow = [deviceId, data.id || '', data.name || '', data.dept || '', data.nick || '', data.declaration || '', data.weeklyGoal || '', data.createdAt || new Date(), new Date()];
  if (row > 0) sheet.getRange(row, 1, 1, newRow.length).setValues([newRow]);
  else sheet.appendRow(newRow);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
