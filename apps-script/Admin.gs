/* Admin dashboard */

function getDashboard(ss) {
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const thanks = readTable(ss.getSheetByName(SHEET_THANKS));
  const byUser = buildUserStats(users, activities, false);
  const members = Object.keys(byUser).map(id => byUser[id]);

  return {
    generatedAt: new Date().toISOString(),
    totalUsers: members.length,
    totalActivities: activities.length,
    totalSteps: activities.reduce((sum, item) => sum + Number(item.steps || 0), 0),
    totalThanks: thanks.length,
    members,
    departments: getDepartments(ss),
    ranking: rankMembers(members).slice(0, 20)
  };
}

function getAdminStats(ss) {
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const byUser = buildUserStats(users, activities, false);
  const members = Object.keys(byUser).map(id => byUser[id]);
  const deptMap = {};
  const monthMap = {};
  const csvRows = [];
  const today = toDateKey(new Date());
  const last7 = Date.now() - 6 * 86400000;

  activities.forEach(item => {
    const user = byUser[item.participantId] || {};
    const dept = user.dept || '所属未設定';
    const date = String(item.date || '');
    const month = date.slice(0, 7) || '日付未設定';
    const steps = Number(item.steps || 0);

    if (!deptMap[dept]) {
      deptMap[dept] = {
        dept,
        users: {},
        activityCount: 0,
        totalSteps: 0,
        todaySteps: 0,
        todayCount: 0,
        last7Steps: 0,
        last7Count: 0
      };
    }

    deptMap[dept].users[item.participantId || 'unknown'] = true;
    deptMap[dept].activityCount += 1;
    deptMap[dept].totalSteps += steps;

    if (date === today) {
      deptMap[dept].todaySteps += steps;
      deptMap[dept].todayCount += 1;
    }

    const timestamp = new Date(date).getTime();
    if (!isNaN(timestamp) && timestamp >= last7) {
      deptMap[dept].last7Steps += steps;
      deptMap[dept].last7Count += 1;
    }

    if (!monthMap[month]) monthMap[month] = { month, activityCount: 0, totalSteps: 0 };
    monthMap[month].activityCount += 1;
    monthMap[month].totalSteps += steps;

    csvRows.push({
      date,
      activityId: item.activityId || '',
      participantId: item.participantId || '',
      name: user.name || '',
      nick: user.nick || '',
      dept,
      steps,
      challenge: item.challenge === true || item.challenge === 'true',
      comment: item.comment || '',
      createdAt: item.createdAt || '',
      savedAt: item.savedAt || ''
    });
  });

  const deptRanking = Object.keys(deptMap).map(key => {
    const dept = deptMap[key];
    return {
      dept: dept.dept,
      userCount: Object.keys(dept.users).length,
      activityCount: dept.activityCount,
      totalSteps: dept.totalSteps,
      todaySteps: dept.todaySteps,
      todayCount: dept.todayCount,
      last7Steps: dept.last7Steps,
      last7Count: dept.last7Count
    };
  }).sort((a, b) => b.last7Steps - a.last7Steps || b.totalSteps - a.totalSteps);

  const monthly = Object.keys(monthMap)
    .map(key => monthMap[key])
    .sort((a, b) => String(b.month).localeCompare(String(a.month)));

  const inactiveMembers = members
    .filter(member => !member.lastDate || new Date(member.lastDate).getTime() < last7)
    .sort((a, b) => String(a.lastDate || '').localeCompare(String(b.lastDate || '')));

  const unsetMembers = members.filter(member => !String(member.dept || '').trim() || String(member.dept) === '所属未設定');
  const todayRows = csvRows.filter(row => row.date === today);

  return {
    generatedAt: new Date().toISOString(),
    today,
    totalUsers: members.length,
    totalActivities: activities.length,
    totalSteps: activities.reduce((sum, item) => sum + Number(item.steps || 0), 0),
    todayUsers: Object.keys(todayRows.reduce((map, row) => {
      map[row.participantId] = true;
      return map;
    }, {})).length,
    todayActivities: todayRows.length,
    todaySteps: todayRows.reduce((sum, row) => sum + Number(row.steps || 0), 0),
    ranking: rankMembers(members),
    deptRanking,
    monthly,
    csvRows,
    users: members,
    inactiveMembers,
    unsetMembers,
    departments: getDepartments(ss)
  };
}

function buildUserStats(users, activities, masked) {
  const byUser = {};

  users.forEach(user => {
    const id = normalizeEmployeeId(user.employeeId || user.id || '');
    if (!id) return;
    byUser[id] = {
      id,
      employeeId: id,
      name: masked ? maskName(user.name || '') : user.name || '',
      nick: user.nick || '',
      dept: user.dept || '',
      declaration: user.declaration || '',
      weeklyGoal: user.weeklyGoal || '',
      weeklyStepGoal: user.weeklyStepGoal || '',
      role: user.role || '',
      admin: user.admin || '',
      activityCount: 0,
      totalSteps: 0,
      lastDate: ''
    };
  });

  activities.forEach(item => {
    const id = normalizeEmployeeId(item.participantId || '');
    if (!id) return;
    if (!byUser[id]) {
      byUser[id] = {
        id,
        employeeId: id,
        name: 'ゲスト',
        nick: '',
        dept: '',
        declaration: '',
        weeklyGoal: '',
        weeklyStepGoal: '',
        role: '',
        admin: '',
        activityCount: 0,
        totalSteps: 0,
        lastDate: ''
      };
    }
    byUser[id].activityCount += 1;
    byUser[id].totalSteps += Number(item.steps || 0);
    if (!byUser[id].lastDate || String(item.date || '') > byUser[id].lastDate) {
      byUser[id].lastDate = String(item.date || '');
    }
  });

  return byUser;
}

function rankMembers(members) {
  return members.slice().sort((a, b) => {
    if (b.totalSteps !== a.totalSteps) return b.totalSteps - a.totalSteps;
    return b.activityCount - a.activityCount;
  });
}

function normalizeAdminActivityDate(value) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    return m[1] + '-' + String(Number(m[2])).padStart(2, '0') + '-' + String(Number(m[3])).padStart(2, '0');
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return '';
}

function adminTodayDateKey() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function detectActivitySource(deviceId) {
  const raw = String(deviceId || '').trim();
  const lower = raw.toLowerCase();
  if (!raw) return '-';
  if (lower.indexOf('admin-correction') >= 0) return '管理者修正';
  if (lower.indexOf('iphone-health') >= 0 || lower.indexOf('apple') >= 0) return 'Appleショートカット';
  if (raw.indexOf('D') === 0) return '手入力/アプリ';
  return raw;
}

function parseAdminSteps(raw) {
  const text = String(raw === undefined || raw === null ? '' : raw).trim();
  if (!text) throw new Error('steps_required');
  if (!/^\d+$/.test(text)) throw new Error('steps_integer_required');
  const value = Number(text);
  if (!isFinite(value) || value < 0) throw new Error('steps_invalid');
  if (value > 200000) throw new Error('steps_too_large');
  return value;
}

function getAdminActivityRows(ss, data) {
  const dateKey = normalizeAdminActivityDate(data.date || adminTodayDateKey());
  if (!dateKey) throw new Error('date_required');
  const today = adminTodayDateKey();
  if (dateKey > today) throw new Error('future_date_not_allowed');

  const query = String(data.query || '').trim().toLowerCase();
  const deptFilter = String(data.dept || '').trim();
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const rowByEmployee = {};

  activities.forEach(item => {
    const participantId = normalizeEmployeeId(item.participantId || '');
    if (!participantId) return;
    if (normalizeAdminActivityDate(item.date || '') !== dateKey) return;

    const current = rowByEmployee[participantId];
    const currentKey = current ? String(current.savedAt || current.createdAt || '') : '';
    const nextKey = String(item.savedAt || item.createdAt || '');
    if (!current || nextKey >= currentKey) rowByEmployee[participantId] = item;
  });

  const rows = users
    .map(user => {
      const employeeId = normalizeEmployeeId(user.employeeId || user.id || '');
      if (!employeeId) return null;
      const name = String(user.name || user.nick || employeeId);
      const dept = String(user.dept || '所属未設定');
      const searchText = [name, employeeId, dept, String(user.nick || '')].join(' ').toLowerCase();
      if (query && searchText.indexOf(query) < 0) return null;
      if (deptFilter && dept !== deptFilter) return null;

      const act = rowByEmployee[employeeId] || null;
      const currentSteps = act ? Number(act.steps || 0) : 0;
      return {
        employeeId,
        name,
        dept,
        currentSteps,
        source: act ? detectActivitySource(act.deviceId || '') : '-',
        updatedAt: act ? String(act.savedAt || act.createdAt || '') : '',
        activityId: act ? String(act.activityId || '') : '',
        hasRecord: !!act
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.dept || '').localeCompare(String(b.dept || '')) || String(a.name || '').localeCompare(String(b.name || '')));

  const departments = Array.from(new Set(users.map(user => String(user.dept || '').trim()).filter(Boolean))).sort();
  return { date: dateKey, total: rows.length, departments, rows };
}

function saveAdminActivityCorrection(ss, data) {
  const dateKey = normalizeAdminActivityDate(data.date || '');
  if (!dateKey) throw new Error('date_required');
  if (dateKey > adminTodayDateKey()) throw new Error('future_date_not_allowed');

  const targetEmployeeId = normalizeEmployeeId(data.targetEmployeeId || data.employeeIdTarget || data.participantId || '');
  if (!targetEmployeeId) throw new Error('target_employee_id_required');

  const reason = String(data.reason || '').trim();
  if (!reason) throw new Error('reason_required');
  if (reason.length > 200) throw new Error('reason_too_long');

  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const targetUser = users.find(user => normalizeEmployeeId(user.employeeId || user.id || '') === targetEmployeeId);
  if (!targetUser) throw new Error('target_user_not_found');

  const newSteps = parseAdminSteps(data.newSteps !== undefined ? data.newSteps : data.steps);
  const activitySheet = ss.getSheetByName(SHEET_ACTIVITIES);
  const rows = readTable(activitySheet)
    .filter(item => normalizeEmployeeId(item.participantId || '') === targetEmployeeId)
    .filter(item => normalizeAdminActivityDate(item.date || '') === dateKey)
    .sort((a, b) => String(b.savedAt || b.createdAt || '').localeCompare(String(a.savedAt || a.createdAt || '')));

  const latest = rows.length ? rows[0] : null;
  const beforeSteps = latest ? Number(latest.steps || 0) : 0;
  if (beforeSteps === newSteps) throw new Error('same_steps');

  const activityId = latest && latest.activityId
    ? String(latest.activityId)
    : (targetEmployeeId + '_' + String(dateKey || '').replace(/-/g, ''));

  const saved = saveActivity(ss, {
    activityId,
    participantId: targetEmployeeId,
    deviceId: 'admin-correction',
    date: dateKey,
    steps: newSteps,
    challenge: latest ? (latest.challenge === true || String(latest.challenge).toUpperCase() === 'TRUE') : false,
    comment: latest ? String(latest.comment || '') : '',
    createdAt: latest ? String(latest.createdAt || new Date().toISOString()) : new Date().toISOString(),
    version: VERSION
  });

  invalidateActivityCaches();

  const savedRow = saved && saved.row > 1 ? rowToObject(activitySheet, saved.row) : null;
  const actor = getUserPermissionContext(ss, data || {}) || {};
  const correctedAt = new Date().toISOString();

  auditAction(
    ss,
    'adminActivityCorrection',
    Object.assign({}, data || {}, {
      targetType: 'activity',
      targetId: activityId
    }),
    'ok',
    'activity_corrected',
    {
      targetEmployeeId,
      targetName: String(targetUser.name || targetUser.nick || targetEmployeeId),
      targetDate: dateKey,
      beforeSteps,
      afterSteps: newSteps,
      reason,
      adminEmployeeId: String(actor.employeeId || ''),
      adminName: String(actor.name || ''),
      correctedAt,
      operationType: 'activity_correction',
      activityId
    }
  );

  return {
    targetEmployeeId,
    targetName: String(targetUser.name || targetUser.nick || targetEmployeeId),
    targetDept: String(targetUser.dept || '所属未設定'),
    date: dateKey,
    beforeSteps,
    afterSteps: newSteps,
    reason,
    adminEmployeeId: String(actor.employeeId || ''),
    adminName: String(actor.name || ''),
    correctedAt,
    operationType: 'activity_correction',
    activityId,
    source: detectActivitySource(savedRow ? savedRow.deviceId : 'admin-correction'),
    updatedAt: String(savedRow ? (savedRow.savedAt || savedRow.createdAt || correctedAt) : correctedAt)
  };
}
