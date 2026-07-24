const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createSheet(name) {
  return {
    name,
    rows: [],
    appendRow(values) {
      if (name === 'app_settings') {
        this.rows.push({
          settingKey:values[0], value:values[1], updatedAt:values[2],
          updatedBy:values[3], version:values[4]
        });
        return;
      }
      this.rows.push({
        transactionId:values[0], employeeId:values[1], amount:values[2],
        type:values[3], sourceId:values[4], description:values[5],
        createdAt:values[6], createdBy:values[7], rewardId:values[8],
        metadataJson:values[9], version:values[10], inputSource:values[11],
        relatedRecordId:values[12]
      });
    },
    getLastRow() { return this.rows.length + 1; },
    getRange(row) {
      return {
        setValues: values => {
          const value = values[0];
          if (name === 'app_settings') {
            this.rows[row - 2] = {
              settingKey:value[0], value:value[1], updatedAt:value[2],
              updatedBy:value[3], version:value[4]
            };
          }
        }
      };
    }
  };
}

function createRuntime() {
  const settings = createSheet('app_settings');
  const transactions = createSheet('point_transactions');
  const activities = { name:'activities', rows:[] };
  let user = { employeeId:'A', weeklyStepGoal:56000, dailyStepGoal:'' };
  let appSettings = {
    defaultWeeklyStepGoal:56000,
    commonDailyStepGoalEnabled:false,
    commonDailyStepGoal:8000,
    preferPersonalDailyStepGoal:true,
    commonDailyStepGoalOnlyWhenUnset:true
  };
  let uuid = 0;
  const context = {
    console, Date, Error, Math, Object, Array, String, Number, JSON, isFinite,
    SHEET_APP_SETTINGS:'app_settings',
    SHEET_POINT_TRANSACTIONS:'point_transactions',
    SHEET_ACTIVITIES:'activities',
    VERSION:'test',
    Utilities:{
      getUuid:() => `uuid-${++uuid}`,
      formatDate(date, zone) {
        const timeZone = zone === 'UTC' ? 'UTC' : 'Asia/Tokyo';
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone, year:'numeric', month:'2-digit', day:'2-digit'
        }).formatToParts(date).reduce((map, part) => {
          map[part.type] = part.value;
          return map;
        }, {});
        return `${parts.year}-${parts.month}-${parts.day}`;
      }
    },
    Session:{ getScriptTimeZone:() => 'Asia/Tokyo' },
    LockService:{ getScriptLock:() => ({ waitLock() {}, releaseLock() {} }) },
    normalizeEmployeeId:value => String(value || '').trim(),
    ensureAppSettingsSheet:() => settings,
    readTable:sheet => sheet ? sheet.rows.map(row => ({ ...row })) : [],
    saveSettingRow(sheet, key, value, actor, now) {
      const index = sheet.rows.findIndex(row => row.settingKey === key);
      const next = { settingKey:key, value, updatedAt:now, updatedBy:actor, version:'test' };
      if (index >= 0) sheet.rows[index] = next;
      else sheet.rows.push(next);
    },
    invalidatePointCaches() {},
    saveErrorLog() {},
    writeLog() {},
    normalizeActivityInputSource:data => String(data.inputSource || 'manual'),
    getPublicUserById:(unused, id) => String(id || '') === String(user.employeeId || '') ? { ...user } : null,
    getPublicAppSettings:() => ({ ...appSettings })
  };
  const ss = {
    getSheetByName(name) {
      if (name === 'app_settings') return settings;
      if (name === 'point_transactions') return transactions;
      if (name === 'activities') return activities;
      return null;
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('apps-script/Point.gs', 'utf8'), context);
  context.defaultPointSettingRows().forEach(item => {
    settings.appendRow([item.key, item.value, '2026-07-01T00:00:00.000Z', 'system', 'test']);
  });
  function setSetting(key, value) {
    const row = settings.rows.find(item => item.settingKey === key);
    if (row) row.value = value;
    else settings.rows.push({ settingKey:key, value, updatedAt:new Date().toISOString(), updatedBy:'test', version:'test' });
  }
  return {
    context, ss, settings, transactions, activities, setSetting,
    setUser(next) { user = { ...user, ...next }; },
    setAppSettings(next) { appSettings = { ...appSettings, ...next }; }
  };
}

function addEarn(context, sheet, employeeId, amount, sourceId, date) {
  context.appendPointTransaction(sheet, {
    transactionId:'seed-' + sourceId,
    employeeId,
    amount,
    type:'earn:test',
    sourceId,
    description:'seed',
    createdAt:date || '2026-07-23T03:00:00.000Z',
    createdBy:'test',
    rewardId:'',
    metadataJson:''
  });
}

{
  const { context, ss, setSetting, transactions } = createRuntime();
  setSetting('point.enabled', false);
  const result = context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(result.reason, 'point_program_disabled');
  assert.equal(transactions.rows.length, 0);
}

{
  const { context, ss, setSetting, transactions } = createRuntime();
  setSetting('point.rule.daily_open.enabled', false);
  const result = context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(result.reason, 'point_rule_disabled');
  assert.equal(transactions.rows.length, 0);
}

{
  const { context, ss, setSetting } = createRuntime();
  setSetting('point.rule.daily_open.amount', 7);
  const first = context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-23T03:00:00.000Z'));
  const duplicate = context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-23T06:00:00.000Z'));
  assert.equal(first.transaction.amount, 7);
  assert.equal(duplicate.duplicate, true);
  assert.equal(context.getPointAccountState(ss, 'A').balance, 7);
}

{
  const { context, ss } = createRuntime();
  const first = context.grantPointForRule(ss, 'weekly_step_goal', 'A', 'weekly_step_goal:2026-07-20', '週間達成', 'system');
  const duplicate = context.grantPointForRule(ss, 'weekly_step_goal', 'A', 'weekly_step_goal:2026-07-20', '週間達成', 'system');
  assert.equal(first.granted, true);
  assert.equal(duplicate.duplicate, true);
}

{
  const { context, ss } = createRuntime();
  const first = context.awardThanksReceivedPoint(
    ss,
    { type:'inserted', thanksId:'T1', createdAt:'2026-07-23T03:00:00.000Z' },
    { toParticipantId:'A' }
  );
  const second = context.awardThanksReceivedPoint(
    ss,
    { type:'inserted', thanksId:'T2', createdAt:'2026-07-23T08:00:00.000Z' },
    { toParticipantId:'A' }
  );
  assert.equal(first.granted, true);
  assert.equal(second.duplicate, true);
  assert.equal(context.getPointAccountState(ss, 'A').balance, 50);
}

{
  const { context, ss, setSetting, transactions } = createRuntime();
  setSetting('point.enabled', false);
  context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-22T03:00:00.000Z'));
  setSetting('point.enabled', true);
  context.awardDailyOpenPoint(ss, { employeeId:'A' }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(transactions.rows.length, 1);
  assert.equal(transactions.rows[0].sourceId, 'daily_checkin:A:2026-07-23');
}

{
  const { context, ss, setSetting } = createRuntime();
  setSetting('point.reward.limited_badge.name', '限定バッジ（りん杜サポーター）');
  setSetting('point.reward.rin_cafe.name', 'りんカフェ');
  let program = context.getPointProgramSettings(ss);
  assert.equal(program.rewards.find(item => item.key === 'limited_badge').name, '限定バッジ（Hサポーター）');
  assert.equal(program.rewards.find(item => item.key === 'rin_cafe').name, 'Hカフェ');
  setSetting('point.reward.rin_cafe.name', '職員交流カフェ');
  program = context.getPointProgramSettings(ss);
  assert.equal(program.rewards.find(item => item.key === 'rin_cafe').name, '職員交流カフェ');
}

{
  const { context, ss, transactions } = createRuntime();
  addEarn(context, transactions, 'A', 499, 'below');
  assert.throws(
    () => context.redeemPointReward(ss, { employeeId:'A', rewardKey:'rin_cafe', requestId:'one' }, new Date('2026-07-23T03:00:00.000Z')),
    /point_insufficient_balance/
  );
  addEarn(context, transactions, 'A', 101, 'above');
  const redeemed = context.redeemPointReward(
    ss,
    { employeeId:'A', rewardKey:'rin_cafe', requestId:'two' },
    new Date('2026-07-23T03:00:00.000Z')
  );
  assert.equal(redeemed.redeemed, true);
  const account = context.getPointAccountState(ss, 'A');
  assert.equal(account.balance, 100);
  assert.equal(account.totalEarned, 600);
}

{
  const { context, ss, transactions } = createRuntime();
  addEarn(context, transactions, 'A', 1200, 'monthly');
  context.redeemPointReward(
    ss,
    { employeeId:'A', rewardKey:'rin_cafe', requestId:'first' },
    new Date('2026-07-02T03:00:00.000Z')
  );
  assert.throws(
    () => context.redeemPointReward(ss, { employeeId:'A', rewardKey:'rin_cafe', requestId:'second' }, new Date('2026-07-20T03:00:00.000Z')),
    /point_reward_monthly_limit/
  );
  const nextMonth = context.redeemPointReward(
    ss,
    { employeeId:'A', rewardKey:'rin_cafe', requestId:'third' },
    new Date('2026-08-03T03:00:00.000Z')
  );
  assert.equal(nextMonth.redeemed, true);
}

{
  const { context, ss, transactions, setSetting } = createRuntime();
  addEarn(context, transactions, 'A', 250, 'limited-badge');
  const redeemed = context.redeemPointReward(
    ss,
    { employeeId:'A', rewardKey:'limited_badge', requestId:'badge-first' },
    new Date('2026-07-23T03:00:00.000Z')
  );
  assert.equal(redeemed.redeemed, true);
  assert.deepEqual(Array.from(redeemed.account.ownedBadgeIds), ['point_limited_100']);
  assert.equal(redeemed.account.rewards.find(item => item.key === 'limited_badge').lifetimeLimitReached, true);
  assert.throws(
    () => context.redeemPointReward(
      ss,
      { employeeId:'A', rewardKey:'limited_badge', requestId:'badge-second' },
      new Date('2026-07-24T03:00:00.000Z')
    ),
    /point_reward_lifetime_limit/
  );
  setSetting('point.reward.limited_badge.enabled', false);
  assert.deepEqual(Array.from(context.getPointAccountState(ss, 'A').ownedBadgeIds), ['point_limited_100']);
}

{
  const { context, ss, transactions } = createRuntime();
  const beforeMidnight = context.awardDailyCheckinPoint(ss, { employeeId:'A' }, new Date('2026-07-23T14:59:59.000Z'));
  const sameDayOtherDevice = context.awardDailyCheckinPoint(ss, { employeeId:'A', deviceId:'other' }, new Date('2026-07-23T14:59:59.500Z'));
  const nextTokyoDay = context.awardDailyCheckinPoint(ss, { employeeId:'A' }, new Date('2026-07-23T15:00:00.000Z'));
  assert.equal(beforeMidnight.granted, true);
  assert.equal(sameDayOtherDevice.duplicate, true);
  assert.equal(nextTokyoDay.granted, true);
  assert.deepEqual(transactions.rows.map(row => row.sourceId), [
    'daily_checkin:A:2026-07-23',
    'daily_checkin:A:2026-07-24'
  ]);
}

{
  const { context, ss, transactions } = createRuntime();
  const first = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:4200,
    inputSource:'shortcut', relatedRecordId:'ACT1'
  }, new Date('2026-07-23T03:00:00.000Z'));
  const second = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:7500,
    inputSource:'manual', relatedRecordId:'ACT1'
  }, new Date('2026-07-23T08:00:00.000Z'));
  assert.equal(first[0].granted, true);
  assert.equal(second[0].duplicate, true);
  assert.equal(transactions.rows.filter(row => row.type === 'earn:activity_sync').length, 1);
  assert.equal(transactions.rows[0].sourceId, 'step_sync:A:2026-07-23');
  assert.equal(transactions.rows[0].inputSource, 'shortcut');
  assert.equal(transactions.rows[0].relatedRecordId, 'ACT1');
}

{
  const { context, ss, transactions } = createRuntime();
  const zero = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:0
  }, new Date('2026-07-23T03:00:00.000Z'));
  const invalid = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:'abc'
  }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(zero[0].reason, 'point_invalid_steps');
  assert.equal(invalid[0].reason, 'point_invalid_steps');
  assert.equal(transactions.rows.length, 0);
}

{
  const invalidGoals = ['', null, undefined, 0, -1, 'abc', 1000.5, 100001];
  invalidGoals.forEach(goal => {
    const runtime = createRuntime();
    runtime.setUser({ dailyStepGoal:goal });
    const result = runtime.context.awardActivityPoints(runtime.ss, {
      employeeId:'A', date:'2026-07-23', savedSteps:50000
    }, new Date('2026-07-23T03:00:00.000Z'));
    assert.equal(result.some(row => row.transaction && row.transaction.type === 'earn:daily_step_goal'), false);
  });
}

{
  const { context, ss, transactions, setUser } = createRuntime();
  setUser({ dailyStepGoal:8000 });
  const below = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:7999, inputSource:'shortcut'
  }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(below.some(row => row.transaction && row.transaction.type === 'earn:daily_step_goal'), false);
  const reached = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:8000, inputSource:'manual'
  }, new Date('2026-07-23T04:00:00.000Z'));
  const duplicate = context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:9000, inputSource:'shortcut'
  }, new Date('2026-07-23T05:00:00.000Z'));
  assert.equal(reached.some(row => row.transaction && row.transaction.type === 'earn:daily_step_goal'), true);
  assert.equal(duplicate.some(row => row.duplicate && row.type === 'earn:daily_step_goal'), true);
  assert.equal(transactions.rows.filter(row => row.type === 'earn:daily_step_goal').length, 1);
  assert.equal(transactions.rows.find(row => row.type === 'earn:daily_step_goal').sourceId, 'daily_goal:A:2026-07-23');
}

{
  const { context, ss, transactions, setUser, setAppSettings } = createRuntime();
  setUser({ dailyStepGoal:'' });
  setAppSettings({ commonDailyStepGoalEnabled:false, commonDailyStepGoal:1000 });
  context.awardActivityPoints(ss, {
    employeeId:'A', date:'2026-07-23', savedSteps:10000
  }, new Date('2026-07-23T03:00:00.000Z'));
  assert.equal(transactions.rows.some(row => row.type === 'earn:daily_step_goal'), false);
}

{
  const { context, ss, setUser, setAppSettings } = createRuntime();
  setUser({ dailyStepGoal:'' });
  setAppSettings({ commonDailyStepGoalEnabled:true, commonDailyStepGoal:8000 });
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.dailyStepGoalForUser(ss, 'A'))),
    { hasValidGoal:true, goal:8000, source:'common' }
  );
  setUser({ dailyStepGoal:6000 });
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.dailyStepGoalForUser(ss, 'A'))),
    { hasValidGoal:true, goal:6000, source:'personal' }
  );
  setAppSettings({ preferPersonalDailyStepGoal:false, commonDailyStepGoalOnlyWhenUnset:false });
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.dailyStepGoalForUser(ss, 'A'))),
    { hasValidGoal:true, goal:8000, source:'common' }
  );
}

{
  const { context } = createRuntime();
  assert.equal(context.validDailyStepGoal(1000), 1000);
  assert.equal(context.validDailyStepGoal(100000), 100000);
  assert.equal(context.validDailyStepGoal(999), null);
  assert.equal(context.validDailyStepGoal(100001), null);
}

{
  const { context, ss, activities } = createRuntime();
  activities.rows.push(
    { participantId:'A', date:'2026-07-20', steps:4000 },
    { participantId:'A', date:'2026-07-20', steps:6500 },
    { participantId:'A', date:'2026-07-21', steps:7000 }
  );
  assert.equal(context.savedStepsForDay(ss, 'A', '2026-07-20'), 6500);
  assert.equal(context.weeklyStepTotal(ss, 'A', '2026-07-20'), 13500);
}

console.log('point program: ok');
