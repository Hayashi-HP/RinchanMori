/* Sheet setup and departments */

function setupProject(ss) {
  const usersSheet = ensureSheet(ss, SHEET_USERS, [
    'id', 'deviceId', 'name', 'dept', 'nick', 'declaration', 'weeklyGoal',
    'createdAt', 'updatedAt', 'version', 'lastSavedAt', 'email', 'pin4',
    'employeeId', 'admin', 'weeklyStepGoal', 'role'
  ]);

  usersSheet.getRange(1, 13, Math.max(usersSheet.getMaxRows(), 1), 1).setNumberFormat('@');
  normalizeExistingPin4(usersSheet);

  ensureSheet(ss, SHEET_ACTIVITIES, [
    'activityId', 'participantId', 'deviceId', 'date', 'steps', 'challenge',
    'comment', 'createdAt', 'version', 'savedAt'
  ]);

  ensureSheet(ss, SHEET_THANKS, [
    'thanksId', 'fromParticipantId', 'fromName', 'toParticipantId', 'toName',
    'toDept', 'reason', 'createdAt', 'version', 'savedAt'
  ]);

  ensureSheet(ss, SHEET_LOGS, ['loggedAt', 'action', 'deviceId', 'participantId', 'status', 'message']);
  ensureSheet(ss, SHEET_ERROR_LOGS, [
    'loggedAt', 'receivedAt', 'employeeId', 'deviceId', 'page', 'type',
    'message', 'source', 'line', 'column', 'stack', 'url', 'userAgent', 'clientVersion'
  ]);
  ensureSheet(ss, SHEET_AUDIT_LOGS, [
    'loggedAt', 'actorEmployeeId', 'actorName', 'actorDept', 'actorRole',
    'action', 'targetType', 'targetId', 'status', 'message', 'detailJson', 'version'
  ]);
  ensureSheet(ss, SHEET_BACKUP_LOGS, [
    'createdAt', 'label', 'actorEmployeeId', 'copiedCount', 'sourceCount', 'ok', 'detailJson', 'version'
  ]);
  ensureSheet(ss, SHEET_USER_READS, ['employeeId', 'readNewsIds', 'readThanksFlowerIds', 'updatedAt', 'version']);
  ensureSheet(ss, SHEET_NOTICES, [
    'noticeId', 'type', 'title', 'body', 'authorName', 'targetType', 'targetDept',
    'status', 'startAt', 'endAt', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
    'publishedAt', 'unpublishedAt', 'deleted', 'deletedAt', 'deletedBy', 'version'
  ]);

  const deptSheet = ensureSheet(ss, SHEET_DEPARTMENTS, ['deptId', 'deptName', 'displayOrder', 'active', 'mapKey']);
  seedDepartmentsIfEmpty(deptSheet);

  return {
    spreadsheetId: ss.getId(),
    sheets: ss.getSheets().map(s => s.getName())
  };
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  headers.forEach((header, index) => {
    if (current[index] !== header) sheet.getRange(1, index + 1).setValue(header);
  });

  if (sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function seedDepartmentsIfEmpty(sheet) {
  if (sheet.getLastRow() >= 2) return;
  sheet.getRange(2, 1, DEFAULT_DEPARTMENTS.length, 5).setValues(DEFAULT_DEPARTMENTS);
  sheet.autoResizeColumns(1, 5);
}

function getDepartments(ss) {
  const rows = readTable(ss.getSheetByName(SHEET_DEPARTMENTS));
  const source = rows.length ? rows : DEFAULT_DEPARTMENTS.map(row => ({
    deptId: row[0], deptName: row[1], displayOrder: row[2], active: row[3], mapKey: row[4]
  }));

  return source
    .filter(dept => String(dept.active).toUpperCase() !== 'FALSE' && String(dept.active) !== '0')
    .sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999))
    .map(dept => ({
      deptId: String(dept.deptId || ''),
      deptName: String(dept.deptName || ''),
      displayOrder: Number(dept.displayOrder || 999),
      active: String(dept.active).toUpperCase() !== 'FALSE' && String(dept.active) !== '0',
      mapKey: String(dept.mapKey || 'other')
    }));
}

function normalizeExistingPin4(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const range = sheet.getRange(2, 13, lastRow - 1, 1);
  const values = range.getValues();
  let changed = false;
  const fixed = values.map(row => {
    const pin = normalizePin(row[0]);
    if (pin && String(row[0]) !== pin) changed = true;
    return [pin || ''];
  });

  if (changed) range.setValues(fixed);
}
