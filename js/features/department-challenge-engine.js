const RinchanDepartmentChallengeEngine = (() => {
  const VERSION = 'v1.4.14';
  const TARGET = 1000000;

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    return readJson('rinchanParticipant', null);
  }

  function employeeId() {
    const p = participant() || {};
    return String(p.employeeId || p.id || p.participantId || '').trim();
  }

  function departmentName() {
    const p = participant() || {};
    return String(p.department || p.dept || p.departmentName || p.group || '所属未設定').trim() || '所属未設定';
  }

  function ym(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return parsed.getFullYear() + '-' + String(parsed.getMonth() + 1).padStart(2, '0') + '-' + String(parsed.getDate()).padStart(2, '0');
    return raw.slice(0, 10);
  }

  function globalState() {
    try {
      if (window.RinchanSync && typeof RinchanSync.getState === 'function') return RinchanSync.getState();
    } catch(e) {}
    return readJson('rinchanServerState', null) || {};
  }

  function allActivityRows() {
    const state = globalState() || {};
    const candidates = [
      state.allActivities,
      state.activitiesAll,
      state.allSteps,
      state.stepRecords,
      readJson('rinchanAllActivities', []),
      readJson('rinchanAllSteps', []),
      readJson('rinchanStepRecords', [])
    ];
    for (const rows of candidates) {
      if (Array.isArray(rows) && rows.length) return rows;
    }
    return [];
  }

  function members() {
    const state = globalState() || {};
    const rows = state.moriMembers || state.members || state.users || state.participants || readJson('rinchanMoriMembers', []);
    return Array.isArray(rows) ? rows : [];
  }

  function memberDeptMap() {
    const map = {};
    members().forEach(member => {
      const dept = String(member.dept || member.department || member.departmentName || member.group || '').trim();
      if (!dept) return;
      [member.employeeId, member.participantId, member.id, member.userId, member.staffId].forEach(id => {
        const key = String(id || '').trim();
        if (key) map[key] = dept;
      });
    });
    return map;
  }

  function rowDate(row) {
    return normalizeDateKey(row.date || row.activityDate || row.createdAt || row.savedAt || row.datetime || '');
  }

  function rowSteps(row) {
    return Number(row.steps || row.step || row.count || row.totalSteps || 0);
  }

  function rowOwner(row) {
    return String(row.employeeId || row.participantId || row.id || row.userId || row.staffId || '').trim();
  }

  function rowDepartment(row, deptMap) {
    const direct = String(row.department || row.dept || row.departmentName || row.group || '').trim();
    if (direct) return direct;
    return deptMap[rowOwner(row)] || '';
  }

  function rowKey(row) {
    const activityId = String(row.activityId || row.recordId || '').trim();
    if (activityId) return 'activity:' + activityId;
    return [rowOwner(row), rowDate(row), rowSteps(row), row.createdAt || row.savedAt || ''].join('|');
  }

  function monthlyDepartmentSteps(date) {
    const dept = departmentName();
    if (!dept || dept === '所属未設定') return { current:0, available:false, count:0 };
    const key = ym(date);
    const rows = allActivityRows();
    if (!rows.length) return { current:0, available:false, count:0 };
    const deptMap = memberDeptMap();
    const seen = {};
    let matched = 0;
    const total = rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      const rd = rowDepartment(row, deptMap);
      if (rd !== dept) return sum;
      const k = rowKey(row);
      if (seen[k]) return sum;
      seen[k] = true;
      matched += 1;
      return sum + rowSteps(row);
    }, 0);
    return { current:total, available:matched > 0, count:matched };
  }

  function build(date) {
    const dept = departmentName();
    const result = monthlyDepartmentSteps(date);
    const current = result.current;
    const rate = TARGET > 0 ? Math.min(100, Math.round((current / TARGET) * 100)) : 0;
    const remain = Math.max(0, TARGET - current);
    return {
      version: VERSION,
      department: dept,
      title: '部署チャレンジ',
      target: TARGET,
      current,
      count: result.count || 0,
      remain,
      rate,
      achieved: current >= TARGET,
      available: result.available,
      message: result.available ? (current >= TARGET ? '部署チャレンジ達成！みんなの歩みが集まりました。' : dept + 'であと' + remain.toLocaleString('ja-JP') + '歩。') : '部署全体の歩数は、サーバー同期後に表示されます。'
    };
  }

  return { VERSION, build, monthlyDepartmentSteps };
})();
window.RinchanDepartmentChallengeEngine = RinchanDepartmentChallengeEngine;