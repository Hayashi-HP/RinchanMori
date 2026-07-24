/* Activity records */

function saveActivity(ss, data) {
  const sheet = ss.getSheetByName(SHEET_ACTIVITIES);
  const activityId = String(data.activityId || '').trim();
  if (!activityId) throw new Error('activity_id_required');
  const participantId = normalizeEmployeeId(data.participantId || data.employeeId || data.id || '');
  if (!participantId) throw new Error('activity_employee_required');
  const date = String(data.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('activity_date_invalid');
  const rawSteps = String(data.steps === undefined || data.steps === null ? '' : data.steps).trim();
  if (!/^\d+$/.test(rawSteps)) throw new Error('activity_steps_integer_required');
  const incomingSteps = Number(rawSteps);
  if (!isFinite(incomingSteps) || incomingSteps < 0 || incomingSteps > 200000) throw new Error('activity_steps_out_of_range');

  const inputSource = normalizeActivityInputSource(data);
  const correctionMode = data.correctionMode === true || String(data.correctionMode || '').toLowerCase() === 'true' ||
    data.replaceExisting === true || String(data.mode || '').toLowerCase() === 'correction' ||
    inputSource === 'admin';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = readTable(sheet);
    const sameDate = rows.map((item, index) => ({ item, row:index + 2 }))
      .filter(entry => normalizeEmployeeId(entry.item.participantId || '') === participantId)
      .filter(entry => String(entry.item.date || '').slice(0, 10) === date)
      .sort((a, b) => Number(b.item.steps || 0) - Number(a.item.steps || 0) ||
        String(b.item.savedAt || b.item.createdAt || '').localeCompare(String(a.item.savedAt || a.item.createdAt || '')));
    const exact = rows.findIndex(item => String(item.activityId || '') === activityId);
    const exactEntry = exact >= 0 ? { item:rows[exact], row:exact + 2 } : null;
    const target = correctionMode && exactEntry ? exactEntry : (sameDate[0] || exactEntry);
    const existingSteps = target ? Number(target.item.steps || 0) : 0;
    const savedSteps = correctionMode ? incomingSteps : Math.max(existingSteps, incomingSteps);
    const acceptIncomingDetails = correctionMode || !target || incomingSteps > existingSteps;
    const storedActivityId = target ? String(target.item.activityId || activityId) : activityId;
    const values = [
      storedActivityId,
      participantId,
      acceptIncomingDetails ? (data.deviceId || '') : String(target.item.deviceId || ''),
      date,
      savedSteps,
      acceptIncomingDetails
        ? (data.challenge === true || data.challenge === 'true')
        : (target.item.challenge === true || String(target.item.challenge).toUpperCase() === 'TRUE'),
      acceptIncomingDetails
        ? (data.comment || '')
        : String(target.item.comment || ''),
      acceptIncomingDetails
        ? (data.createdAt || '')
        : String(target.item.createdAt || ''),
      acceptIncomingDetails
        ? (data.version || data.appVersion || VERSION)
        : String(target.item.version || VERSION),
      new Date().toISOString()
    ];

    if (target) {
      sheet.getRange(target.row, 1, 1, values.length).setValues([values]);
      return {
        type:'updated', row:target.row, activityId:storedActivityId, participantId, date,
        receivedSteps:incomingSteps, savedSteps, steps:savedSteps, previousSteps:existingSteps,
        correctionMode, inputSource, relatedRecordId:storedActivityId
      };
    }

    sheet.appendRow(values);
    return {
      type:'inserted', row:sheet.getLastRow(), activityId:storedActivityId, participantId, date,
      receivedSteps:incomingSteps, savedSteps, steps:savedSteps, previousSteps:0,
      correctionMode, inputSource, relatedRecordId:storedActivityId
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizeActivityInputSource(data) {
  const explicit = String(data.inputSource || '').trim().toLowerCase();
  if (['shortcut', 'manual', 'app', 'admin', 'system'].indexOf(explicit) >= 0) return explicit;
  const device = String(data.deviceId || '').toLowerCase();
  if (device.indexOf('admin-correction') >= 0) return 'admin';
  if (device.indexOf('iphone-health') >= 0 || device.indexOf('apple') >= 0) return 'shortcut';
  return 'manual';
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
