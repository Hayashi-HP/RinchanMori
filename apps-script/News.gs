/* News and flower read state */

function getUserReadState(ss, id) {
  const employeeId = normalizeEmployeeId(id || '');
  if (!employeeId) return { readNewsIds: [], readThanksFlowerIds: [] };
  const sheet = ss.getSheetByName(SHEET_USER_READS);
  const row = findRowByValue(sheet, 1, employeeId);
  if (row < 2) return { readNewsIds: [], readThanksFlowerIds: [] };
  return {
    readNewsIds: splitReadIds(sheet.getRange(row, 2).getValue()),
    readThanksFlowerIds: splitReadIds(sheet.getRange(row, 3).getValue())
  };
}

function splitReadIds(value) {
  return String(value || '').split(',').map(value => value.trim()).filter(Boolean);
}

function joinReadIds(ids) {
  return Array.from(new Set((ids || []).map(value => String(value || '').trim()).filter(Boolean))).join(',');
}

function getReadNewsIds(ss, id) {
  return getUserReadState(ss, id).readNewsIds;
}

function getReadThanksFlowerIds(ss, id) {
  return getUserReadState(ss, id).readThanksFlowerIds;
}

function markUserRead(ss, data, typeOverride) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  const type = String(typeOverride || data.type || data.readType || 'notice').trim();
  const targetId = String(data.targetId || data.newsId || data.noticeId || data.thanksId || data.flowerId || '').trim();
  if (!id) throw new Error('employee_id_required');
  if (!targetId) throw new Error('target_id_required');

  const sheet = ss.getSheetByName(SHEET_USER_READS);
  const row = findRowByValue(sheet, 1, id);
  let newsIds = [];
  let flowerIds = [];
  if (row > 0) {
    newsIds = splitReadIds(sheet.getRange(row, 2).getValue());
    flowerIds = splitReadIds(sheet.getRange(row, 3).getValue());
  }

  if (type === 'thanks' || type === 'flower' || type === 'thanksFlower') flowerIds.push(targetId);
  else newsIds.push(targetId);

  const values = [id, joinReadIds(newsIds), joinReadIds(flowerIds), new Date().toISOString(), VERSION];
  if (row > 0) sheet.getRange(row, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);

  return getUserState(ss, { employeeId: id });
}

function markNewsRead(ss, data) {
  return markUserRead(ss, data, 'notice');
}

function markThanksRead(ss, data) {
  return markUserRead(ss, data, 'thanks');
}
