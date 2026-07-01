/* Thanks records and public thanks timeline */

function saveThanks(ss, data) {
  const sheet = ss.getSheetByName(SHEET_THANKS);
  const thanksId = String(data.thanksId || 'K' + Date.now().toString(36)).trim();
  const row = findRowByValue(sheet, 1, thanksId);
  const now = new Date().toISOString();

  const values = [
    thanksId,
    data.fromParticipantId || '',
    data.fromName || '',
    data.toParticipantId || '',
    data.toName || '',
    data.toDept || '',
    data.reason || 'ありがとう',
    data.createdAt || now,
    data.version || data.appVersion || VERSION,
    now
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row, thanksId };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), thanksId };
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
