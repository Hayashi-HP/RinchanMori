/* Badge catalog configuration */

const DEFAULT_BADGES = [
  ['tenure_1', '勤続', '🌱', '若葉バッジ', '勤続1年', true, 10],
  ['tenure_5', '勤続', '🌳', '大樹バッジ', '勤続5年', true, 20],
  ['tenure_10', '勤続', '🌸', '桜バッジ', '勤続10年', true, 30],
  ['tenure_20', '勤続', '🌈', '杜の守り人', '勤続20年', true, 40],
  ['steps_100k', '歩数', '🥉', 'ブロンズウォーカー', '10万歩', true, 50],
  ['steps_500k', '歩数', '🥈', 'シルバーウォーカー', '50万歩', true, 60],
  ['steps_1m', '歩数', '🥇', 'ゴールドウォーカー', '100万歩', true, 70],
  ['steps_5m', '歩数', '💎', 'プラチナウォーカー', '500万歩', true, 80],
  ['thanks_100', 'ありがとう', '🌸', 'ありがとう百花', 'ありがとう100件', true, 90],
  ['thanks_300', 'ありがとう', '🌺', 'ありがとう満開', 'ありがとう300件', true, 100],
  ['thanks_500', 'ありがとう', '🌹', 'ありがとうの花束', 'ありがとう500件', true, 110],
  ['event_tanabata', 'イベント', '🎋', '七夕の願い', '七夕に願いを書く', true, 120],
  ['event_birthday', 'イベント', '🎂', '誕生日の杜', '誕生日を迎える', true, 130],
  ['secret_midnight', 'シークレット', '🌙', '夜の杜の訪問者', '???', true, 140],
  ['secret_flower', 'シークレット', '💐', '花を受け取る人', '???', true, 150]
];

function parseBadgeActive(value) {
  if (value === true || value === 1) return true;
  const raw = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'active' || raw === 'published';
}

function defaultBadgeObject(row) {
  return {
    badgeId: String(row[0] || ''),
    group: String(row[1] || ''),
    icon: String(row[2] || ''),
    name: String(row[3] || ''),
    hint: String(row[4] || ''),
    active: parseBadgeActive(row[5]),
    displayOrder: Number(row[6] || 999),
    updatedAt: ''
  };
}

function badgePublicRow(row) {
  return {
    badgeId: String(row.badgeId || ''),
    group: String(row.group || ''),
    icon: String(row.icon || ''),
    name: String(row.name || ''),
    hint: String(row.hint || ''),
    active: parseBadgeActive(row.active),
    displayOrder: Number(row.displayOrder || 999),
    updatedAt: String(row.updatedAt || '')
  };
}

function ensureDefaultBadgeRows(sheet) {
  if (!sheet) return 0;
  const existingIds = sheet.getLastRow() < 2
    ? []
    : sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(row => String(row[0] || '').trim());
  let added = 0;
  DEFAULT_BADGES.forEach(row => {
    if (existingIds.indexOf(String(row[0])) >= 0) return;
    sheet.appendRow(row.concat(['', '', VERSION]));
    added += 1;
  });
  return added;
}

function getBadgeConfigs(ss) {
  const sheet = ss.getSheetByName(SHEET_BADGES);
  const rows = sheet ? readTable(sheet).map(badgePublicRow).filter(row => row.badgeId) : [];
  const source = rows.length ? rows : DEFAULT_BADGES.map(defaultBadgeObject);
  return source.sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999)
    || String(a.badgeId).localeCompare(String(b.badgeId)));
}

function listAdminBadges(ss, data) {
  const group = String((data && data.group) || '').trim();
  const badges = getBadgeConfigs(ss).filter(row => !group || row.group === group);
  return {
    badges,
    total: badges.length,
    activeCount: badges.filter(row => row.active).length,
    groups: Array.from(new Set(getBadgeConfigs(ss).map(row => row.group).filter(Boolean))),
    generatedAt: new Date().toISOString()
  };
}

function saveAdminBadge(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_BADGES) < 0) throw new Error('manage_badges_required');

  const badgeId = String(data.badgeId || '').trim();
  const sheet = ss.getSheetByName(SHEET_BADGES);
  const rows = readTable(sheet);
  const existingIndex = rows.findIndex(row => String(row.badgeId || '').trim() === badgeId);
  if (existingIndex < 0) throw new Error('badge_not_found');

  const existing = rows[existingIndex];
  const icon = String(data.icon || '').trim();
  const name = String(data.name || '').trim();
  const hint = String(data.hint || '').trim();
  const active = parseBadgeActive(data.active);
  if (!name) throw new Error('badge_name_required');
  if (icon.length > 20) throw new Error('badge_icon_too_long');
  if (name.length > 80) throw new Error('badge_name_too_long');
  if (hint.length > 120) throw new Error('badge_hint_too_long');

  const now = new Date().toISOString();
  const saved = {
    badgeId,
    group: String(existing.group || ''),
    icon,
    name,
    hint,
    active,
    displayOrder: Number(existing.displayOrder || 999),
    updatedAt: now
  };
  sheet.getRange(existingIndex + 2, 1, 1, 10).setValues([[
    saved.badgeId,
    saved.group,
    saved.icon,
    saved.name,
    saved.hint,
    saved.active,
    saved.displayOrder,
    now,
    actor.employeeId,
    VERSION
  ]]);

  return { type: 'updated', badge: saved };
}
