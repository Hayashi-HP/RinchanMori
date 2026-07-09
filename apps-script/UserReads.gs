/* User read-state management */

function getUserReadState(ss, employeeId) {
  const id = normalizeEmployeeId(employeeId || '');
  if (!id) return { employeeId: '', readNewsIds: [], readThanksFlowerIds: [], updatedAt: '', version: VERSION };

  const sheet = ss.getSheetByName(SHEET_USER_READS);
  if (!sheet) return { employeeId: id, readNewsIds: [], readThanksFlowerIds: [], updatedAt: '', version: VERSION };

  const row = findRowByValue(sheet, 1, id);
  if (row < 2) return { employeeId: id, readNewsIds: [], readThanksFlowerIds: [], updatedAt: '', version: VERSION };

  const data = rowToObject(sheet, row);
  return {
    employeeId: id,
    readNewsIds: parseIdList(data.readNewsIds),
    readThanksFlowerIds: parseIdList(data.readThanksFlowerIds),
    updatedAt: String(data.updatedAt || ''),
    version: String(data.version || VERSION)
  };
}

function markUserRead(ss, data) {
  const type = String(data.type || '').trim();
  if (type === 'news') return markNewsRead(ss, data);
  if (type === 'thanks' || type === 'flower' || type === 'thanksFlower') return markThanksRead(ss, data);

  const targetId = String(data.targetId || data.newsId || data.noticeId || data.thanksId || data.flowerId || '').trim();
  if (targetId && String(targetId).indexOf('rinchan-daily-') === 0) return markNewsRead(ss, Object.assign({}, data, { newsId: targetId }));
  if (targetId) return markNewsRead(ss, Object.assign({}, data, { newsId: targetId }));

  return getUserState(ss, { employeeId: readEmployeeIdFromReadRequest(data) });
}

function markNewsRead(ss, data) {
  const employeeId = readEmployeeIdFromReadRequest(data);
  if (!employeeId) throw new Error('employee_id_required');

  const current = getUserReadState(ss, employeeId);
  const incoming = parseIdList(data.readNewsIds);
  const target = String(data.newsId || data.noticeId || data.targetId || '').trim();
  const nextNewsIds = uniqueIds(current.readNewsIds.concat(incoming).concat(target ? [target] : []));

  saveUserReadState(ss, employeeId, nextNewsIds, current.readThanksFlowerIds);
  return getUserState(ss, { employeeId: employeeId });
}

function markThanksRead(ss, data) {
  const employeeId = readEmployeeIdFromReadRequest(data);
  if (!employeeId) throw new Error('employee_id_required');

  const current = getUserReadState(ss, employeeId);
  const incoming = parseIdList(data.readThanksFlowerIds);
  const target = String(data.thanksId || data.flowerId || data.targetId || '').trim();
  const nextFlowerIds = uniqueIds(current.readThanksFlowerIds.concat(incoming).concat(target ? [target] : []));

  saveUserReadState(ss, employeeId, current.readNewsIds, nextFlowerIds);
  return getUserState(ss, { employeeId: employeeId });
}

function saveUserReadState(ss, employeeId, readNewsIds, readThanksFlowerIds) {
  const id = normalizeEmployeeId(employeeId || '');
  if (!id) throw new Error('employee_id_required');

  const sheet = ss.getSheetByName(SHEET_USER_READS) || ensureSheet(ss, SHEET_USER_READS, ['employeeId', 'readNewsIds', 'readThanksFlowerIds', 'updatedAt', 'version']);
  const row = findRowByValue(sheet, 1, id);
  const values = [
    id,
    uniqueIds(readNewsIds).join(','),
    uniqueIds(readThanksFlowerIds).join(','),
    new Date().toISOString(),
    VERSION
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return { type: 'updated', row: row, employeeId: id };
  }

  sheet.appendRow(values);
  return { type: 'inserted', row: sheet.getLastRow(), employeeId: id };
}

function readEmployeeIdFromReadRequest(data) {
  return normalizeEmployeeId(data.employeeId || data.id || data.participantId || data.toParticipantId || data.fromParticipantId || '');
}

function parseIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return uniqueIds(value);
  const text = String(value || '').trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return uniqueIds(parsed);
  } catch (ignore) {}

  return uniqueIds(text.split(/[\n,、\s]+/));
}

function uniqueIds(list) {
  const map = {};
  const result = [];
  (Array.isArray(list) ? list : []).forEach(value => {
    const id = String(value || '').trim();
    if (!id || map[id]) return;
    map[id] = true;
    result.push(id);
  });
  return result;
}
