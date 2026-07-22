const RinchanHospitalChallengeEngine = (() => {
  const VERSION = 'v1.4.14';
  const DEFAULT_TARGET = 20000000;

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
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

  function rowDate(row) {
    return normalizeDateKey(row.date || row.activityDate || row.createdAt || row.savedAt || row.datetime || '');
  }

  function rowSteps(row) {
    return Number(row.steps || row.step || row.count || row.totalSteps || 0);
  }

  function rowOwner(row) {
    return String(row.employeeId || row.participantId || row.id || row.userId || row.staffId || '').trim();
  }

  function rowKey(row) {
    const activityId = String(row.activityId || row.recordId || '').trim();
    if (activityId) return 'activity:' + activityId;
    return [rowOwner(row), rowDate(row), rowSteps(row), row.createdAt || row.savedAt || ''].join('|');
  }

  function monthlyTotal(date) {
    const key = ym(date);
    const rows = allActivityRows();
    if (!rows.length) return { available:false, total:0, count:0 };
    const seen = {};
    let count = 0;
    const total = rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      const k = rowKey(row);
      if (seen[k]) return sum;
      seen[k] = true;
      count += 1;
      return sum + rowSteps(row);
    }, 0);
    return { available:true, total, count };
  }

  function build(date) {
    const data = monthlyTotal(date);
    const managed = window.RinchanChallengeConfig && typeof RinchanChallengeConfig.resolve === 'function'
      ? RinchanChallengeConfig.resolve('hospital', date)
      : null;
    const target = managed && managed.targetSteps ? managed.targetSteps : DEFAULT_TARGET;
    const rate = target > 0 ? Math.min(100, Math.round((data.total / target) * 100)) : 0;
    return {
      version: VERSION,
      enabled: managed ? managed.active : true,
      ym: ym(date),
      icon: managed && managed.icon ? managed.icon : '🏥',
      title: managed && managed.title ? managed.title : '病院みんなのチャレンジ',
      target,
      current: data.total,
      count: data.count || 0,
      remain: Math.max(0, target - data.total),
      rate,
      available: data.available,
      achieved: data.total >= target,
      message: data.available ? (data.total >= target ? '病院みんなで達成しました！' : ((managed && managed.message) || '今月は病院全体で2,000万歩を目指します。')) : '病院全体チャレンジは準備中です。サーバー同期後に表示されます。'
    };
  }

  return { VERSION, build, monthlyTotal };
})();
window.RinchanHospitalChallengeEngine = RinchanHospitalChallengeEngine;
