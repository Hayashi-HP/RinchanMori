/* User registration, login, profile, and user state */

function saveUser(ss, data) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  const employeeId = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!employeeId) throw new Error('employee_id_required');

  const row = findRowByValue(sheet, 1, employeeId);
  const old = row > 0 ? rowToObject(sheet, row) : {};
  const now = new Date().toISOString();

  const user = {
    id: employeeId,
    employeeId,
    deviceId: data.deviceId || old.deviceId || '',
    name: data.name || old.name || '',
    dept: data.dept || old.dept || '',
    nick: data.nick !== undefined ? data.nick : old.nick || '',
    declaration: data.declaration !== undefined ? data.declaration : old.declaration || '',
    weeklyGoal: data.weeklyGoal !== undefined ? data.weeklyGoal : old.weeklyGoal || 'まずは無理なく続ける',
    createdAt: data.createdAt || old.createdAt || now,
    updatedAt: data.updatedAt || now,
    version: data.version || data.appVersion || VERSION,
    lastSavedAt: now,
    email: normalizeEmail(data.email || '') || old.email || '',
    pin4: normalizePin(data.pin4 || '') || normalizePin(old.pin4 || '') || '',
    admin: data.admin !== undefined ? data.admin : old.admin || '',
    weeklyStepGoal: data.weeklyStepGoal !== undefined ? data.weeklyStepGoal : old.weeklyStepGoal || ''
  };

  const values = [
    user.id,
    user.deviceId,
    user.name,
    user.dept,
    user.nick,
    user.declaration,
    user.weeklyGoal,
    user.createdAt,
    user.updatedAt,
    user.version,
    user.lastSavedAt,
    user.email,
    user.pin4,
    user.employeeId,
    user.admin,
    user.weeklyStepGoal
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row, id: employeeId, user: publicUser(user) };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), id: employeeId, user: publicUser(user) };
}

function loginUser(ss, data) {
  const sheet = ss.getSheetByName(SHEET_USERS);
  const employeeId = normalizeEmployeeId(data.employeeId || data.id || '');
  const email = normalizeEmail(data.email || '');
  const pin4 = normalizePin(data.pin4 || '');

  if ((!employeeId && !email) || !pin4) return null;

  const users = readTable(sheet);
  const user = users.find(row => {
    const sameEmployee = employeeId && normalizeEmployeeId(row.employeeId || row.id || '') === employeeId;
    const sameEmail = email && normalizeEmail(row.email || '') === email;
    return sameEmployee || sameEmail;
  });

  if (!user) return null;

  const storedPin = normalizePin(user.pin4 || '');
  if (storedPin && storedPin !== pin4) return null;

  if (!storedPin) {
    const row = findRowByValue(sheet, 1, normalizeEmployeeId(user.id || user.employeeId || employeeId));
    if (row > 0) sheet.getRange(row, 13).setNumberFormat('@').setValue(pin4);
    user.pin4 = pin4;
  }

  return publicUser(user);
}

function getUserState(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  const clientToken = String(data.syncToken || data.clientSyncToken || '').trim();
  const user = getPublicUserById(ss, id);
  const activities = getMyActivities(ss, { employeeId: id });
  const receivedThanks = getMyThanks(ss, { employeeId: id });
  const sentThanks = getMySentThanks(ss, { employeeId: id });
  const thanksTimeline = getPublicThanksTimeline(ss);
  const readNewsIds = getReadNewsIds(ss, id);
  const thanksStats = getMyThanksStats(ss, { employeeId: id });
  const syncToken = createUserStateToken(user, activities, receivedThanks, sentThanks, thanksTimeline, readNewsIds, thanksStats);

  if (clientToken && clientToken === syncToken) {
    return {
      employeeId: id,
      unchanged: true,
      syncToken,
      serverAt: new Date().toISOString()
    };
  }

  return {
    employeeId: id,
    user,
    activities,
    receivedThanks,
    sentThanks,
    thanksTimeline,
    readNewsIds,
    thanksStats,
    syncToken,
    unchanged: false,
    serverAt: new Date().toISOString()
  };
}

function createUserStateToken(user, activities, receivedThanks, sentThanks, thanksTimeline, readNewsIds, thanksStats) {
  const parts = [
    user ? [user.id, user.updatedAt, user.weeklyGoal, user.weeklyStepGoal, user.dept, user.declaration].join('|') : '',
    listToken(activities, 'activityId', 'savedAt'),
    listToken(receivedThanks, 'thanksId', 'savedAt'),
    listToken(sentThanks, 'thanksId', 'savedAt'),
    listToken(thanksTimeline, 'id', 'createdAt'),
    (readNewsIds || []).join(','),
    thanksStats ? [thanksStats.sentCount, thanksStats.receivedCount, thanksStats.totalCount].join('|') : ''
  ];
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, parts.join('||'))).replace(/=+$/, '');
}

function listToken(list, idKey, timeKey) {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return '0';
  const latest = items.slice(0, 10).map(item => [item[idKey] || item.id || '', item[timeKey] || item.createdAt || item.updatedAt || ''].join('@')).join(',');
  return items.length + ':' + latest;
}

function getPublicUserById(ss, id) {
  if (!id) return null;
  const user = readTable(ss.getSheetByName(SHEET_USERS))
    .find(row => normalizeEmployeeId(row.employeeId || row.id || '') === id);
  return user ? publicUser(user) : null;
}

function publicUser(user) {
  return {
    id: normalizeEmployeeId(user.employeeId || user.id || ''),
    employeeId: normalizeEmployeeId(user.employeeId || user.id || ''),
    deviceId: user.deviceId || '',
    name: user.name || '',
    dept: user.dept || '',
    nick: user.nick || '',
    declaration: user.declaration || '',
    weeklyGoal: user.weeklyGoal || '',
    weeklyStepGoal: user.weeklyStepGoal || '',
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
    version: user.version || VERSION,
    email: user.email || '',
    admin: String(user.admin || '').trim() === '1' ? '1' : ''
  };
}
