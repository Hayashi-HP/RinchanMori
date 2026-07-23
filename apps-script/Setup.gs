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
  const challengesSheet = ensureSheet(ss, SHEET_CHALLENGES, [
    'challengeId', 'yearMonth', 'scope', 'targetDept', 'title', 'icon', 'message',
    'targetSteps', 'active', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'version'
  ]);
  normalizeExistingChallengeYearMonths(challengesSheet);

  const badgesSheet = ensureSheet(ss, SHEET_BADGES, [
    'badgeId', 'group', 'icon', 'name', 'hint', 'active', 'displayOrder',
    'updatedAt', 'updatedBy', 'version'
  ]);
  ensureDefaultBadgeRows(badgesSheet);

  const eventsSheet = ensureSheet(ss, SHEET_EVENTS, [
    'eventId', 'year', 'eventType', 'baseKey', 'key', 'icon', 'title',
    'startDate', 'endDate', 'text', 'active', 'createdAt', 'createdBy',
    'updatedAt', 'updatedBy', 'version'
  ]);
  normalizeExistingEventDates(eventsSheet);

  ensureAppSettingsSheet(ss);
  ensurePointProgramSettings(ss);
  ensureSheet(ss, SHEET_POINT_TRANSACTIONS, [
    'transactionId', 'employeeId', 'amount', 'type', 'sourceId', 'description',
    'createdAt', 'createdBy', 'rewardId', 'metadataJson', 'version'
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

function parseDepartmentActive(value) {
  if (value === true || value === 1) return true;
  const raw = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'active';
}

function parseDepartmentDisplayOrder(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim();
  if (!/^\d+$/.test(raw)) throw new Error('department_order_integer_required');
  const order = Number(raw);
  if (!isFinite(order) || order < 1 || order > 9999) throw new Error('department_order_out_of_range');
  return order;
}

function getAdminDepartments(ss) {
  const rows = readTable(ss.getSheetByName(SHEET_DEPARTMENTS));
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const countByName = users.reduce((counts, user) => {
    const name = String(user.dept || '').trim();
    if (name) counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  const departments = rows.map(row => {
    const deptId = String(row.deptId || '').trim();
    const deptName = String(row.deptName || '').trim();
    if (!deptId && !deptName) return null;
    return {
      deptId,
      deptName,
      displayOrder: Number(row.displayOrder || 999),
      active: parseDepartmentActive(row.active),
      mapKey: String(row.mapKey || 'other'),
      memberCount: Number(countByName[deptName] || 0)
    };
  }).filter(Boolean).sort((a, b) => {
    return a.displayOrder - b.displayOrder || a.deptName.localeCompare(b.deptName, 'ja');
  });

  return {
    departments,
    total: departments.length,
    activeCount: departments.filter(item => item.active).length,
    generatedAt: new Date().toISOString()
  };
}

function replaceDepartmentNameInSheet(sheet, headerName, oldName, newName) {
  if (!sheet || !oldName || oldName === newName || sheet.getLastRow() < 2) return 0;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const column = headers.indexOf(headerName) + 1;
  if (column < 1) return 0;
  const range = sheet.getRange(2, column, sheet.getLastRow() - 1, 1);
  const values = range.getValues();
  let changed = 0;
  const next = values.map(row => {
    if (String(row[0] || '').trim() !== oldName) return row;
    changed += 1;
    return [newName];
  });
  if (changed) range.setValues(next);
  return changed;
}

function createDepartmentId() {
  return 'dept-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function saveAdminDepartment(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_USERS) < 0) throw new Error('manage_users_required');

  const sheet = ss.getSheetByName(SHEET_DEPARTMENTS);
  const requestedId = String(data.deptId || '').trim();
  const deptName = String(data.deptName || '').trim();
  const displayOrder = parseDepartmentDisplayOrder(data.displayOrder);
  const active = parseDepartmentActive(data.active);
  const rows = readTable(sheet);
  const existingIndex = requestedId
    ? rows.findIndex(row => String(row.deptId || '').trim() === requestedId)
    : -1;
  const existing = existingIndex >= 0 ? rows[existingIndex] : null;

  if (!deptName) throw new Error('department_name_required');
  if (deptName.length > 80) throw new Error('department_name_too_long');
  if (requestedId && !existing) throw new Error('department_not_found');

  const duplicate = rows.find(row => {
    const rowId = String(row.deptId || '').trim();
    return rowId !== requestedId && String(row.deptName || '').trim() === deptName;
  });
  if (duplicate) throw new Error('department_name_duplicate');

  const deptId = existing ? requestedId : createDepartmentId();
  const oldName = existing ? String(existing.deptName || '').trim() : '';
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const memberCount = oldName
    ? users.filter(user => String(user.dept || '').trim() === oldName).length
    : 0;
  if (existing && parseDepartmentActive(existing.active) && !active && memberCount > 0) {
    throw new Error('department_in_use');
  }

  const rowValues = [
    deptId,
    deptName,
    displayOrder,
    active,
    existing ? String(existing.mapKey || 'other') : 'other'
  ];

  if (existing) {
    sheet.getRange(existingIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  let updatedUsers = 0;
  let updatedNotices = 0;
  if (existing && oldName && oldName !== deptName) {
    updatedUsers = replaceDepartmentNameInSheet(ss.getSheetByName(SHEET_USERS), 'dept', oldName, deptName);
    updatedNotices = replaceDepartmentNameInSheet(ss.getSheetByName(SHEET_NOTICES), 'targetDept', oldName, deptName);
  }

  invalidateDepartmentCaches();
  return {
    type: existing ? 'updated' : 'inserted',
    department: {
      deptId,
      deptName,
      displayOrder,
      active,
      mapKey: rowValues[4],
      memberCount
    },
    renamed: oldName && oldName !== deptName,
    updatedUsers,
    updatedNotices
  };
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
