const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createRuntime(initialRows) {
  const rows = (initialRows || []).map(row => ({ ...row }));
  const sheet = {
    rows,
    appended: [],
    appendRow(values) {
      this.appended.push(values);
      this.rows.push({
        thanksId: values[0],
        fromParticipantId: values[1],
        fromName: values[2],
        toParticipantId: values[3],
        toName: values[4],
        toDept: values[5],
        reason: values[6],
        createdAt: values[7],
        version: values[8],
        savedAt: values[9]
      });
    },
    getLastRow() {
      return this.rows.length + 1;
    }
  };
  const context = {
    console,
    Date,
    Error,
    Math,
    Object,
    isFinite,
    SHEET_THANKS: 'thanks',
    VERSION: 'test',
    Utilities: {
      formatDate(date, timeZone) {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: timeZone === 'UTC' ? 'UTC' : 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(date).reduce((map, part) => {
          map[part.type] = part.value;
          return map;
        }, {});
        return `${parts.year}-${parts.month}-${parts.day}`;
      }
    },
    Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
    LockService: {
      getScriptLock: () => ({ waitLock() {}, releaseLock() {} })
    },
    normalizeEmployeeId: value => String(value || '').trim(),
    readTable: target => target.rows,
    findRowByValue(target, column, value) {
      const index = target.rows.findIndex(row => String(row.thanksId || '') === String(value));
      return index < 0 ? -1 : index + 2;
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('apps-script/Thanks.gs', 'utf8'), context);
  return { context, sheet, ss: { getSheetByName: () => sheet } };
}

function record(from, to, date, id) {
  return {
    thanksId: id || `${from}-${to}-${date}`,
    fromParticipantId: from,
    toParticipantId: to,
    createdAt: `${date}T03:00:00.000Z`,
    savedAt: `${date}T03:00:00.000Z`
  };
}

{
  const { context, ss } = createRuntime();
  const status = context.getThanksSendStatus(
    ss,
    { fromParticipantId: 'A', toParticipantId: 'A' },
    new Date('2026-07-23T03:00:00.000Z')
  );
  assert.equal(status.reason, 'thanks_self_not_allowed');
}

{
  const { context, ss } = createRuntime([
    record('A', 'B', '2026-07-23'),
    record('A', 'C', '2026-07-23')
  ]);
  const status = context.getThanksSendStatus(
    ss,
    { fromParticipantId: 'A', toParticipantId: 'D' },
    new Date('2026-07-23T06:00:00.000Z')
  );
  assert.equal(status.reason, 'thanks_daily_limit');
}

{
  const { context, ss } = createRuntime([record('A', 'B', '2026-07-21')]);
  const status = context.getThanksSendStatus(
    ss,
    { fromParticipantId: 'A', toParticipantId: 'B' },
    new Date('2026-07-23T03:00:00.000Z')
  );
  assert.equal(status.reason, 'thanks_recipient_cooldown');
  assert.equal(status.retryAfterDays, 5);
}

{
  const { context, ss } = createRuntime([record('A', 'B', '2026-07-16')]);
  const status = context.getThanksSendStatus(
    ss,
    { fromParticipantId: 'A', toParticipantId: 'B' },
    new Date('2026-07-23T03:00:00.000Z')
  );
  assert.equal(status.ok, true);
}

{
  const { context, ss, sheet } = createRuntime();
  const saved = context.saveThanks(ss, {
    thanksId: 'new-thanks',
    fromParticipantId: 'A',
    toParticipantId: 'B'
  });
  assert.equal(saved.type, 'inserted');
  assert.equal(sheet.appended.length, 1);

  const duplicate = context.saveThanks(ss, {
    thanksId: 'new-thanks',
    fromParticipantId: 'A',
    toParticipantId: 'B'
  });
  assert.equal(duplicate.type, 'duplicate');
  assert.equal(sheet.appended.length, 1);
}

console.log('thanks rules: ok');
