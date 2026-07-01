/*
 * RinchanMori Apps Script
 * Version: v0.9.55
 *
 * This file contains only the API entry points.
 * Other functions are split into Config.gs, Common.gs, Setup.gs,
 * User.gs, Activity.gs, Thanks.gs, and Admin.gs.
 */

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setup = setupProject(ss);

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

function doPost(e) {
  try {
    const data = parseRequest(e);
    const action = String(data.action || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupProject(ss);

    if (action === 'setup') {
      return jsonOutput({ ok: true, action, setup: setupProject(ss), version: VERSION });
    }

    if (action === 'departments') {
      return jsonOutput({ ok: true, action, departments: getDepartments(ss), version: VERSION });
    }

    if (action === 'dashboard') {
      return jsonOutput({ ok: true, action, data: getDashboard(ss), version: VERSION });
    }

    if (action === 'getUserState') {
      return jsonOutput({ ok: true, action, state: getUserState(ss, data), version: VERSION });
    }

    if (action === 'markNewsRead') {
      return jsonOutput({ ok: true, action, state: markNewsRead(ss, data), version: VERSION });
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
        return jsonOutput({ ok: false, error: 'admin_required', version: VERSION });
      }
      return jsonOutput({ ok: true, action, data: getAdminStats(ss), version: VERSION });
    }

    if (action === 'saveUser') {
      const saved = saveUser(ss, data);
      writeLog(ss, action, data.deviceId, saved.user.id, 'ok', '');
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
      writeLog(ss, action, data.deviceId, data.participantId || data.id, 'ok', '');
      return jsonOutput({ ok: true, action, saved, version: VERSION });
    }

    if (action === 'deleteActivity') {
      const deleted = deleteActivity(ss, data);
      writeLog(ss, action, data.deviceId, data.participantId || data.id, deleted.deleted ? 'ok' : 'ng', deleted.deleted ? '' : 'not_found');
      return jsonOutput({ ok: true, action, deleted, version: VERSION });
    }

    if (action === 'saveThanks') {
      const saved = saveThanks(ss, data);
      writeLog(ss, action, data.fromParticipantId || data.deviceId, data.toParticipantId, 'ok', '');
      return jsonOutput({
        ok: true,
        action,
        saved,
        stats: getMyThanksStats(ss, { employeeId: data.fromParticipantId }),
        version: VERSION
      });
    }

    writeLog(ss, action || 'unknown', data.deviceId, data.participantId || data.id, 'ng', 'unknown_action');
    return jsonOutput({ ok: false, error: 'unknown_action', version: VERSION });
  } catch (err) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      setupProject(ss);
      writeLog(ss, 'error', '', '', 'ng', err.message);
    } catch (ignore) {}
    return jsonOutput({ ok: false, error: err.message, version: VERSION });
  }
}

function setupProjectManual() {
  return setupProject(SpreadsheetApp.getActiveSpreadsheet());
}
