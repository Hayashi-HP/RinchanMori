/* Point program ledger, rules, rewards, and safe side effects */

const POINT_SETTING_PREFIX = 'point.';
const POINT_MAX_RULE_AMOUNT = 100000;
const POINT_MAX_REWARD_COST = 10000000;

const DEFAULT_POINT_RULES = [
  { key:'initial_registration', name:'初回登録', enabled:true, amount:50 },
  { key:'daily_open', name:'1日1回アプリを開く', enabled:true, amount:1 },
  { key:'activity_sync', name:'歩数同期', enabled:true, amount:2 },
  { key:'daily_step_goal', name:'今日の歩数目標達成', enabled:true, amount:5 },
  { key:'weekly_step_goal', name:'週間歩数目標達成', enabled:true, amount:20 },
  { key:'thanks_received', name:'ありがとう受信', enabled:true, amount:50 },
  { key:'event_participation', name:'イベント参加', enabled:true, amount:50 }
];

const DEFAULT_POINT_REWARDS = [
  { key:'limited_badge', name:'限定バッジ', enabled:true, cost:100, monthlyLimit:0 },
  { key:'rin_cafe', name:'りんカフェ', enabled:true, cost:500, monthlyLimit:1 },
  { key:'rinchan_goods', name:'限定りんちゃんグッズ', enabled:true, cost:1000, monthlyLimit:0 },
  { key:'special_lottery', name:'特別抽選応募', enabled:true, cost:2000, monthlyLimit:0 }
];

function pointSettingKey(kind, key, field) {
  return POINT_SETTING_PREFIX + kind + '.' + key + '.' + field;
}

function pointBoolean(value) {
  if (value === true || value === 1) return true;
  const raw = String(value == null ? '' : value).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'on';
}

function pointInteger(value, fallback) {
  const raw = String(value == null ? '' : value).trim();
  if (!/^\d+$/.test(raw)) return Number(fallback || 0);
  const parsed = Number(raw);
  return isFinite(parsed) ? parsed : Number(fallback || 0);
}

function defaultPointSettingRows() {
  const rows = [{ key:'point.enabled', value:true }];
  DEFAULT_POINT_RULES.forEach(rule => {
    rows.push({ key:pointSettingKey('rule', rule.key, 'name'), value:rule.name });
    rows.push({ key:pointSettingKey('rule', rule.key, 'enabled'), value:rule.enabled });
    rows.push({ key:pointSettingKey('rule', rule.key, 'amount'), value:rule.amount });
  });
  DEFAULT_POINT_REWARDS.forEach(reward => {
    rows.push({ key:pointSettingKey('reward', reward.key, 'name'), value:reward.name });
    rows.push({ key:pointSettingKey('reward', reward.key, 'enabled'), value:reward.enabled });
    rows.push({ key:pointSettingKey('reward', reward.key, 'cost'), value:reward.cost });
  });
  return rows;
}

function ensurePointProgramSettings(ss) {
  const sheet = ensureAppSettingsSheet(ss);
  const rows = readTable(sheet);
  const hasAnyPointSetting = rows.some(row => String(row.settingKey || '').indexOf(POINT_SETTING_PREFIX) === 0);
  if (hasAnyPointSetting) return sheet;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const current = readTable(sheet);
    if (current.some(row => String(row.settingKey || '').indexOf(POINT_SETTING_PREFIX) === 0)) return sheet;
    const now = new Date().toISOString();
    defaultPointSettingRows().forEach(item => {
      sheet.appendRow([item.key, item.value, now, 'system', VERSION]);
    });
    return sheet;
  } finally {
    lock.releaseLock();
  }
}

function pointSettingsMap(ss) {
  const sheet = ss.getSheetByName(SHEET_APP_SETTINGS);
  const map = {};
  let updatedAt = '';
  let updatedBy = '';
  readTable(sheet).forEach(row => {
    const key = String(row.settingKey || '');
    if (key.indexOf(POINT_SETTING_PREFIX) !== 0) return;
    map[key] = row.value;
    if (String(row.updatedAt || '') >= updatedAt) {
      updatedAt = String(row.updatedAt || '');
      updatedBy = String(row.updatedBy || '');
    }
  });
  return { values:map, updatedAt, updatedBy };
}

function getPointProgramSettings(ss) {
  const source = pointSettingsMap(ss);
  const values = source.values;
  const rules = DEFAULT_POINT_RULES.map(defaultRule => {
    const nameKey = pointSettingKey('rule', defaultRule.key, 'name');
    const enabledKey = pointSettingKey('rule', defaultRule.key, 'enabled');
    const amountKey = pointSettingKey('rule', defaultRule.key, 'amount');
    return {
      key: defaultRule.key,
      name: String(values[nameKey] || defaultRule.name).trim().slice(0, 80),
      enabled: Object.prototype.hasOwnProperty.call(values, enabledKey) && pointBoolean(values[enabledKey]),
      amount: Object.prototype.hasOwnProperty.call(values, amountKey)
        ? Math.max(0, Math.min(pointInteger(values[amountKey], 0), POINT_MAX_RULE_AMOUNT))
        : 0
    };
  });
  const rewards = DEFAULT_POINT_REWARDS.map(defaultReward => {
    const nameKey = pointSettingKey('reward', defaultReward.key, 'name');
    const enabledKey = pointSettingKey('reward', defaultReward.key, 'enabled');
    const costKey = pointSettingKey('reward', defaultReward.key, 'cost');
    return {
      key: defaultReward.key,
      name: String(values[nameKey] || defaultReward.name).trim().slice(0, 80),
      enabled: Object.prototype.hasOwnProperty.call(values, enabledKey) && pointBoolean(values[enabledKey]),
      cost: Object.prototype.hasOwnProperty.call(values, costKey)
        ? Math.max(0, Math.min(pointInteger(values[costKey], 0), POINT_MAX_REWARD_COST))
        : 0,
      monthlyLimit: Number(defaultReward.monthlyLimit || 0)
    };
  });
  return {
    enabled: Object.prototype.hasOwnProperty.call(values, 'point.enabled') && pointBoolean(values['point.enabled']),
    rules,
    rewards,
    updatedAt: source.updatedAt,
    updatedBy: source.updatedBy,
    version: VERSION
  };
}

function validatePointSettingName(value, fallback) {
  const name = String(value == null ? '' : value).trim();
  if (!name) return String(fallback || '');
  if (name.length > 80) throw new Error('point_name_too_long');
  return name;
}

function validatePointSettingNumber(value, max, errorCode, allowZero) {
  const raw = String(value == null ? '' : value).trim();
  if (!/^\d+$/.test(raw)) throw new Error(errorCode + '_integer_required');
  const number = Number(raw);
  const min = allowZero ? 0 : 1;
  if (!isFinite(number) || number < min || number > max) throw new Error(errorCode + '_out_of_range');
  return number;
}

function findPointConfigItem(list, key, fallback) {
  const item = (Array.isArray(list) ? list : []).find(row => String(row && row.key || '') === String(key));
  return item || fallback || {};
}

function savePointProgramSettings(ss, data) {
  const payload = data && data.pointProgram ? data.pointProgram : data;
  if (!payload || typeof payload !== 'object') throw new Error('point_settings_required');
  ensurePointProgramSettings(ss);
  const current = getPointProgramSettings(ss);
  const actor = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '') || 'system';
  const now = new Date().toISOString();
  const sheet = ss.getSheetByName(SHEET_APP_SETTINGS);

  saveSettingRow(sheet, 'point.enabled', pointBoolean(payload.enabled), actor, now);
  DEFAULT_POINT_RULES.forEach(defaultRule => {
    const incoming = findPointConfigItem(payload.rules, defaultRule.key, findPointConfigItem(current.rules, defaultRule.key, defaultRule));
    saveSettingRow(sheet, pointSettingKey('rule', defaultRule.key, 'name'), validatePointSettingName(incoming.name, defaultRule.name), actor, now);
    saveSettingRow(sheet, pointSettingKey('rule', defaultRule.key, 'enabled'), pointBoolean(incoming.enabled), actor, now);
    saveSettingRow(sheet, pointSettingKey('rule', defaultRule.key, 'amount'), validatePointSettingNumber(incoming.amount, POINT_MAX_RULE_AMOUNT, 'point_rule_amount', true), actor, now);
  });
  DEFAULT_POINT_REWARDS.forEach(defaultReward => {
    const incoming = findPointConfigItem(payload.rewards, defaultReward.key, findPointConfigItem(current.rewards, defaultReward.key, defaultReward));
    saveSettingRow(sheet, pointSettingKey('reward', defaultReward.key, 'name'), validatePointSettingName(incoming.name, defaultReward.name), actor, now);
    saveSettingRow(sheet, pointSettingKey('reward', defaultReward.key, 'enabled'), pointBoolean(incoming.enabled), actor, now);
    saveSettingRow(sheet, pointSettingKey('reward', defaultReward.key, 'cost'), validatePointSettingNumber(incoming.cost, POINT_MAX_REWARD_COST, 'point_reward_cost', false), actor, now);
  });
  return getPointProgramSettings(ss);
}

function pointDateKey(value) {
  const date = value instanceof Date ? value : new Date(value || '');
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function pointWeekKey(value) {
  const key = pointDateKey(value);
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some(part => !isFinite(part))) return '';
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd');
}

function pointMonthKey(value) {
  return pointDateKey(value).slice(0, 7);
}

function pointRuleByKey(program, key) {
  return (program.rules || []).find(rule => String(rule.key) === String(key)) || null;
}

function pointRewardByKey(program, key) {
  return (program.rewards || []).find(reward => String(reward.key) === String(key)) || null;
}

function pointTransactionExists(rows, employeeId, type, sourceId) {
  return (rows || []).some(row => (
    normalizeEmployeeId(row.employeeId || '') === normalizeEmployeeId(employeeId) &&
    String(row.type || '') === String(type || '') &&
    String(row.sourceId || '') === String(sourceId || '')
  ));
}

function pointTransactionValues(transaction) {
  return [
    transaction.transactionId,
    transaction.employeeId,
    transaction.amount,
    transaction.type,
    transaction.sourceId,
    transaction.description,
    transaction.createdAt,
    transaction.createdBy,
    transaction.rewardId || '',
    transaction.metadataJson || '',
    VERSION
  ];
}

function appendPointTransaction(sheet, transaction) {
  sheet.appendRow(pointTransactionValues(transaction));
  return transaction;
}

function getEmployeePointTransactions(ss, employeeId) {
  const id = normalizeEmployeeId(employeeId);
  if (!id) return [];
  return readTable(ss.getSheetByName(SHEET_POINT_TRANSACTIONS))
    .filter(row => normalizeEmployeeId(row.employeeId || '') === id)
    .map(row => ({
      transactionId: String(row.transactionId || ''),
      employeeId: id,
      amount: Number(row.amount || 0),
      type: String(row.type || ''),
      sourceId: String(row.sourceId || ''),
      description: String(row.description || ''),
      createdAt: String(row.createdAt || ''),
      createdBy: String(row.createdBy || ''),
      rewardId: String(row.rewardId || ''),
      metadataJson: String(row.metadataJson || ''),
      version: String(row.version || VERSION)
    }))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function getPointBalanceFromRows(rows) {
  return (rows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function getPointAccountState(ss, employeeId) {
  const id = normalizeEmployeeId(employeeId);
  const program = getPointProgramSettings(ss);
  const rows = getEmployeePointTransactions(ss, id);
  const balance = getPointBalanceFromRows(rows);
  const totalEarned = rows.reduce((sum, row) => sum + Math.max(0, Number(row.amount || 0)), 0);
  const currentMonth = pointMonthKey(new Date());
  const rewards = (program.rewards || []).filter(reward => reward.enabled && reward.cost > 0).map(reward => {
    const redeemedThisMonth = rows.filter(row => (
      row.type === 'reward:' + reward.key &&
      pointMonthKey(row.createdAt) === currentMonth
    )).length;
    const monthlyLimitReached = reward.monthlyLimit > 0 && redeemedThisMonth >= reward.monthlyLimit;
    return Object.assign({}, reward, {
      redeemedThisMonth,
      monthlyLimitReached,
      canRedeem: program.enabled && balance >= reward.cost && !monthlyLimitReached
    });
  });
  return {
    enabled: program.enabled,
    balance,
    totalEarned,
    recentTransactions: rows.slice(0, 5),
    rewards,
    updatedAt: rows.length ? rows[0].createdAt : program.updatedAt,
    version: VERSION
  };
}

function grantPointForRule(ss, ruleKey, employeeId, sourceId, description, createdBy, nowValue) {
  const id = normalizeEmployeeId(employeeId);
  const source = String(sourceId || '').trim();
  if (!id) throw new Error('point_employee_required');
  if (!source) throw new Error('point_source_required');

  const program = getPointProgramSettings(ss);
  const rule = pointRuleByKey(program, ruleKey);
  if (!program.enabled) return { granted:false, skipped:true, reason:'point_program_disabled' };
  if (!rule || !rule.enabled || rule.amount <= 0) return { granted:false, skipped:true, reason:'point_rule_disabled' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const latestProgram = getPointProgramSettings(ss);
    const latestRule = pointRuleByKey(latestProgram, ruleKey);
    if (!latestProgram.enabled) return { granted:false, skipped:true, reason:'point_program_disabled' };
    if (!latestRule || !latestRule.enabled || latestRule.amount <= 0) return { granted:false, skipped:true, reason:'point_rule_disabled' };

    const sheet = ss.getSheetByName(SHEET_POINT_TRANSACTIONS);
    const type = 'earn:' + ruleKey;
    const rows = readTable(sheet);
    if (pointTransactionExists(rows, id, type, source)) {
      return { granted:false, duplicate:true, reason:'point_duplicate', type, sourceId:source };
    }
    const now = nowValue instanceof Date ? nowValue : new Date();
    const transaction = appendPointTransaction(sheet, {
      transactionId:'PT' + Utilities.getUuid().replace(/-/g, ''),
      employeeId:id,
      amount:latestRule.amount,
      type,
      sourceId:source,
      description:String(description || latestRule.name).slice(0, 200),
      createdAt:now.toISOString(),
      createdBy:String(createdBy || 'system').slice(0, 80),
      rewardId:'',
      metadataJson:JSON.stringify({ ruleKey:ruleKey }).slice(0, 1000)
    });
    try { invalidatePointCaches(id); } catch (ignoreCache) {}
    return { granted:true, transaction };
  } finally {
    lock.releaseLock();
  }
}

function recordPointSideEffectError(ss, ruleKey, employeeId, sourceId, error) {
  const message = String((error && error.message) || error || 'point_award_failed');
  try {
    saveErrorLog(ss, {
      employeeId:employeeId,
      type:'server_point',
      page:'Apps Script',
      message:message,
      source:String(ruleKey || '') + ':' + String(sourceId || ''),
      version:VERSION
    });
  } catch (ignoreErrorLog) {}
  try { writeLog(ss, 'pointAwardError', '', employeeId, 'ng', message); } catch (ignoreLog) {}
}

function safelyGrantPointForRule(ss, ruleKey, employeeId, sourceId, description, createdBy, nowValue) {
  try {
    return grantPointForRule(ss, ruleKey, employeeId, sourceId, description, createdBy, nowValue);
  } catch (error) {
    recordPointSideEffectError(ss, ruleKey, employeeId, sourceId, error);
    return { granted:false, failed:true, reason:String((error && error.message) || 'point_award_failed') };
  }
}

function awardDailyOpenPoint(ss, data, nowValue) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!id) return { granted:false, skipped:true, reason:'point_employee_required' };
  const now = nowValue instanceof Date ? nowValue : new Date();
  const day = pointDateKey(now);
  return safelyGrantPointForRule(ss, 'daily_open', id, 'open:' + day, '本日のアプリ利用', 'system', now);
}

function dailyStepGoalForUser(ss, employeeId) {
  const user = getPublicUserById(ss, normalizeEmployeeId(employeeId)) || {};
  const settings = getPublicAppSettings(ss);
  const weekly = Number(user.weeklyStepGoal || settings.defaultWeeklyStepGoal || 56000);
  return Math.max(1, Math.round(weekly / 7));
}

function weeklyStepTotal(ss, employeeId, weekKey) {
  const start = String(weekKey || '');
  const startDate = new Date(start + 'T00:00:00Z');
  if (isNaN(startDate.getTime())) return 0;
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = Utilities.formatDate(endDate, 'UTC', 'yyyy-MM-dd');
  return readTable(ss.getSheetByName(SHEET_ACTIVITIES))
    .filter(row => normalizeEmployeeId(row.participantId || '') === normalizeEmployeeId(employeeId))
    .filter(row => String(row.date || '').slice(0, 10) >= start && String(row.date || '').slice(0, 10) <= end)
    .reduce((sum, row) => sum + Number(row.steps || 0), 0);
}

function awardActivityPoints(ss, data, nowValue) {
  const id = normalizeEmployeeId(data.participantId || data.employeeId || data.id || '');
  if (!id) return [];
  const now = nowValue instanceof Date ? nowValue : new Date();
  const today = pointDateKey(now);
  const activityDate = String(data.date || '').slice(0, 10);
  if (activityDate !== today) return [{ granted:false, skipped:true, reason:'point_no_retroactive_activity' }];

  const results = [];
  results.push(safelyGrantPointForRule(ss, 'activity_sync', id, 'activity_sync:' + today, '本日の歩数同期', 'system', now));
  if (Number(data.steps || 0) >= dailyStepGoalForUser(ss, id)) {
    results.push(safelyGrantPointForRule(ss, 'daily_step_goal', id, 'daily_step_goal:' + today, '本日の歩数目標達成', 'system', now));
  }
  const week = pointWeekKey(now);
  const user = getPublicUserById(ss, id) || {};
  const settings = getPublicAppSettings(ss);
  const weeklyGoal = Number(user.weeklyStepGoal || settings.defaultWeeklyStepGoal || 56000);
  if (weeklyStepTotal(ss, id, week) >= weeklyGoal) {
    results.push(safelyGrantPointForRule(ss, 'weekly_step_goal', id, 'weekly_step_goal:' + week, '週間歩数目標達成', 'system', now));
  }
  return results;
}

function awardThanksReceivedPoint(ss, savedThanks, data, nowValue) {
  if (!savedThanks || savedThanks.type !== 'inserted') return { granted:false, skipped:true, reason:'point_thanks_not_inserted' };
  const id = normalizeEmployeeId(data.toParticipantId || '');
  const now = nowValue instanceof Date ? nowValue : new Date(savedThanks.createdAt || new Date());
  const day = pointDateKey(now);
  return safelyGrantPointForRule(ss, 'thanks_received', id, 'thanks_received:' + day, 'ありがとうを受け取りました', 'system', now);
}

function redeemPointReward(ss, data, nowValue) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  const rewardKey = String(data.rewardKey || '').trim();
  const requestId = String(data.requestId || '').trim();
  if (!id) throw new Error('point_employee_required');
  if (!rewardKey) throw new Error('point_reward_required');
  if (!requestId) throw new Error('point_request_id_required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const program = getPointProgramSettings(ss);
    if (!program.enabled) throw new Error('point_program_disabled');
    const reward = pointRewardByKey(program, rewardKey);
    if (!reward || !reward.enabled || reward.cost <= 0) throw new Error('point_reward_disabled');

    const sheet = ss.getSheetByName(SHEET_POINT_TRANSACTIONS);
    const rows = readTable(sheet);
    const type = 'reward:' + rewardKey;
    const sourceId = 'reward:' + rewardKey + ':' + requestId;
    if (pointTransactionExists(rows, id, type, sourceId)) {
      return { redeemed:false, duplicate:true, account:getPointAccountState(ss, id) };
    }
    const employeeRows = rows.filter(row => normalizeEmployeeId(row.employeeId || '') === id);
    const balance = getPointBalanceFromRows(employeeRows);
    if (balance < reward.cost) throw new Error('point_insufficient_balance');

    const now = nowValue instanceof Date ? nowValue : new Date();
    if (reward.monthlyLimit > 0) {
      const month = pointMonthKey(now);
      const redeemedThisMonth = employeeRows.filter(row => (
        String(row.type || '') === type &&
        pointMonthKey(row.createdAt) === month
      )).length;
      if (redeemedThisMonth >= reward.monthlyLimit) throw new Error('point_reward_monthly_limit');
    }

    const transaction = appendPointTransaction(sheet, {
      transactionId:'PT' + Utilities.getUuid().replace(/-/g, ''),
      employeeId:id,
      amount:-reward.cost,
      type,
      sourceId,
      description:reward.name + 'に交換',
      createdAt:now.toISOString(),
      createdBy:id,
      rewardId:rewardKey,
      metadataJson:JSON.stringify({ rewardKey:rewardKey, cost:reward.cost }).slice(0, 1000)
    });
    try { invalidatePointCaches(id); } catch (ignoreCache) {}
    return { redeemed:true, transaction, account:getPointAccountState(ss, id) };
  } finally {
    lock.releaseLock();
  }
}

function awardEventParticipationPoint(ss, data) {
  const id = normalizeEmployeeId(data.targetEmployeeId || data.employeeId || '');
  const eventId = String(data.eventId || data.sourceId || '').trim();
  if (!id) throw new Error('point_employee_required');
  if (!eventId) throw new Error('point_event_id_required');
  return grantPointForRule(
    ss,
    'event_participation',
    id,
    'event:' + eventId,
    String(data.description || 'イベント参加'),
    normalizeEmployeeId(data.employeeId || data.id || '') || 'admin',
    new Date()
  );
}

function pointStateToken(pointState) {
  if (!pointState) return '';
  const recent = (pointState.recentTransactions || []).map(row => [row.transactionId, row.amount, row.createdAt].join('@')).join(',');
  return [pointState.enabled, pointState.balance, pointState.totalEarned, recent, pointState.updatedAt].join('|');
}
