/* Thanks records and public thanks timeline */

const THANKS_DAILY_SEND_LIMIT = 2;
const THANKS_RECIPIENT_COOLDOWN_DAYS = 7;

function thanksDateKey(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value || '');
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, timeZone || Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function thanksDayNumber(dateKey) {
  const parts = String(dateKey || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(part => !isFinite(part))) return NaN;
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
}

function getThanksSendStatus(ss, data, nowValue) {
  const fromId = normalizeEmployeeId(data.fromParticipantId || data.employeeId || data.id || '');
  const toId = normalizeEmployeeId(data.toParticipantId || '');
  const now = nowValue instanceof Date ? nowValue : new Date();
  const timeZone = Session.getScriptTimeZone();
  const todayKey = thanksDateKey(now, timeZone);

  if (!fromId) return { ok: false, reason: 'thanks_from_required' };
  if (!toId) return { ok: false, reason: 'thanks_to_required' };
  if (fromId === toId) return { ok: false, reason: 'thanks_self_not_allowed' };

  const sent = readTable(ss.getSheetByName(SHEET_THANKS))
    .filter(item => normalizeEmployeeId(item.fromParticipantId || '') === fromId);
  const toSameRecipient = sent
    .filter(item => normalizeEmployeeId(item.toParticipantId || '') === toId)
    .map(item => ({
      item,
      dateKey: thanksDateKey(item.savedAt || item.createdAt, timeZone)
    }))
    .filter(entry => entry.dateKey)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  if (toSameRecipient.length) {
    const lastDateKey = toSameRecipient[0].dateKey;
    const elapsedDays = thanksDayNumber(todayKey) - thanksDayNumber(lastDateKey);
    if (isFinite(elapsedDays) && elapsedDays < THANKS_RECIPIENT_COOLDOWN_DAYS) {
      const retryAfterDays = Math.max(1, THANKS_RECIPIENT_COOLDOWN_DAYS - elapsedDays);
      const nextDate = new Date(Date.UTC(
        Number(lastDateKey.slice(0, 4)),
        Number(lastDateKey.slice(5, 7)) - 1,
        Number(lastDateKey.slice(8, 10)) + THANKS_RECIPIENT_COOLDOWN_DAYS
      ));
      return {
        ok: false,
        reason: 'thanks_recipient_cooldown',
        sentToday: elapsedDays === 0,
        retryAfterDays,
        nextAvailableDate: Utilities.formatDate(nextDate, 'UTC', 'yyyy-MM-dd')
      };
    }
  }

  const todayCount = sent.filter(item => {
    return thanksDateKey(item.savedAt || item.createdAt, timeZone) === todayKey;
  }).length;
  if (todayCount >= THANKS_DAILY_SEND_LIMIT) {
    return {
      ok: false,
      reason: 'thanks_daily_limit',
      todayCount,
      dailyLimit: THANKS_DAILY_SEND_LIMIT,
      dailyRemaining: 0
    };
  }

  return {
    ok: true,
    reason: '',
    todayCount,
    dailyLimit: THANKS_DAILY_SEND_LIMIT,
    dailyRemaining: THANKS_DAILY_SEND_LIMIT - todayCount
  };
}

function saveThanks(ss, data) {
  const sheet = ss.getSheetByName(SHEET_THANKS);
  const thanksId = String(data.thanksId || 'K' + Date.now().toString(36)).trim();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const row = findRowByValue(sheet, 1, thanksId);
    if (row > 0) {
      return { type: 'duplicate', row, thanksId };
    }

    const now = new Date();
    const status = getThanksSendStatus(ss, data, now);
    if (!status.ok) {
      const error = new Error(status.reason);
      error.details = status;
      throw error;
    }
    const nowIso = now.toISOString();
    const values = [
      thanksId,
      normalizeEmployeeId(data.fromParticipantId || data.employeeId || data.id || ''),
      data.fromName || '',
      normalizeEmployeeId(data.toParticipantId || ''),
      data.toName || '',
      data.toDept || '',
      data.reason || 'ありがとう',
      nowIso,
      data.version || data.appVersion || VERSION,
      nowIso
    ];

    sheet.appendRow(values);
    return {
      type: 'inserted',
      row: sheet.getLastRow(),
      thanksId,
      createdAt: nowIso,
      sendStatus: Object.assign({}, status, {
        todayCount: status.todayCount + 1,
        dailyRemaining: Math.max(0, status.dailyRemaining - 1)
      })
    };
  } finally {
    lock.releaseLock();
  }
}

function getMyThanks(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.toParticipantId || '');
  if (!id) return [];

  return readTable(ss.getSheetByName(SHEET_THANKS))
    .filter(item => normalizeEmployeeId(item.toParticipantId || '') === id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 50);
}

function getMySentThanks(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.fromParticipantId || '');
  if (!id) return [];

  return readTable(ss.getSheetByName(SHEET_THANKS))
    .filter(item => normalizeEmployeeId(item.fromParticipantId || '') === id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 50);
}

function getMyThanksStats(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || '');
  const sent = getMySentThanks(ss, { employeeId: id });
  const received = getMyThanks(ss, { employeeId: id });

  return {
    sentCount: sent.length,
    receivedCount: received.length,
    totalCount: sent.length + received.length
  };
}

function getPublicThanksTimeline(ss) {
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const byId = {};

  users.forEach(user => {
    const id = normalizeEmployeeId(user.employeeId || user.id || '');
    if (id) byId[id] = user;
  });

  return readTable(ss.getSheetByName(SHEET_THANKS))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 50)
    .map(item => {
      const fromUser = byId[normalizeEmployeeId(item.fromParticipantId || '')] || {};
      const fromDept = fromUser.dept || '杜の仲間';
      const toDept = item.toDept || '杜の仲間';
      const reason = item.reason || 'ありがとう';
      const detail = reason && reason !== 'ありがとう'
        ? '「' + reason + '」のありがとうを届けました。'
        : 'ありがとうを届けました。';

      return {
        id: String(item.thanksId || ''),
        icon: '❤️',
        title: 'ありがとうが届けられました',
        body: fromDept + 'の仲間が、' + toDept + 'の仲間に' + detail,
        publicBody: fromDept + 'の仲間が、' + toDept + 'の仲間に' + detail,
        fromDept,
        toDept,
        targetDept: toDept,
        reason,
        createdAt: String(item.createdAt || '')
      };
    });
}
