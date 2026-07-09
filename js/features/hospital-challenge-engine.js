const RinchanHospitalChallengeEngine = (() => {
  const VERSION = 'v1.4.0';
  const DEFAULT_TARGET = 20000000;

  function ym(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function globalState() {
    try {
      if (window.RinchanSync && typeof RinchanSync.getState === 'function') return RinchanSync.getState();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanServerState') || 'null'); } catch(e) { return null; }
  }

  function readAllSteps() {
    const state = globalState() || {};
    const candidates = [state.steps, state.activities, state.records, state.allSteps, state.stepRecords];
    for (const c of candidates) if (Array.isArray(c)) return c;
    try {
      const raw = localStorage.getItem('rinchanAllSteps') || localStorage.getItem('rinchanStepsAll');
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) return list;
    } catch(e) {}
    return [];
  }

  function rowDate(row) {
    return String(row.date || row.activityDate || row.createdAt || row.datetime || '').slice(0, 10);
  }

  function monthlyTotal(date) {
    const key = ym(date);
    const rows = readAllSteps();
    if (!Array.isArray(rows) || !rows.length) return { available:false, total:0 };
    const total = rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      return sum + Number(row.steps || row.step || row.count || 0);
    }, 0);
    return { available:true, total };
  }

  function build(date) {
    const data = monthlyTotal(date);
    const target = DEFAULT_TARGET;
    const rate = target > 0 ? Math.min(100, Math.round((data.total / target) * 100)) : 0;
    return {
      version: VERSION,
      ym: ym(date),
      title: '🏥 病院みんなのチャレンジ',
      target,
      current: data.total,
      remain: Math.max(0, target - data.total),
      rate,
      available: data.available,
      achieved: data.total >= target,
      message: data.available ? (data.total >= target ? '病院みんなで達成しました！' : '今月は病院全体で2,000万歩を目指します。') : '病院全体チャレンジは準備中です。サーバー同期後に表示されます。'
    };
  }

  return { VERSION, build };
})();
window.RinchanHospitalChallengeEngine = RinchanHospitalChallengeEngine;
