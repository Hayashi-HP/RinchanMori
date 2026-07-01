/* News read state */

function getReadNewsIds(ss, id) {
  if (!id) return [];

  const sheet = ss.getSheetByName(SHEET_USER_READS);
  const row = findRowByValue(sheet, 1, id);
  if (row < 2) return [];

  const raw = String(sheet.getRange(row, 2).getValue() || '');
  return raw.split(',').map(value => value.trim()).filter(Boolean);
}

function markNewsRead(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  const newsId = String(data.newsId || data.noticeId || '').trim();

  if (!id) throw new Error('employee_id_required');
  if (!newsId) throw new Error('news_id_required');

  const sheet = ss.getSheetByName(SHEET_USER_READS);
  const row = findRowByValue(sheet, 1, id);
  const current = row > 0 ? String(sheet.getRange(row, 2).getValue() || '') : '';
  const ids = Array.from(new Set(
    current.split(',').map(value => value.trim()).filter(Boolean).concat([newsId])
  ));
  const values = [id, ids.join(','), new Date().toISOString(), VERSION];

  if (row > 0) sheet.getRange(row, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);

  return getUserState(ss, { employeeId: id });
}
