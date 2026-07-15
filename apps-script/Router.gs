/* API router */

function handleGet(action, e, ss, setup) {
  if (action === 'setup') {
    return jsonOutput({ ok: true, action, setup, version: VERSION });
  }

  if (action === 'departments') {
    return jsonOutput({ ok: true, action, departments: getCachedDepartments(ss), version: VERSION, cached: true });
  }

  if (action === 'dashboard') {
    return jsonOutput({ ok: true, action, data: getCachedDashboard(ss), version: VERSION, cached: true });
  }

  return jsonOutput({
    ok: true,
    app: 'RinchanMori',
    version: VERSION,
    setup,
    message: 'Apps Script is running.'
  });
}

function adminDenied(action, ss, data) {
  auditAction(ss, action, data, 'ng', 'admin_required');
  return jsonOutput({
    ok: false,
    action,
    error: 'admin_required',
    reason: 'admin_required',
    code: 'ADMIN_REQUIRED',
    message: '管理者のみ実行できます。',
    version: VERSION
  });
}

function requireAdminAction(action, ss, data) {
  if (isAdminRequest(ss, data)) return null;
  return adminDenied(action, ss, data);
}

function handlePost(action, data, ss) {
  if (action === 'setup') {
    auditAction(ss, 'setup', data, 'ok', 'setupProject');
    clearAppCache();
    return jsonOutput({ ok: true, action, setup: setupProject(ss), version: VERSION });
  }

  if (action === 'clearCache') {
    const denied = requireAdminAction('clearCache', ss, data);
    if (denied) return denied;
    const cleared = clearAppCache();
    auditAction(ss, 'clearCache', data, 'ok', 'cache_cleared');
    return jsonOutput({ ok: true, action, cleared, version: VERSION });
  }

  if (action === 'createBackup') {
    const denied = requireAdminAction('createBackup', ss, data);
    if (denied) return denied;
    const backup = createBackup(ss, data);
    auditAction(ss, 'createBackup', data, backup.ok ? 'ok' : 'ng', backup.ok ? 'backup_created' : 'backup_failed', {
      label: backup.label,
      copiedCount: backup.copiedCount,
      sourceCount: backup.sourceCount
    });
    return jsonOutput({ ok: backup.ok, action, backup, version: VERSION });
  }

  if (action === 'recentBackups') {
    const denied = requireAdminAction('recentBackups', ss, data);
    if (denied) return denied;
    auditAction(ss, 'recentBackups', data, 'ok', 'view_backup_logs');
    return jsonOutput({ ok: true, action, backups: getRecentBackups(ss, data.limit || 50), version: VERSION });
  }

  if (action === 'departments') {
    return jsonOutput({ ok: true, action, departments: getCachedDepartments(ss), version: VERSION, cached: true });
  }

  if (action === 'dashboard') {
    return jsonOutput({ ok: true, action, data: getCachedDashboard(ss), version: VERSION, cached: true });
  }

  if (action === 'saveErrorLog') {
    const saved = saveErrorLog(ss, data);
    return jsonOutput({ ok: true, action, saved, version: VERSION });
  }

  if (action === 'recentErrorLogs') {
    const denied = requireAdminAction('recentErrorLogs', ss, data);
    if (denied) return denied;
    auditAction(ss, 'recentErrorLogs', data, 'ok', 'view_error_logs');
    return jsonOutput({ ok: true, action, logs: getRecentErrorLogs(ss, data.limit || 50), version: VERSION });
  }

  if (action === 'recentAuditLogs') {
    const denied = requireAdminAction('recentAuditLogs', ss, data);
    if (denied) return denied;
    auditAction(ss, 'recentAuditLogs', data, 'ok', 'view_audit_logs');
    return jsonOutput({ ok: true, action, logs: getRecentAuditLogs(ss, data.limit || 100), version: VERSION });
  }

  if (action === 'getUserState') {
    return jsonOutput({ ok: true, action, state: getUserState(ss, data), version: VERSION });
  }

  if (action === 'markRead') {
    const state = markUserRead(ss, data);
    auditAction(ss, 'markRead', data, 'ok', 'user_read', { employeeId: data.employeeId || data.id || '', type: data.type || '', targetId: data.targetId || data.newsId || data.thanksId || '' });
    return jsonOutput({ ok: true, action, state, version: VERSION });
  }

  if (action === 'markNewsRead') {
    const state = markNewsRead(ss, data);
    auditAction(ss, 'markNewsRead', data, 'ok', 'news_read', { employeeId: data.employeeId || data.id || '', newsId: data.newsId || data.noticeId || data.targetId || '' });
    return jsonOutput({ ok: true, action, state, version: VERSION });
  }

  if (action === 'markThanksRead') {
    const state = markThanksRead(ss, data);
    auditAction(ss, 'markThanksRead', data, 'ok', 'thanks_read', { employeeId: data.employeeId || data.id || '', thanksId: data.thanksId || data.flowerId || data.targetId || '' });
    return jsonOutput({ ok: true, action, state, version: VERSION });
  }

  if (action === 'myActivities') {
    const activities = getMyActivities(ss, data);
    writeLog(ss, action, data.deviceId, data.employeeId || data.id || data.participantId, 'ok', '');
    return jsonOutput({ ok: true, action, activities, version: VERSION });
  }

  if (action === 'thanksTimeline') {
    return jsonOutput({ ok: true, action, thanks: getPublicThanksTimeline(ss), version: VERSION });
  }

  if (action === 'myThanks') {
    const thanks = getMyThanks(ss, data);
    writeLog(ss, action, data.deviceId, data.employeeId || data.id || data.toParticipantId, 'ok', '');
    return jsonOutput({ ok: true, action, thanks, version: VERSION });
  }

  if (action === 'mySentThanks') {
    const thanks = getMySentThanks(ss, data);
    writeLog(ss, action, data.deviceId, data.employeeId || data.id || data.fromParticipantId, 'ok', '');
    return jsonOutput({ ok: true, action, thanks, version: VERSION });
  }

  if (action === 'myThanksStats') {
    const stats = getMyThanksStats(ss, data);
    writeLog(ss, action, data.deviceId, data.employeeId || data.id, 'ok', '');
    return jsonOutput({ ok: true, action, stats, version: VERSION });
  }

  if (action === 'adminStats') {
    const denied = requireAdminAction('adminStats', ss, data);
    if (denied) return denied;
    auditAction(ss, 'adminStats', data, 'ok', 'view_admin_stats');
    return jsonOutput({ ok: true, action, data: getCachedAdminStats(ss), version: VERSION, cached: true });
  }

  if (action === 'saveUser') {
    const saved = saveUser(ss, data);
    invalidateUserCaches();
    writeLog(ss, action, data.deviceId, saved.user.id, 'ok', '');
    auditAction(ss, action, Object.assign({}, data, { employeeId: saved.user.employeeId }), 'ok', 'user_saved', { targetEmployeeId: saved.user.employeeId, dept: saved.user.dept || '' });
    return jsonOutput({ ok: true, action, saved, user: saved.user, state: getUserState(ss, { employeeId: saved.user.employeeId }), version: VERSION });
  }

  if (action === 'loginUser') {
    const user = loginUser(ss, data);
    writeLog(ss, action, data.deviceId, user ? user.id : '', user ? 'ok' : 'ng', user ? '' : 'login_failed');
    auditAction(ss, action, Object.assign({}, data, { employeeId: data.employeeId || data.id || '' }), user ? 'ok' : 'ng', user ? 'login_success' : 'login_failed');
    if (!user) return jsonOutput({ ok: false, error: 'login_failed', version: VERSION });
    return jsonOutput({ ok: true, action, user, state: getUserState(ss, { employeeId: user.employeeId }), version: VERSION });
  }

  if (action === 'saveActivity' || action === 'saveHealthSteps') {
    const originalAction = action;
    data.action = 'saveActivity';
    const saved = saveActivity(ss, data);
    invalidateActivityCaches();
    const employeeId = data.participantId || data.employeeId || data.id;
    writeLog(ss, originalAction, data.deviceId, employeeId, 'ok', originalAction === 'saveHealthSteps' ? 'shortcut_alias_saveActivity' : '');
    auditAction(ss, 'saveActivity', Object.assign({}, data, { employeeId, originalAction }), 'ok', 'activity_saved', { date: data.date || '', steps: data.steps || '', activityId: saved.activityId || '' });
    return jsonOutput({ ok: true, action: originalAction, normalizedAction: 'saveActivity', saved, state: getUserState(ss, { employeeId }), version: VERSION });
  }

  if (action === 'deleteActivity') {
    const employeeId = data.participantId || data.employeeId || data.id;
    const deleted = deleteActivity(ss, data);
    if (deleted.deleted) invalidateActivityCaches();
    writeLog(ss, action, data.deviceId, employeeId, deleted.deleted ? 'ok' : 'ng', deleted.deleted ? '' : 'not_found');
    auditAction(ss, 'deleteActivity', Object.assign({}, data, { employeeId }), deleted.deleted ? 'ok' : 'ng', deleted.deleted ? 'activity_deleted' : 'activity_not_found', { activityId: data.activityId || '' });
    return jsonOutput({ ok: true, action, deleted, state: getUserState(ss, { employeeId }), version: VERSION });
  }

  if (action === 'saveThanks') {
    const employeeId = data.fromParticipantId || data.employeeId || data.id || '';
    try {
      const saved = saveThanks(ss, data);
      try { if (typeof invalidateThanksCaches === 'function') invalidateThanksCaches(); } catch (ignoreCache) {}
      try { writeLog(ss, action, data.deviceId || data.fromParticipantId || '', data.toParticipantId || '', 'ok', ''); } catch (ignoreLog) {}
      try {
        if (typeof auditAction === 'function') {
          auditAction(ss, 'saveThanks', Object.assign({}, data, { employeeId }), 'ok', 'thanks_saved', { thanksId: saved.thanksId || '', toParticipantId: data.toParticipantId || '', reason: data.reason || '' });
        }
      } catch (ignoreAudit) {}

      let state = null;
      let stats = null;
      try { stats = getMyThanksStats(ss, { employeeId }); } catch (ignoreStats) {}
      try { state = getUserState(ss, { employeeId }); } catch (ignoreState) {}
      return jsonOutput({ ok: true, action, saved, stats, state, version: VERSION });
    } catch (err) {
      try { writeLog(ss, action, data.deviceId || data.fromParticipantId || '', data.toParticipantId || '', 'ng', err.message); } catch (ignoreErrorLog) {}
      return jsonOutput({ ok: false, action, error: err.message, version: VERSION });
    }
  }

  writeLog(ss, action || 'unknown', data.deviceId, data.participantId || data.id, 'ng', 'unknown_action');
  auditAction(ss, action || 'unknown', data, 'ng', 'unknown_action');
  return jsonOutput({ ok: false, error: 'unknown_action', version: VERSION });
}