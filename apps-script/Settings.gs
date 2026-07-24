/* Application-wide operating settings */

function ensureAppSettingsSheet(ss) {
  const current = ss.getSheetByName(SHEET_APP_SETTINGS);
  if (current) {
    const existingKeys = readTable(current).reduce((map, row) => {
      map[String(row.settingKey || '')] = true;
      return map;
    }, {});
    if (Object.keys(DEFAULT_APP_SETTINGS).every(key => existingKeys[key])) return current;
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureSheet(ss, SHEET_APP_SETTINGS, [
      'settingKey', 'value', 'updatedAt', 'updatedBy', 'version'
    ]);
    const existing = readTable(sheet).reduce((map, row) => {
      map[String(row.settingKey || '')] = true;
      return map;
    }, {});
    const now = new Date().toISOString();
    Object.keys(DEFAULT_APP_SETTINGS).forEach(key => {
      if (!existing[key]) sheet.appendRow([key, DEFAULT_APP_SETTINGS[key], now, 'system', VERSION]);
    });
    return sheet;
  } finally {
    lock.releaseLock();
  }
}

function parseIntegerSetting(value, fallback, min, max, errorCode) {
  const raw = String(value == null ? '' : value).trim();
  if (!/^\d+$/.test(raw)) throw new Error(errorCode + '_integer_required');
  const number = Number(raw);
  if (!isFinite(number) || number < min || number > max) throw new Error(errorCode + '_out_of_range');
  return number;
}

function getAdminAppSettings(ss) {
  const sheet = ensureAppSettingsSheet(ss);
  const rows = readTable(sheet);
  const values = Object.assign({}, DEFAULT_APP_SETTINGS);
  let updatedAt = '';
  let updatedBy = '';
  rows.forEach(row => {
    const key = String(row.settingKey || '');
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      if (typeof DEFAULT_APP_SETTINGS[key] === 'boolean') values[key] = pointBoolean(row.value);
      else values[key] = Number(row.value || values[key]);
    }
    if (String(row.updatedAt || '') >= updatedAt) {
      updatedAt = String(row.updatedAt || '');
      updatedBy = String(row.updatedBy || '');
    }
  });
  const pointProgram = getPointProgramSettings(ss);
  if (String(pointProgram.updatedAt || '') >= updatedAt) {
    updatedAt = String(pointProgram.updatedAt || '');
    updatedBy = String(pointProgram.updatedBy || '');
  }
  return {
    defaultWeeklyStepGoal: Number(values.defaultWeeklyStepGoal || DEFAULT_APP_SETTINGS.defaultWeeklyStepGoal),
    inactivityAlertDays: Number(values.inactivityAlertDays || DEFAULT_APP_SETTINGS.inactivityAlertDays),
    commonDailyStepGoalEnabled: values.commonDailyStepGoalEnabled === true,
    commonDailyStepGoal: Number(values.commonDailyStepGoal || DEFAULT_APP_SETTINGS.commonDailyStepGoal),
    preferPersonalDailyStepGoal: values.preferPersonalDailyStepGoal !== false,
    commonDailyStepGoalOnlyWhenUnset: values.commonDailyStepGoalOnlyWhenUnset !== false,
    pointProgram,
    updatedAt,
    updatedBy,
    version: VERSION
  };
}

function getPublicAppSettings(ss) {
  const settings = getAdminAppSettings(ss);
  return {
    defaultWeeklyStepGoal: settings.defaultWeeklyStepGoal,
    inactivityAlertDays: settings.inactivityAlertDays,
    commonDailyStepGoalEnabled: settings.commonDailyStepGoalEnabled,
    commonDailyStepGoal: settings.commonDailyStepGoal,
    preferPersonalDailyStepGoal: settings.preferPersonalDailyStepGoal,
    commonDailyStepGoalOnlyWhenUnset: settings.commonDailyStepGoalOnlyWhenUnset,
    pointProgram: settings.pointProgram,
    updatedAt: settings.updatedAt,
    version: settings.version
  };
}

function saveSettingRow(sheet, key, value, actor, now) {
  const row = findRowByValue(sheet, 1, key);
  const values = [key, value, now, actor, VERSION];
  if (row > 0) sheet.getRange(row, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
}

function saveAdminAppSettings(ss, data) {
  const current = getAdminAppSettings(ss);
  const weeklyGoal = parseIntegerSetting(data.defaultWeeklyStepGoal, DEFAULT_APP_SETTINGS.defaultWeeklyStepGoal, 7000, 1000000, 'default_weekly_step_goal');
  const inactiveDays = parseIntegerSetting(data.inactivityAlertDays, DEFAULT_APP_SETTINGS.inactivityAlertDays, 1, 90, 'inactivity_alert_days');
  const commonGoal = parseIntegerSetting(
    data.commonDailyStepGoal !== undefined ? data.commonDailyStepGoal : current.commonDailyStepGoal,
    DEFAULT_APP_SETTINGS.commonDailyStepGoal,
    1000,
    100000,
    'common_daily_step_goal'
  );
  const sheet = ensureAppSettingsSheet(ss);
  const actor = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '') || 'system';
  const now = new Date().toISOString();
  saveSettingRow(sheet, 'defaultWeeklyStepGoal', weeklyGoal, actor, now);
  saveSettingRow(sheet, 'inactivityAlertDays', inactiveDays, actor, now);
  saveSettingRow(sheet, 'commonDailyStepGoalEnabled', data.commonDailyStepGoalEnabled !== undefined ? pointBoolean(data.commonDailyStepGoalEnabled) : current.commonDailyStepGoalEnabled, actor, now);
  saveSettingRow(sheet, 'commonDailyStepGoal', commonGoal, actor, now);
  saveSettingRow(sheet, 'preferPersonalDailyStepGoal', data.preferPersonalDailyStepGoal !== undefined ? pointBoolean(data.preferPersonalDailyStepGoal) : current.preferPersonalDailyStepGoal, actor, now);
  saveSettingRow(sheet, 'commonDailyStepGoalOnlyWhenUnset', data.commonDailyStepGoalOnlyWhenUnset !== undefined ? pointBoolean(data.commonDailyStepGoalOnlyWhenUnset) : current.commonDailyStepGoalOnlyWhenUnset, actor, now);
  return getAdminAppSettings(ss);
}
