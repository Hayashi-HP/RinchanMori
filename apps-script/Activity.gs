/* Activity records */

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
    data.version || data.appVersion || VERSION,
    new Date().toISOString()
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row, activityId };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), activityId };
}

function deleteActivity(ss, data) {
  const sheet = ss.getSheetByName(SHEET_ACTIVITIES);
  const activityId = String(data.activityId || '').trim();
  if (!activityId) throw new Error('activity_id_required');

  const row = findRowByValue(sheet, 1, activityId);
  if (row > 0) {
    sheet.deleteRow(row);
    return { deleted: true, row, activityId };
  }

  return { deleted: false, row: -1, activityId };
}

function getMyActivities(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!id) return [];

  return readTable(ss.getSheetByName(SHEET_ACTIVITIES))
    .filter(item => normalizeEmployeeId(item.participantId || '') === id)
    .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')))
    .slice(0, 200)
    .map(item => ({
      activityId: String(item.activityId || ''),
      participantId: normalizeEmployeeId(item.participantId || ''),
      deviceId: String(item.deviceId || ''),
      date: String(item.date || ''),
      steps: Number(item.steps || 0),
      challenge: item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE',
      comment: String(item.comment || ''),
      createdAt: String(item.createdAt || ''),
      version: String(item.version || VERSION),
      savedAt: String(item.savedAt || '')
    }));
}
