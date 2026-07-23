/* Annual event overrides and custom events */

const EVENT_TYPE_OVERRIDE = 'override';
const EVENT_TYPE_CUSTOM = 'custom';

const DEFAULT_ANNUAL_EVENTS = [
  ['newyear', 1, 1, 31, '🎍', '初日の出ウォーク', '新しい一年のはじまり。みんなの歩みで、今年の杜も少しずつ育ちます。'],
  ['setsubun', 2, 1, 28, '👹', '節分ウォーク', '一歩ごとに福豆を集めて、杜の鬼を追い払いましょう。'],
  ['sakura', 3, 1, 31, '🌸', '桜のつぼみチャレンジ', '歩いた分だけ桜のつぼみが開き、春の杜が色づきます。'],
  ['newseason', 4, 1, 30, '🌱', '新年度スタートウォーク', '新しい年度の一歩を、りんちゃんの杜から始めましょう。'],
  ['freshgreen', 5, 1, 31, '🍃', '新緑ウォーク', 'みんなの歩みで、杜いっぱいに新しい緑を増やしましょう。'],
  ['rainy', 6, 1, 30, '☔', '雨の日チャレンジ', '雨の日も無理をせず、できる範囲の一歩を積み重ねましょう。'],
  ['tanabata', 7, 1, 31, '🎋', '七夕の杜', '今日は七夕。みんなの願いが星空へ届きますように。'],
  ['summer', 8, 1, 31, '🎆', 'りんちゃん夏祭り', '夏の夜を、提灯とやわらかな花火でそっと彩ります。'],
  ['moon', 9, 1, 30, '🌕', 'お月見の杜', '大きな月とすすきが、秋の夜をやさしく照らします。'],
  ['halloween', 10, 1, 31, '🎃', 'ハロウィンウォーク', '杜のどこかに隠れた仲間を探しながら、お菓子を集めましょう。'],
  ['harvest', 11, 1, 30, '🍠', '秋の大収穫祭', 'みんなの歩みで、杜に秋の実りを増やしましょう。'],
  ['christmas', 12, 1, 31, '🎄', 'クリスマスウォーク', '一歩ごとに飾りが増え、杜のクリスマスツリーが完成していきます。']
];

function currentEventYear() {
  return Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy'));
}

function normalizeEventYear(value) {
  const year = Number(String(value === undefined || value === null ? '' : value).trim());
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : 0;
}

function normalizeEventDate(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const raw = String(value === undefined || value === null ? '' : value).trim();
  const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s.*)?$/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return '';
  return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function parseEventActive(value) {
  if (value === true || value === 1) return true;
  const raw = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'active' || raw === 'published';
}

function defaultAnnualEvent(row, year) {
  return {
    eventId: '',
    year,
    eventType: EVENT_TYPE_OVERRIDE,
    baseKey: String(row[0]),
    key: String(row[0]),
    icon: String(row[4]),
    title: String(row[5]),
    startDate: year + '-' + String(row[1]).padStart(2, '0') + '-' + String(row[2]).padStart(2, '0'),
    endDate: year + '-' + String(row[1]).padStart(2, '0') + '-' + String(row[3]).padStart(2, '0'),
    text: String(row[6]),
    active: true,
    source: 'standard',
    updatedAt: ''
  };
}

function eventPublicRow(row) {
  return {
    eventId: String(row.eventId || ''),
    year: normalizeEventYear(row.year),
    eventType: String(row.eventType || ''),
    baseKey: String(row.baseKey || ''),
    key: String(row.key || ''),
    icon: String(row.icon || ''),
    title: String(row.title || ''),
    startDate: normalizeEventDate(row.startDate),
    endDate: normalizeEventDate(row.endDate),
    text: String(row.text || ''),
    active: parseEventActive(row.active),
    source: String(row.eventType || '') === EVENT_TYPE_CUSTOM ? 'custom' : 'override',
    updatedAt: String(row.updatedAt || row.createdAt || '')
  };
}

function readEventConfigs(ss) {
  return readTable(ss.getSheetByName(SHEET_EVENTS))
    .map(eventPublicRow)
    .filter(row => row.eventId && row.year && row.key && row.startDate && row.endDate);
}

function getPublicEventConfigs(ss, year) {
  const targetYear = normalizeEventYear(year) || currentEventYear();
  return readEventConfigs(ss).filter(row => row.year === targetYear);
}

function listAdminEvents(ss, data) {
  const year = normalizeEventYear(data && data.year) || currentEventYear();
  const stored = getPublicEventConfigs(ss, year);
  const overrides = stored.filter(row => row.eventType === EVENT_TYPE_OVERRIDE);
  const standards = DEFAULT_ANNUAL_EVENTS.map(row => {
    const base = defaultAnnualEvent(row, year);
    const override = overrides.find(item => item.baseKey === base.baseKey);
    return override ? Object.assign({}, base, override, { source:'override' }) : base;
  });
  const custom = stored.filter(row => row.eventType === EVENT_TYPE_CUSTOM).map(row => Object.assign({}, row, { source:'custom' }));
  const events = standards.concat(custom).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))
    || String(a.title).localeCompare(String(b.title), 'ja'));
  return {
    year,
    events,
    total: events.length,
    customCount: custom.length,
    adjustedCount: standards.filter(row => row.source === 'override').length,
    generatedAt: new Date().toISOString()
  };
}

function createEventId() {
  return 'event-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function createCustomEventKey() {
  return 'custom-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function saveAdminEvent(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_EVENTS) < 0) throw new Error('manage_events_required');

  const sheet = ss.getSheetByName(SHEET_EVENTS);
  const rows = readTable(sheet);
  const requestedId = String(data.eventId || '').trim();
  const existingIndex = requestedId ? rows.findIndex(row => String(row.eventId || '').trim() === requestedId) : -1;
  const existing = existingIndex >= 0 ? rows[existingIndex] : null;
  if (requestedId && !existing) throw new Error('event_not_found');

  const eventType = String(data.eventType || '').trim() === EVENT_TYPE_CUSTOM ? EVENT_TYPE_CUSTOM : EVENT_TYPE_OVERRIDE;
  const year = normalizeEventYear(data.year);
  const baseKey = eventType === EVENT_TYPE_OVERRIDE ? String(data.baseKey || (existing && existing.baseKey) || '').trim() : '';
  const standardKeys = DEFAULT_ANNUAL_EVENTS.map(row => String(row[0]));
  const startDate = normalizeEventDate(data.startDate);
  const endDate = normalizeEventDate(data.endDate);
  const icon = String(data.icon || '').trim();
  const title = String(data.title || '').trim();
  const text = String(data.text || '').trim();
  const active = parseEventActive(data.active);

  if (!year) throw new Error('event_year_required');
  if (eventType === EVENT_TYPE_OVERRIDE && standardKeys.indexOf(baseKey) < 0) throw new Error('event_standard_not_found');
  if (!startDate || !endDate) throw new Error('event_date_required');
  if (Number(startDate.slice(0, 4)) !== year || Number(endDate.slice(0, 4)) !== year) throw new Error('event_date_year_mismatch');
  if (startDate > endDate) throw new Error('event_date_order_invalid');
  if (!title) throw new Error('event_title_required');
  if (icon.length > 20) throw new Error('event_icon_too_long');
  if (title.length > 80) throw new Error('event_title_too_long');
  if (text.length > 240) throw new Error('event_text_too_long');

  const duplicateOverride = rows.find(row => String(row.eventId || '') !== requestedId
    && normalizeEventYear(row.year) === year
    && String(row.eventType || '') === EVENT_TYPE_OVERRIDE
    && String(row.baseKey || '') === baseKey);
  if (eventType === EVENT_TYPE_OVERRIDE && duplicateOverride) throw new Error('event_override_duplicate');

  const customOverlap = rows.find(row => String(row.eventId || '') !== requestedId
    && normalizeEventYear(row.year) === year
    && String(row.eventType || '') === EVENT_TYPE_CUSTOM
    && parseEventActive(row.active)
    && normalizeEventDate(row.startDate) <= endDate
    && normalizeEventDate(row.endDate) >= startDate);
  if (eventType === EVENT_TYPE_CUSTOM && active && customOverlap) throw new Error('event_custom_overlap');

  const now = new Date().toISOString();
  const eventId = existing ? requestedId : createEventId();
  const key = eventType === EVENT_TYPE_OVERRIDE ? baseKey : String((existing && existing.key) || createCustomEventKey());
  const rowValues = [
    eventId, year, eventType, baseKey, key, icon, title, startDate, endDate, text, active,
    existing ? existing.createdAt || now : now,
    existing ? existing.createdBy || actor.employeeId : actor.employeeId,
    now, actor.employeeId, VERSION
  ];

  let savedRow;
  if (existing) {
    savedRow = existingIndex + 2;
    sheet.getRange(savedRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
    savedRow = sheet.getLastRow();
  }
  sheet.getRange(savedRow, 8, 1, 2).setNumberFormat('@').setValues([[startDate, endDate]]);

  return { type: existing ? 'updated' : 'inserted', event: eventPublicRow({
    eventId, year, eventType, baseKey, key, icon, title, startDate, endDate, text, active, updatedAt:now
  }) };
}

function deleteAdminEvent(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_EVENTS) < 0) throw new Error('manage_events_required');
  const eventId = String(data.eventId || '').trim();
  const sheet = ss.getSheetByName(SHEET_EVENTS);
  const rows = readTable(sheet);
  const existingIndex = rows.findIndex(row => String(row.eventId || '').trim() === eventId);
  if (existingIndex < 0) throw new Error('event_not_found');
  const deleted = eventPublicRow(rows[existingIndex]);
  sheet.deleteRow(existingIndex + 2);
  return { type:'deleted', event:deleted };
}

function normalizeExistingEventDates(sheet) {
  if (!sheet) return 0;
  sheet.getRange(1, 8, Math.max(sheet.getMaxRows(), 1), 2).setNumberFormat('@');
  if (sheet.getLastRow() < 2) return 0;
  const range = sheet.getRange(2, 8, sheet.getLastRow() - 1, 2);
  const values = range.getValues();
  let changed = 0;
  const next = values.map(row => {
    const startDate = normalizeEventDate(row[0]);
    const endDate = normalizeEventDate(row[1]);
    if (startDate && (Object.prototype.toString.call(row[0]) === '[object Date]' || String(row[0]).trim() !== startDate)) changed += 1;
    if (endDate && (Object.prototype.toString.call(row[1]) === '[object Date]' || String(row[1]).trim() !== endDate)) changed += 1;
    return [startDate || row[0], endDate || row[1]];
  });
  if (changed) range.setValues(next);
  return changed;
}
