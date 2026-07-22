/* Monthly challenge configuration */

const CHALLENGE_SCOPE_INDIVIDUAL = 'individual';
const CHALLENGE_SCOPE_DEPARTMENT = 'department';
const CHALLENGE_SCOPE_HOSPITAL = 'hospital';

function normalizeChallengeYearMonth(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM');
  }

  const raw = String(value === undefined || value === null ? '' : value).trim();
  const match = raw.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?(?:\s.*)?$/);
  if (!match) return '';
  const month = Number(match[2]);
  if (month < 1 || month > 12) return '';
  return match[1] + '-' + String(month).padStart(2, '0');
}

function normalizeExistingChallengeYearMonths(sheet) {
  if (!sheet) return 0;

  const formatRowCount = Math.max(sheet.getMaxRows(), 1);
  sheet.getRange(1, 2, formatRowCount, 1).setNumberFormat('@');
  if (sheet.getLastRow() < 2) return 0;

  const range = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1);
  const values = range.getValues();
  let changed = 0;
  const normalizedValues = values.map(row => {
    const normalized = normalizeChallengeYearMonth(row[0]);
    if (!normalized) return row;
    if (Object.prototype.toString.call(row[0]) === '[object Date]' || String(row[0]).trim() !== normalized) {
      changed += 1;
    }
    return [normalized];
  });

  if (changed) range.setValues(normalizedValues);
  return changed;
}

function currentChallengeYearMonth() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
}

function normalizeChallengeScope(value) {
  const scope = String(value || '').trim().toLowerCase();
  if ([CHALLENGE_SCOPE_INDIVIDUAL, CHALLENGE_SCOPE_DEPARTMENT, CHALLENGE_SCOPE_HOSPITAL].indexOf(scope) >= 0) return scope;
  return '';
}

function parseChallengeActive(value) {
  if (value === true || value === 1) return true;
  const raw = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'active' || raw === 'published';
}

function parseChallengeTargetSteps(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim();
  if (!/^\d+$/.test(raw)) throw new Error('challenge_target_integer_required');
  const target = Number(raw);
  if (!isFinite(target) || target < 1000 || target > 1000000000) throw new Error('challenge_target_out_of_range');
  return target;
}

function challengePublicRow(row) {
  return {
    challengeId: String(row.challengeId || ''),
    yearMonth: normalizeChallengeYearMonth(row.yearMonth),
    scope: normalizeChallengeScope(row.scope),
    targetDept: String(row.targetDept || ''),
    title: String(row.title || ''),
    icon: String(row.icon || ''),
    message: String(row.message || ''),
    targetSteps: Number(row.targetSteps || 0),
    active: parseChallengeActive(row.active),
    updatedAt: String(row.updatedAt || row.createdAt || '')
  };
}

function readChallengeConfigs(ss) {
  return readTable(ss.getSheetByName(SHEET_CHALLENGES))
    .map(challengePublicRow)
    .filter(row => row.challengeId && row.yearMonth && row.scope)
    .sort((a, b) => String(b.yearMonth).localeCompare(String(a.yearMonth))
      || String(a.scope).localeCompare(String(b.scope))
      || String(a.targetDept).localeCompare(String(b.targetDept), 'ja'));
}

function getPublicChallengeConfigs(ss, yearMonth) {
  const targetMonth = normalizeChallengeYearMonth(yearMonth || currentChallengeYearMonth());
  return readChallengeConfigs(ss).filter(row => row.yearMonth === targetMonth);
}

function listAdminChallenges(ss, data) {
  const month = normalizeChallengeYearMonth(data.yearMonth || '');
  const scope = normalizeChallengeScope(data.scope || '');
  const rows = readChallengeConfigs(ss).filter(row => {
    if (month && row.yearMonth !== month) return false;
    if (scope && row.scope !== scope) return false;
    return true;
  });
  return {
    challenges: rows,
    total: rows.length,
    departments: getDepartments(ss).map(item => item.deptName).filter(Boolean),
    currentYearMonth: currentChallengeYearMonth(),
    generatedAt: new Date().toISOString()
  };
}

function createChallengeId() {
  return 'challenge-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function saveAdminChallenge(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_CHALLENGES) < 0) throw new Error('manage_challenges_required');

  const sheet = ss.getSheetByName(SHEET_CHALLENGES);
  const requestedId = String(data.challengeId || '').trim();
  const rows = readTable(sheet);
  const existingIndex = requestedId
    ? rows.findIndex(row => String(row.challengeId || '').trim() === requestedId)
    : -1;
  const existing = existingIndex >= 0 ? rows[existingIndex] : null;
  if (requestedId && !existing) throw new Error('challenge_not_found');

  const yearMonth = normalizeChallengeYearMonth(data.yearMonth);
  const scope = normalizeChallengeScope(data.scope);
  const targetDept = scope === CHALLENGE_SCOPE_DEPARTMENT ? String(data.targetDept || '').trim() : '';
  const title = String(data.title || '').trim();
  const icon = String(data.icon || '').trim();
  const message = String(data.message || '').trim();
  const targetSteps = parseChallengeTargetSteps(data.targetSteps);
  const active = parseChallengeActive(data.active);

  if (!yearMonth) throw new Error('challenge_month_required');
  if (!scope) throw new Error('challenge_scope_required');
  if (scope === CHALLENGE_SCOPE_DEPARTMENT && !targetDept) throw new Error('challenge_department_required');
  if (!title) throw new Error('challenge_title_required');
  if (title.length > 80) throw new Error('challenge_title_too_long');
  if (icon.length > 20) throw new Error('challenge_icon_too_long');
  if (message.length > 240) throw new Error('challenge_message_too_long');

  const duplicate = rows.find(row => {
    const rowId = String(row.challengeId || '').trim();
    const rowScope = normalizeChallengeScope(row.scope);
    const rowTargetDept = rowScope === CHALLENGE_SCOPE_DEPARTMENT ? String(row.targetDept || '').trim() : '';
    return rowId !== requestedId
      && normalizeChallengeYearMonth(row.yearMonth) === yearMonth
      && rowScope === scope
      && rowTargetDept === targetDept;
  });
  if (duplicate) throw new Error('challenge_duplicate');

  const now = new Date().toISOString();
  const challengeId = existing ? requestedId : createChallengeId();
  const rowValues = [
    challengeId,
    yearMonth,
    scope,
    targetDept,
    title,
    icon,
    message,
    targetSteps,
    active,
    existing ? existing.createdAt || now : now,
    existing ? existing.createdBy || actor.employeeId : actor.employeeId,
    now,
    actor.employeeId,
    VERSION
  ];

  let savedRow;
  if (existing) {
    savedRow = existingIndex + 2;
    sheet.getRange(savedRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
    savedRow = sheet.getLastRow();
  }
  sheet.getRange(savedRow, 2).setNumberFormat('@').setValue(yearMonth);

  return {
    type: existing ? 'updated' : 'inserted',
    challenge: challengePublicRow({
      challengeId,
      yearMonth,
      scope,
      targetDept,
      title,
      icon,
      message,
      targetSteps,
      active,
      updatedAt: now
    })
  };
}

function deleteAdminChallenge(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_CHALLENGES) < 0) throw new Error('manage_challenges_required');

  const challengeId = String(data.challengeId || '').trim();
  if (!challengeId) throw new Error('challenge_not_found');

  const sheet = ss.getSheetByName(SHEET_CHALLENGES);
  const rows = readTable(sheet);
  const existingIndex = rows.findIndex(row => String(row.challengeId || '').trim() === challengeId);
  if (existingIndex < 0) throw new Error('challenge_not_found');

  const deleted = challengePublicRow(rows[existingIndex]);
  sheet.deleteRow(existingIndex + 2);
  return { type: 'deleted', challenge: deleted };
}
