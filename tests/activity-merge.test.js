const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createSheet() {
  return {
    rows: [],
    appendRow(values) {
      this.rows.push({
        activityId:values[0], participantId:values[1], deviceId:values[2],
        date:values[3], steps:values[4], challenge:values[5], comment:values[6],
        createdAt:values[7], version:values[8], savedAt:values[9]
      });
    },
    getLastRow() { return this.rows.length + 1; },
    getRange(row) {
      return {
        setValues: values => {
          const value = values[0];
          this.rows[row - 2] = {
            activityId:value[0], participantId:value[1], deviceId:value[2],
            date:value[3], steps:value[4], challenge:value[5], comment:value[6],
            createdAt:value[7], version:value[8], savedAt:value[9]
          };
        }
      };
    }
  };
}

function runtime() {
  const sheet = createSheet();
  const context = {
    Date, Error, String, Number, Boolean, Array, Math, isFinite,
    VERSION:'test',
    SHEET_ACTIVITIES:'activities',
    LockService:{ getScriptLock:() => ({ waitLock() {}, releaseLock() {} }) },
    normalizeEmployeeId:value => String(value || '').trim(),
    readTable:source => source.rows.map(row => ({ ...row })),
    findRowByValue() { return -1; }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('apps-script/Activity.gs', 'utf8'), context);
  return {
    context,
    sheet,
    ss:{ getSheetByName:() => sheet }
  };
}

{
  const { context, ss, sheet } = runtime();
  const first = context.saveActivity(ss, {
    activityId:'shortcut-1', participantId:'A', deviceId:'iphone-health',
    date:'2026-07-24', steps:4200, inputSource:'shortcut'
  });
  const second = context.saveActivity(ss, {
    activityId:'manual-1', participantId:'A', deviceId:'D1',
    date:'2026-07-24', steps:7500, inputSource:'manual'
  });
  const lowerRetry = context.saveActivity(ss, {
    activityId:'shortcut-2', participantId:'A', deviceId:'iphone-health',
    date:'2026-07-24', steps:6000, inputSource:'shortcut'
  });
  assert.equal(first.savedSteps, 4200);
  assert.equal(second.savedSteps, 7500);
  assert.equal(lowerRetry.savedSteps, 7500);
  assert.equal(sheet.rows.length, 1);
  assert.equal(sheet.rows[0].steps, 7500);
  assert.equal(sheet.rows[0].deviceId, 'D1');
}

{
  const { context, ss, sheet } = runtime();
  context.saveActivity(ss, {
    activityId:'A1', participantId:'A', deviceId:'D1',
    date:'2026-07-24', steps:7500, inputSource:'manual'
  });
  const corrected = context.saveActivity(ss, {
    activityId:'A1', participantId:'A', deviceId:'D1',
    date:'2026-07-24', steps:5000, inputSource:'manual', correctionMode:true
  });
  assert.equal(corrected.correctionMode, true);
  assert.equal(corrected.savedSteps, 5000);
  assert.equal(sheet.rows[0].steps, 5000);
}

{
  const { context, ss, sheet } = runtime();
  assert.throws(() => context.saveActivity(ss, {
    activityId:'bad', participantId:'A', date:'2026-07-24', steps:'abc'
  }), /activity_steps_integer_required/);
  assert.throws(() => context.saveActivity(ss, {
    activityId:'bad', participantId:'A', date:'2026-07-24', steps:200001
  }), /activity_steps_out_of_range/);
  assert.equal(sheet.rows.length, 0);
}

console.log('activity merge: ok');
