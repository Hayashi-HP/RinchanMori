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
  const settings = getPublicAppSettings(ss);
  const inactiveBefore = Date.now() - Number(settings.inactivityAlertDays || 7) * 86400000;

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
    .filter(member => !member.lastDate || new Date(member.lastDate).getTime() < inactiveBefore)
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
    departments: getDepartments(ss),
    settings
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
      dailyStepGoal: user.dailyStepGoal || '',
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
        dailyStepGoal: '',
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

function adminUserRoleOptions() {
  return [
    { value: ROLE_GENERAL, label: '一般' },
    { value: ROLE_LEADER, label: 'リーダー' },
    { value: ROLE_HEAD, label: '責任者' },
    { value: ROLE_MANAGER, label: '管理職' },
    { value: ROLE_ADMIN, label: '管理者' },
    { value: ROLE_SYSTEM, label: 'システム管理者' }
  ];
}

function adminUserSummary(user, activityStat) {
  const employeeId = normalizeEmployeeId(user.employeeId || user.id || '');
  const role = normalizeRole(user.role, user.admin);
  const stat = activityStat || {};
  return {
    employeeId,
    name: String(user.name || ''),
    nick: String(user.nick || ''),
    dept: String(user.dept || ''),
    email: String(user.email || ''),
    role,
    admin: role === ROLE_ADMIN || role === ROLE_SYSTEM ? '1' : '',
    weeklyStepGoal: String(user.weeklyStepGoal || ''),
    dailyStepGoal: String(user.dailyStepGoal || ''),
    activityCount: Number(stat.activityCount || 0),
    totalSteps: Number(stat.totalSteps || 0),
    lastDate: String(stat.lastDate || ''),
    updatedAt: String(user.updatedAt || user.lastSavedAt || '')
  };
}

function listAdminUsers(ss, data) {
  const query = String(data.query || '').trim().toLowerCase();
  const deptFilter = String(data.dept || '').trim();
  const roleFilter = String(data.role || '').trim().toLowerCase();
  const users = readTable(ss.getSheetByName(SHEET_USERS));
  const activities = readTable(ss.getSheetByName(SHEET_ACTIVITIES));
  const stats = buildUserStats(users, activities, false);

  const rows = users.map(user => {
    const employeeId = normalizeEmployeeId(user.employeeId || user.id || '');
    if (!employeeId) return null;
    const row = adminUserSummary(user, stats[employeeId]);
    const searchText = [row.employeeId, row.name, row.nick, row.dept, row.email].join(' ').toLowerCase();
    if (query && searchText.indexOf(query) < 0) return null;
    if (deptFilter && row.dept !== deptFilter) return null;
    if (roleFilter && row.role !== roleFilter) return null;
    return row;
  }).filter(Boolean).sort((a, b) => {
    return String(a.dept || '').localeCompare(String(b.dept || ''), 'ja')
      || String(a.name || a.employeeId).localeCompare(String(b.name || b.employeeId), 'ja');
  });

  return {
    users: rows,
    total: rows.length,
    departments: getDepartments(ss).map(item => item.deptName).filter(Boolean),
    roles: adminUserRoleOptions(),
    generatedAt: new Date().toISOString()
  };
}

function adminUserColumnMap(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return headers.reduce((map, header, index) => {
    map[String(header || '').trim()] = index + 1;
    return map;
  }, {});
}

function parseAdminWeeklyStepGoal(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim();
  if (!raw) return '';
  if (!/^\d+$/.test(raw)) throw new Error('weekly_step_goal_integer_required');
  const goal = Number(raw);
  if (!isFinite(goal) || goal < 1000 || goal > 1000000) throw new Error('weekly_step_goal_out_of_range');
  return goal;
}

function parseAdminDailyStepGoal(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim();
  if (!raw) return '';
  const goal = validDailyStepGoal(raw);
  if (!goal) throw new Error('daily_step_goal_out_of_range');
  return goal;
}

function updateAdminUser(ss, data) {
  const actor = getUserPermissionContext(ss, data);
  if (!actor || actor.permissions.indexOf(PERMISSION_MANAGE_USERS) < 0) throw new Error('manage_users_required');

  const targetEmployeeId = normalizeEmployeeId(data.targetEmployeeId || data.userEmployeeId || '');
  if (!targetEmployeeId) throw new Error('target_employee_id_required');

  const sheet = ss.getSheetByName(SHEET_USERS);
  const users = readTable(sheet);
  const targetIndex = users.findIndex(user => normalizeEmployeeId(user.employeeId || user.id || '') === targetEmployeeId);
  if (targetIndex < 0) throw new Error('user_not_found');

  const target = users[targetIndex];
  const name = String(data.name || '').trim();
  const nick = String(data.nick || '').trim();
  const dept = String(data.dept || '').trim();
  const emailRaw = String(data.email || '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : '';
  const roleRaw = String(data.role || '').trim().toLowerCase();
  const role = normalizeRole(roleRaw, '');
  const weeklyStepGoal = parseAdminWeeklyStepGoal(data.weeklyStepGoal);
  const dailyStepGoal = parseAdminDailyStepGoal(data.dailyStepGoal);

  if (!name) throw new Error('name_required');
  if (name.length > 80) throw new Error('name_too_long');
  if (nick.length > 40) throw new Error('nick_too_long');
  if (dept.length > 80) throw new Error('dept_too_long');
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email_invalid');
  if (email.length > 160) throw new Error('email_too_long');
  if (!ROLE_LEVELS[roleRaw]) throw new Error('role_invalid');
  if (actor.employeeId === targetEmployeeId && role !== ROLE_ADMIN && role !== ROLE_SYSTEM) {
    throw new Error('self_admin_role_required');
  }

  const rowNumber = targetIndex + 2;
  const columns = adminUserColumnMap(sheet);
  const now = new Date().toISOString();
  const updates = {
    name,
    nick,
    dept,
    email,
    role,
    admin: role === ROLE_ADMIN || role === ROLE_SYSTEM ? '1' : '',
    weeklyStepGoal,
    dailyStepGoal,
    updatedAt: now,
    lastSavedAt: now,
    version: VERSION
  };

  Object.keys(updates).forEach(key => {
    if (columns[key]) sheet.getRange(rowNumber, columns[key]).setValue(updates[key]);
  });

  Object.keys(updates).forEach(key => { target[key] = updates[key]; });
  invalidateUserCaches();
  return adminUserSummary(target, null);
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
    const participantId = normalizeEmployeeId(item.participantId || item.employeeId || item.id || '');
    if (!participantId) return;
    if (normalizeAdminActivityDate(item.date || item.createdAt || item.savedAt || '') !== dateKey) return;

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

      const userIds = [employeeId, normalizeEmployeeId(user.id || ''), normalizeEmployeeId(user.participantId || '')].filter(Boolean);
      const matches = userIds.map(id => rowByEmployee[id]).filter(Boolean).sort((a, b) => String(b.savedAt || b.createdAt || '').localeCompare(String(a.savedAt || a.createdAt || '')));
      const act = matches.length ? matches[0] : null;
      const rawSteps = act && act.steps !== undefined && act.steps !== null ? act.steps : (act && act.stepCount !== undefined ? act.stepCount : 0);
      const currentSteps = Number(rawSteps || 0);
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
    version: VERSION,
    correctionMode: true,
    inputSource: 'admin'
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
