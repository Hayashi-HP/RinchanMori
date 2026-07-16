/* Notices management */

function toIsoOrEmpty(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const parsed = new Date(text);
  if (isNaN(parsed.getTime())) throw new Error('datetime_invalid');
  return parsed.toISOString();
}

function nowIsoString() {
  return new Date().toISOString();
}

function toNoticeId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
}

function generateNoticeId() {
  return 'notice-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '-' + Utilities.getUuid().slice(0, 8);
}

function normalizeNoticeType(value) {
  const type = String(value || 'notice').trim().toLowerCase();
  if (type !== 'notice' && type !== 'group') throw new Error('type_invalid');
  return type;
}

function normalizeTargetType(value) {
  const targetType = String(value || 'all').trim().toLowerCase();
  if (targetType !== 'all' && targetType !== 'department') throw new Error('target_type_invalid');
  return targetType;
}

function normalizeNoticeStatus(value) {
  const status = String(value || 'draft').trim().toLowerCase();
  if (status !== 'draft' && status !== 'published') throw new Error('status_invalid');
  return status;
}

function asBoolFlag(value) {
  const raw = String(value || '').trim().toUpperCase();
  return raw === 'TRUE' || raw === '1' || raw === 'YES';
}

function boolToSheet(value) {
  return value ? 'TRUE' : 'FALSE';
}

function normalizeNoticeRow(row) {
  const deleted = asBoolFlag(row.deleted);
  return {
    noticeId: toNoticeId(row.noticeId || row.id || ''),
    type: normalizeNoticeType(row.type || 'notice'),
    title: String(row.title || ''),
    body: String(row.body || ''),
    authorName: String(row.authorName || ''),
    targetType: normalizeTargetType(row.targetType || 'all'),
    targetDept: String(row.targetDept || '').trim(),
    status: normalizeNoticeStatus(row.status || 'draft'),
    startAt: String(row.startAt || ''),
    endAt: String(row.endAt || ''),
    createdAt: String(row.createdAt || ''),
    createdBy: String(row.createdBy || ''),
    updatedAt: String(row.updatedAt || ''),
    updatedBy: String(row.updatedBy || ''),
    publishedAt: String(row.publishedAt || ''),
    unpublishedAt: String(row.unpublishedAt || ''),
    deleted,
    deletedAt: String(row.deletedAt || ''),
    deletedBy: String(row.deletedBy || ''),
    version: String(row.version || VERSION)
  };
}

function noticeSheet(ss) {
  return ss.getSheetByName(SHEET_NOTICES) || ensureSheet(ss, SHEET_NOTICES, [
    'noticeId', 'type', 'title', 'body', 'authorName', 'targetType', 'targetDept',
    'status', 'startAt', 'endAt', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
    'publishedAt', 'unpublishedAt', 'deleted', 'deletedAt', 'deletedBy', 'version'
  ]);
}

function noticeValues(row) {
  return [
    row.noticeId,
    row.type,
    row.title,
    row.body,
    row.authorName,
    row.targetType,
    row.targetDept,
    row.status,
    row.startAt,
    row.endAt,
    row.createdAt,
    row.createdBy,
    row.updatedAt,
    row.updatedBy,
    row.publishedAt,
    row.unpublishedAt,
    boolToSheet(row.deleted),
    row.deletedAt,
    row.deletedBy,
    row.version
  ];
}

function toNoticeSummary(row) {
  return {
    noticeId: row.noticeId,
    type: row.type,
    title: row.title,
    body: row.body,
    authorName: row.authorName,
    targetType: row.targetType,
    targetDept: row.targetDept,
    status: row.status,
    startAt: row.startAt,
    endAt: row.endAt,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    publishedAt: row.publishedAt,
    unpublishedAt: row.unpublishedAt,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    deletedBy: row.deletedBy,
    version: row.version
  };
}

function getNoticeRowById(ss, noticeId) {
  const id = toNoticeId(noticeId || '');
  if (!id) return null;
  const sheet = noticeSheet(ss);
  const row = findRowByValue(sheet, 1, id);
  if (row < 2) return null;
  const raw = rowToObject(sheet, row);
  return { rowNumber: row, data: normalizeNoticeRow(raw) };
}

function validateNoticeInput(ss, data, current) {
  const now = nowIsoString();
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const existing = current || {};

  const type = normalizeNoticeType(data.type || existing.type || 'notice');
  const status = normalizeNoticeStatus(data.status || existing.status || 'draft');
  const title = String(data.title != null ? data.title : existing.title || '').trim();
  const body = String(data.body != null ? data.body : existing.body || '').trim();
  const authorName = String(data.authorName != null ? data.authorName : existing.authorName || '').trim();
  const targetType = normalizeTargetType(data.targetType || existing.targetType || 'all');
  const targetDept = String(data.targetDept != null ? data.targetDept : existing.targetDept || '').trim();
  const startAt = toIsoOrEmpty(data.startAt != null ? data.startAt : existing.startAt || '');
  const endAt = toIsoOrEmpty(data.endAt != null ? data.endAt : existing.endAt || '');

  if (!title) throw new Error('title_required');
  if (!body) throw new Error('body_required');
  if (!authorName) throw new Error('author_name_required');
  if (!startAt) throw new Error('start_at_required');
  if (targetType === 'department' && !targetDept) throw new Error('target_dept_required');
  if (endAt && endAt <= startAt) throw new Error('end_at_must_be_after_start_at');
  if (title.length > 120) throw new Error('title_too_long');
  if (body.length > 1000) throw new Error('body_too_long');
  if (authorName.length > 40) throw new Error('author_name_too_long');

  const base = {
    noticeId: toNoticeId(existing.noticeId || data.noticeId || generateNoticeId()),
    type,
    title,
    body,
    authorName,
    targetType,
    targetDept: targetType === 'department' ? targetDept : '',
    status,
    startAt,
    endAt,
    createdAt: String(existing.createdAt || now),
    createdBy: String(existing.createdBy || actor.employeeId || ''),
    updatedAt: now,
    updatedBy: String(actor.employeeId || ''),
    publishedAt: String(existing.publishedAt || ''),
    unpublishedAt: String(existing.unpublishedAt || ''),
    deleted: false,
    deletedAt: '',
    deletedBy: '',
    version: VERSION
  };

  if (status === 'published') {
    base.publishedAt = String(existing.publishedAt || now);
    base.unpublishedAt = '';
  }

  return base;
}

function listAdminNotices(ss, data) {
  const sheet = noticeSheet(ss);
  const rows = readTable(sheet).map(normalizeNoticeRow);
  const statusFilter = String(data.status || '').trim().toLowerCase();
  const typeFilter = String(data.type || '').trim().toLowerCase();
  const deptFilter = String(data.targetDept || '').trim();
  const keyword = String(data.query || data.keyword || '').trim().toLowerCase();
  const includeDeleted = asBoolFlag(data.includeDeleted);

  const filtered = rows.filter(item => {
    if (!includeDeleted && item.deleted) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    if (deptFilter && item.targetDept !== deptFilter) return false;
    if (keyword) {
      const text = [item.noticeId, item.title, item.body, item.authorName, item.targetDept].join(' ').toLowerCase();
      if (text.indexOf(keyword) < 0) return false;
    }
    return true;
  }).sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));

  const departments = getDepartments(ss).map(item => String(item.deptName || '').trim()).filter(Boolean);
  return {
    total: filtered.length,
    notices: filtered.map(toNoticeSummary),
    departments
  };
}

function saveAdminNotice(ss, data) {
  const sheet = noticeSheet(ss);
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const requestId = toNoticeId(data.noticeId || '');
  const found = requestId ? getNoticeRowById(ss, requestId) : null;
  const before = found ? found.data : null;
  if (before && before.deleted) throw new Error('deleted_notice_not_editable');

  const next = validateNoticeInput(ss, data || {}, before || null);
  if (!next.noticeId) throw new Error('notice_id_required');

  if (found && found.rowNumber > 1) {
    sheet.getRange(found.rowNumber, 1, 1, 20).setValues([noticeValues(next)]);
  } else {
    sheet.appendRow(noticeValues(next));
  }

  const operation = found ? 'updated' : 'created';
  auditAction(
    ss,
    found ? 'adminNewsUpdated' : 'adminNewsCreated',
    Object.assign({}, data || {}, { targetType: 'notice', targetId: next.noticeId }),
    'ok',
    operation,
    {
      noticeId: next.noticeId,
      actorEmployeeId: String(actor.employeeId || ''),
      actorName: String(actor.name || ''),
      beforeStatus: before ? before.status : '',
      afterStatus: next.status,
      targetType: next.targetType,
      targetDept: next.targetDept,
      before: before || null,
      after: toNoticeSummary(next)
    }
  );

  return {
    type: operation,
    notice: toNoticeSummary(next)
  };
}

function publishAdminNotice(ss, data) {
  const found = getNoticeRowById(ss, data.noticeId || '');
  if (!found) throw new Error('notice_not_found');
  if (found.data.deleted) throw new Error('deleted_notice_not_publishable');

  const now = nowIsoString();
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const beforeStatus = found.data.status;
  const next = Object.assign({}, found.data, {
    status: 'published',
    publishedAt: found.data.publishedAt || now,
    unpublishedAt: '',
    updatedAt: now,
    updatedBy: String(actor.employeeId || ''),
    version: VERSION
  });

  noticeSheet(ss).getRange(found.rowNumber, 1, 1, 20).setValues([noticeValues(next)]);

  auditAction(
    ss,
    'adminNewsPublished',
    Object.assign({}, data || {}, { targetType: 'notice', targetId: next.noticeId }),
    'ok',
    'published',
    {
      noticeId: next.noticeId,
      actorEmployeeId: String(actor.employeeId || ''),
      actorName: String(actor.name || ''),
      beforeStatus,
      afterStatus: next.status,
      targetType: next.targetType,
      targetDept: next.targetDept,
      operatedAt: now
    }
  );

  return toNoticeSummary(next);
}

function unpublishAdminNotice(ss, data) {
  const found = getNoticeRowById(ss, data.noticeId || '');
  if (!found) throw new Error('notice_not_found');
  if (found.data.deleted) throw new Error('deleted_notice_not_unpublishable');

  const now = nowIsoString();
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const beforeStatus = found.data.status;
  const next = Object.assign({}, found.data, {
    status: 'draft',
    unpublishedAt: now,
    updatedAt: now,
    updatedBy: String(actor.employeeId || ''),
    version: VERSION
  });

  noticeSheet(ss).getRange(found.rowNumber, 1, 1, 20).setValues([noticeValues(next)]);

  auditAction(
    ss,
    'adminNewsUnpublished',
    Object.assign({}, data || {}, { targetType: 'notice', targetId: next.noticeId }),
    'ok',
    'unpublished',
    {
      noticeId: next.noticeId,
      actorEmployeeId: String(actor.employeeId || ''),
      actorName: String(actor.name || ''),
      beforeStatus,
      afterStatus: next.status,
      targetType: next.targetType,
      targetDept: next.targetDept,
      operatedAt: now
    }
  );

  return toNoticeSummary(next);
}

function deleteAdminNotice(ss, data) {
  const found = getNoticeRowById(ss, data.noticeId || '');
  if (!found) throw new Error('notice_not_found');
  if (found.data.deleted) throw new Error('already_deleted');

  const now = nowIsoString();
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const beforeStatus = found.data.status;
  const next = Object.assign({}, found.data, {
    status: 'draft',
    deleted: true,
    deletedAt: now,
    deletedBy: String(actor.employeeId || ''),
    updatedAt: now,
    updatedBy: String(actor.employeeId || ''),
    version: VERSION
  });

  noticeSheet(ss).getRange(found.rowNumber, 1, 1, 20).setValues([noticeValues(next)]);

  auditAction(
    ss,
    'adminNewsDeleted',
    Object.assign({}, data || {}, { targetType: 'notice', targetId: next.noticeId }),
    'ok',
    'deleted',
    {
      noticeId: next.noticeId,
      actorEmployeeId: String(actor.employeeId || ''),
      actorName: String(actor.name || ''),
      beforeStatus,
      afterStatus: 'deleted',
      targetType: next.targetType,
      targetDept: next.targetDept,
      operatedAt: now
    }
  );

  return toNoticeSummary(next);
}

function readUserDept(ss, data) {
  const employeeId = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!employeeId) return '';
  const user = readTable(ss.getSheetByName(SHEET_USERS))
    .find(row => normalizeEmployeeId(row.employeeId || row.id || '') === employeeId);
  if (!user) return '';
  return String(user.dept || '').trim();
}

function listPublicNews(ss, data) {
  const now = nowIsoString();
  const dept = readUserDept(ss, data || {}) || String(data.dept || '').trim();
  const notices = readTable(noticeSheet(ss)).map(normalizeNoticeRow);

  const rows = notices
    .filter(item => !item.deleted)
    .filter(item => item.status === 'published')
    .filter(item => !!item.startAt)
    .filter(item => item.startAt <= now)
    .filter(item => !item.endAt || item.endAt >= now)
    .filter(item => item.targetType === 'all' || (item.targetType === 'department' && item.targetDept && item.targetDept === dept))
    .sort((a, b) => String(b.startAt || b.updatedAt || '').localeCompare(String(a.startAt || a.updatedAt || '')))
    .map(item => ({
      noticeId: item.noticeId,
      type: item.type,
      title: item.title,
      body: item.body,
      authorName: item.authorName,
      targetType: item.targetType,
      targetDept: item.targetDept,
      startAt: item.startAt,
      endAt: item.endAt,
      publishedAt: item.publishedAt,
      updatedAt: item.updatedAt
    }));

  return {
    notices: rows,
    generatedAt: now,
    dept: dept || ''
  };
}
