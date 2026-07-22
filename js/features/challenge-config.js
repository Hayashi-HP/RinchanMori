const RinchanChallengeConfig = (() => {
  const VERSION = 'v1.0.0';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function yearMonth(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function active(value) {
    return value === true || value === 1 || String(value || '').toLowerCase() === 'true' || String(value || '') === '1';
  }

  function rows() {
    const list = readJson('rinchanChallenges', []);
    return Array.isArray(list) ? list : [];
  }

  function normalize(row) {
    return {
      challengeId: String(row.challengeId || ''),
      yearMonth: String(row.yearMonth || ''),
      scope: String(row.scope || '').toLowerCase(),
      targetDept: String(row.targetDept || ''),
      title: String(row.title || ''),
      icon: String(row.icon || ''),
      message: String(row.message || ''),
      targetSteps: Number(row.targetSteps || 0),
      active: active(row.active)
    };
  }

  function resolve(scope, date, department) {
    const targetMonth = yearMonth(date);
    const targetScope = String(scope || '').toLowerCase();
    const candidates = rows().map(normalize).filter(row => row.yearMonth === targetMonth && row.scope === targetScope);
    if (!candidates.length) return null;
    if (targetScope !== 'department') return candidates[0];
    const dept = String(department || '').trim();
    return candidates.find(row => row.targetDept === dept)
      || candidates.find(row => row.targetDept === '*')
      || null;
  }

  function updateHeading() {
    const title = document.getElementById('passportChallengeTitle');
    if (!title) return;
    const ids = ['monthlyChallengeSection', 'departmentChallengeSection', 'hospitalChallengeSection'];
    const count = ids.reduce((total, id) => {
      const element = document.getElementById(id);
      return total + (element && !element.classList.contains('hidden') ? 1 : 0);
    }, 0);
    title.textContent = count > 0 ? count + 'つの目標' : '今月の設定はありません';
  }

  return { VERSION, resolve, rows, yearMonth, updateHeading };
})();

window.RinchanChallengeConfig = RinchanChallengeConfig;
