/* API router */

function handleGet(action, e, ss, setup) {
  if (action === 'setup') {
    return jsonOutput({ ok: true, action, setup, version: VERSION });
  }

  if (action === 'departments') {
    return jsonOutput({ ok: true, action, departments: getDepartments(ss), version: VERSION });
  }

  if (action === 'dashboard') {
    return jsonOutput({ ok: true, action, data: getDashboard(ss), version: VERSION });
  }

  return jsonOutput({
    ok: true,
    app: 'RinchanMori',
    version: VERSION,
    setup,
    message: 'Apps Script is running.'
  });
}

function handlePost(action, data, ss) {
  if (action === 'setup') {
    auditAction(ss, 'setup', data, 'ok', 'setupProject');
    return jsonOutput({ ok: true, action, setup: setupProject(ss), version: VERSION });
  }

  if (action === 'departments') {
    return jsonOutput({ ok: true, action, departments: getDepartments(ss), version: VERSION });
  }

  if (action === 'dashboard') {
    return jsonOutput({ ok: true, action, data: getDashboard(ss), version: VERSION });
  }

  if (action === 'saveErrorLog') {
    const saved = saveErrorLog(ss, data);
    return jsonOutput({ ok: true, action, saved, version: VERSION });
  }

  if (action === 'recentErrorLogs') {
    if (!isAdminRequest(ss, data)) {
      auditAction(ss, 'recentErrorLogs', data, 'ng', 'admin_required');
      return jsonOutput({ ok: false, error: 'admin_required', version: VERSION });
    }
    auditAction(ss, 'recentErrorLogs', data, 'ok', 'view_error_logs');
    return jsonOutput({ ok: true, action, logs: getRecentErrorLogs(ss, data.limit || 50), version: VERSION });
  }

  if (action === 'recentAuditLogs') {
    if (!isAdminRequest(ss, data)) {
      auditAction(ss, 'recentAuditLogs', data, 'ng', 'admin_required');
      return jsonOutput({ ok: false, error: 'admin_required', version: VERSION });
    }
    auditAction(ss, 'recentAuditLogs', data, 'ok', 'view_audit_logs');
    return jsonOutput({ ok: true, action, logs: getRecentAuditLogs(ss, data.limit || 100), version: VERSION });
  }

  if (action === 'getUserState') {
    return jsonOutput({ ok: true, action, state: getUserState(ss, data), version: VERSION });
  }

  if (action === 'markNewsRead') {
    const state = markNewsRead(ss, data);
    auditAction(ss, 'markNewsRead', data, 'ok', 'news_read', { employeeId: data.employeeId || data.id || '' });
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
    if (!isAdminRequest(ss, data)) {
      auditAction(ss, 'adminStats', data, 'ng', 'admin_required');
      return jsonOutput({ ok: false, error: 'admin_required', version: VERSION });
    }
    auditAction(ss, 'adminStats', data, 'ok', 'view_admin_stats');
    return jsonOutput({ ok: true, action, data: getAdminStats(ss), version: VERSION });
  }

  if (action === 'saveUser') {
    const saved = saveUser(ss, data);
    writeLog(ss, action, data.deviceId, saved.user.id, 'ok', '');
    auditAction(ss, 'saveUser', Object.assign({}, data, { employeeId: saved.user.employeeId }), 'ok', 'user_saved', {
      targetEmployeeId: saved.user.employeeId,
      dept: saved.user.dept || ''
    });
    return jsonOutput({
      ok: true,
      action,
      saved,
      user: saved.user,
      state: getUserState(ss, { employeeId: saved.user.employeeId }),
      version: VERSION
    });
  }

  if (action === 'loginUser') {
    const user = loginUser(ss, data);
    writeLog(ss, action, data.deviceId, user ? user.id : '', user ? 'ok' : 'ng', user ? '' : 'login_failed');
    auditAction(ss, 'loginUser', Object.assign({}, data, { employeeId: data.employeeId || data.id || '' }), user ? 'ok' : 'ng', user ? 'login_success' : 'login_failed');
    if (!user) return jsonOutput({ ok: false, error: 'login_failed', version: VERSION });
    return jsonOutput({
      ok: true,
      action,
      user,
      state: getUserState(ss, { employeeId: user.employeeId }),
      version: VERSION
    });
  }

  if (action === 'saveActivity') {
    const saved = saveActivity(ss, data);
    const employeeId = data.participantId || data.employeeId || data.id;
    writeLog(ss, action, data.deviceId, employeeId, 'ok', '');
    auditAction(ss, 'saveActivity', Object.assign({}, data, { employeeId }), 'ok', 'activity_saved', {
      date: data.date || '',
      steps: data.steps || '',
      activityId: saved.activityId || ''
    });
    return jsonOutput({
      ok: true,
      action,
      saved,
      state: getUserState(ss, { employeeId }),
      version: VERSION
    });
  }

  if (action === 'deleteActivity') {
    const employeeId = data.participantId || data.employeeId || data.id;
    const deleted = deleteActivity(ss, data);
    writeLog(ss, action, data.deviceId, employeeId, deleted.deleted ? 'ok' : 'ng', deleted.deleted ? '' : 'not_found');
    auditAction(ss, 'deleteActivity', Object.assign({}, data, { employeeId }), deleted.deleted ? 'ok' : 'ng', deleted.deleted ? 'activity_deleted' : 'activity_not_found', {
      activityId: data.activityId || ''
    });
    return jsonOutput({
      ok: true,
      action,
      deleted,
      state: getUserState(ss, { employeeId }),
      version: VERSION
    });
  }

  if (action === 'saveThanks') {
    const saved = saveThanks(ss, data);
    const employeeId = data.fromParticipantId || data.employeeId || data.id;
    writeLog(ss, action, data.fromParticipantId || data.deviceId, data.toParticipantId, 'ok', '');
    auditAction(ss, 'saveThanks', Object.assign({}, data, { employeeId }), 'ok', 'thanks_saved', {
      thanksId: saved.thanksId || '',
      toParticipantId: data.toParticipantId || '',
      reason: data.reason || ''
    });
    return jsonOutput({
      ok: true,
      action,
      saved,
      stats: getMyThanksStats(ss, { employeeId }),
      state: getUserState(ss, { employeeId }),
      version: VERSION
    });
  }

  writeLog(ss, action || 'unknown', data.deviceId, data.participantId || data.id, 'ng', 'unknown_action');
  auditAction(ss, action || 'unknown', data, 'ng', 'unknown_action');
  return jsonOutput({ ok: false, error: 'unknown_action', version: VERSION });
}
