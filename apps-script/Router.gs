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

  if (action === 'checkEmployeeId') {
    const employeeId = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
    if (!employeeId) return jsonOutput({ ok: false, action, error: 'employee_id_required', reason: 'employee_id_required', version: VERSION });
    const exists = !!getPublicUserById(ss, employeeId);
    return jsonOutput({ ok: true, action, exists, available: !exists, version: VERSION });
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

  if (action === 'adminUserList') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_USERS)) return adminDenied('adminUserList', ss, data);
    try {
      const list = listAdminUsers(ss, data || {});
      auditAction(ss, 'adminUserList', data, 'ok', 'view_admin_user_list', { total: list.total });
      return jsonOutput({ ok: true, action, data: list, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminUserList', data, 'ng', e.message || 'admin_user_list_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_user_list_failed', reason: e.message || 'admin_user_list_failed', version: VERSION });
    }
  }

  if (action === 'adminUpdateUser') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_USERS)) return adminDenied('adminUpdateUser', ss, data);
    try {
      const user = updateAdminUser(ss, data || {});
      auditAction(ss, 'adminUpdateUser', data, 'ok', 'admin_user_updated', {
        targetEmployeeId: user.employeeId,
        dept: user.dept,
        role: user.role
      });
      return jsonOutput({ ok: true, action, user, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminUpdateUser', data, 'ng', e.message || 'admin_user_update_failed', {
        targetEmployeeId: data.targetEmployeeId || ''
      });
      return jsonOutput({ ok: false, action, error: e.message || 'admin_user_update_failed', reason: e.message || 'admin_user_update_failed', version: VERSION });
    }
  }

  if (action === 'adminDepartmentList') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_USERS)) return adminDenied('adminDepartmentList', ss, data);
    try {
      const list = getAdminDepartments(ss);
      auditAction(ss, 'adminDepartmentList', data, 'ok', 'view_admin_department_list', { total: list.total });
      return jsonOutput({ ok: true, action, data: list, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminDepartmentList', data, 'ng', e.message || 'admin_department_list_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_department_list_failed', reason: e.message || 'admin_department_list_failed', version: VERSION });
    }
  }

  if (action === 'adminSaveDepartment') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_USERS)) return adminDenied('adminSaveDepartment', ss, data);
    try {
      const saved = saveAdminDepartment(ss, data || {});
      auditAction(ss, 'adminSaveDepartment', data, 'ok', 'admin_department_saved', {
        targetDepartmentId: saved.department.deptId,
        departmentName: saved.department.deptName,
        active: saved.department.active,
        updatedUsers: saved.updatedUsers,
        updatedNotices: saved.updatedNotices
      });
      return jsonOutput({ ok: true, action, saved, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminSaveDepartment', data, 'ng', e.message || 'admin_department_save_failed', {
        targetDepartmentId: data.deptId || '',
        departmentName: data.deptName || ''
      });
      return jsonOutput({ ok: false, action, error: e.message || 'admin_department_save_failed', reason: e.message || 'admin_department_save_failed', version: VERSION });
    }
  }

  if (action === 'adminChallengeList') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_CHALLENGES)) return adminDenied('adminChallengeList', ss, data);
    try {
      const list = listAdminChallenges(ss, data || {});
      auditAction(ss, 'adminChallengeList', data, 'ok', 'view_admin_challenge_list', { total: list.total });
      return jsonOutput({ ok: true, action, data: list, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminChallengeList', data, 'ng', e.message || 'admin_challenge_list_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_challenge_list_failed', reason: e.message || 'admin_challenge_list_failed', version: VERSION });
    }
  }

  if (action === 'adminSaveChallenge') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_CHALLENGES)) return adminDenied('adminSaveChallenge', ss, data);
    try {
      const saved = saveAdminChallenge(ss, data || {});
      auditAction(ss, 'adminSaveChallenge', data, 'ok', 'admin_challenge_saved', {
        targetChallengeId: saved.challenge.challengeId,
        yearMonth: saved.challenge.yearMonth,
        scope: saved.challenge.scope,
        targetDept: saved.challenge.targetDept,
        targetSteps: saved.challenge.targetSteps,
        active: saved.challenge.active
      });
      return jsonOutput({ ok: true, action, saved, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminSaveChallenge', data, 'ng', e.message || 'admin_challenge_save_failed', {
        targetChallengeId: data.challengeId || '',
        yearMonth: data.yearMonth || '',
        scope: data.scope || ''
      });
      return jsonOutput({ ok: false, action, error: e.message || 'admin_challenge_save_failed', reason: e.message || 'admin_challenge_save_failed', version: VERSION });
    }
  }

  if (action === 'adminDeleteChallenge') {
    if (!hasPermission(ss, data, PERMISSION_MANAGE_CHALLENGES)) return adminDenied('adminDeleteChallenge', ss, data);
    try {
      const deleted = deleteAdminChallenge(ss, data || {});
      auditAction(ss, 'adminDeleteChallenge', data, 'ok', 'admin_challenge_deleted', {
        targetChallengeId: deleted.challenge.challengeId,
        yearMonth: deleted.challenge.yearMonth,
        scope: deleted.challenge.scope,
        targetDept: deleted.challenge.targetDept
      });
      return jsonOutput({ ok: true, action, deleted, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminDeleteChallenge', data, 'ng', e.message || 'admin_challenge_delete_failed', {
        targetChallengeId: data.challengeId || ''
      });
      return jsonOutput({ ok: false, action, error: e.message || 'admin_challenge_delete_failed', reason: e.message || 'admin_challenge_delete_failed', version: VERSION });
    }
  }

  if (action === 'adminActivityRows') {
    const denied = requireAdminAction('adminActivityRows', ss, data);
    if (denied) return denied;
    try {
      const list = getAdminActivityRows(ss, data || {});
      auditAction(ss, 'adminActivityRows', data, 'ok', 'view_admin_activity_rows', { date: list.date, total: list.total });
      return jsonOutput({ ok: true, action, data: list, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminActivityRows', data, 'ng', e.message || 'admin_activity_rows_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_activity_rows_failed', reason: e.message || 'admin_activity_rows_failed', version: VERSION });
    }
  }

  if (action === 'adminNewsList') {
    const denied = requireAdminAction('adminNewsList', ss, data);
    if (denied) return denied;
    try {
      const list = listAdminNotices(ss, data || {});
      auditAction(ss, 'adminNewsList', data, 'ok', 'view_admin_news_list', {
        total: list.total,
        status: data.status || '',
        type: data.type || '',
        targetDept: data.targetDept || ''
      });
      return jsonOutput({ ok: true, action, data: list, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminNewsList', data, 'ng', e.message || 'admin_news_list_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_news_list_failed', reason: e.message || 'admin_news_list_failed', version: VERSION });
    }
  }

  if (action === 'adminSaveNews') {
    const denied = requireAdminAction('adminSaveNews', ss, data);
    if (denied) return denied;
    try {
      const saved = saveAdminNotice(ss, data || {});
      return jsonOutput({ ok: true, action, saved, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminSaveNews', data, 'ng', e.message || 'admin_news_save_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_news_save_failed', reason: e.message || 'admin_news_save_failed', version: VERSION });
    }
  }

  if (action === 'adminPublishNews') {
    const denied = requireAdminAction('adminPublishNews', ss, data);
    if (denied) return denied;
    try {
      const notice = publishAdminNotice(ss, data || {});
      return jsonOutput({ ok: true, action, notice, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminPublishNews', data, 'ng', e.message || 'admin_news_publish_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_news_publish_failed', reason: e.message || 'admin_news_publish_failed', version: VERSION });
    }
  }

  if (action === 'adminUnpublishNews') {
    const denied = requireAdminAction('adminUnpublishNews', ss, data);
    if (denied) return denied;
    try {
      const notice = unpublishAdminNotice(ss, data || {});
      return jsonOutput({ ok: true, action, notice, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminUnpublishNews', data, 'ng', e.message || 'admin_news_unpublish_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_news_unpublish_failed', reason: e.message || 'admin_news_unpublish_failed', version: VERSION });
    }
  }

  if (action === 'adminDeleteNews') {
    const denied = requireAdminAction('adminDeleteNews', ss, data);
    if (denied) return denied;
    try {
      const notice = deleteAdminNotice(ss, data || {});
      return jsonOutput({ ok: true, action, notice, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminDeleteNews', data, 'ng', e.message || 'admin_news_delete_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_news_delete_failed', reason: e.message || 'admin_news_delete_failed', version: VERSION });
    }
  }

  if (action === 'publicNewsList') {
    try {
      const list = listPublicNews(ss, data || {});
      return jsonOutput({ ok: true, action, notices: list.notices, generatedAt: list.generatedAt, version: VERSION });
    } catch (e) {
      return jsonOutput({ ok: false, action, error: e.message || 'public_news_list_failed', reason: e.message || 'public_news_list_failed', version: VERSION });
    }
  }

  if (action === 'adminUpdateActivity') {
    const denied = requireAdminAction('adminUpdateActivity', ss, data);
    if (denied) return denied;
    try {
      const corrected = saveAdminActivityCorrection(ss, data || {});
      return jsonOutput({ ok: true, action, corrected, version: VERSION });
    } catch (e) {
      auditAction(ss, 'adminUpdateActivity', data, 'ng', e.message || 'admin_activity_update_failed');
      return jsonOutput({ ok: false, action, error: e.message || 'admin_activity_update_failed', reason: e.message || 'admin_activity_update_failed', version: VERSION });
    }
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
