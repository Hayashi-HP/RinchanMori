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
