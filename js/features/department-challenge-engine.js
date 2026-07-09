const RinchanDepartmentChallengeEngine = (() => {
  const VERSION = 'v1.3.9';
  const TARGET = 1000000;

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null'); } catch(e) { return null; }
  }

  function departmentName() {
    const p = participant() || {};
    return p.department || p.dept || p.departmentName || p.group || '所属未設定';
  }

  function ym(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function readRows() {
    const candidates = [];
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getSteps === 'function') candidates.push(RinchanStorage.getSteps());
    } catch(e) {}
    ['rinchanSteps','rinchanAllSteps','rinchanStepRecords','rinchanActivities'].forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) candidates.push(JSON.parse(raw));
      } catch(e) {}
    });
    return candidates.find(Array.isArray) || [];
  }

  function rowDate(row) {
    return String(row.date || row.activityDate || row.createdAt || row.datetime || '').slice(0, 10);
  }

  function rowDepartment(row) {
    return String(row.department || row.dept || row.departmentName || row.group || '').trim();
  }

  function monthlyDepartmentSteps(date) {
    const dept = departmentName();
    if (!dept || dept === '所属未設定') return { current:0, available:false };
    const key = ym(date);
    const rows = readRows();
    if (!Array.isArray(rows) || !rows.length) return { current:0, available:false };
    let matched = 0;
    const total = rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      const rd = rowDepartment(row);
      if (rd && rd !== dept) return sum;
      matched += 1;
      return sum + Number(row.steps || row.step || row.count || 0);
    }, 0);
    return { current:total, available:matched > 0 };
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
      remain,
      rate,
      achieved: current >= TARGET,
      available: result.available,
      message: result.available ? (current >= TARGET ? '部署チャレンジ達成！みんなの歩みが集まりました。' : dept + 'であと' + remain.toLocaleString('ja-JP') + '歩。') : '部署全体の歩数は、同期後に表示されます。'
    };
  }

  return { VERSION, build, monthlyDepartmentSteps };
})();
window.RinchanDepartmentChallengeEngine = RinchanDepartmentChallengeEngine;
