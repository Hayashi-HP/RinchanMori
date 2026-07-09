const RinchanMonthlyChallengeEngine = (() => {
  const VERSION = 'v1.3.7';
  const DEFAULT_TARGET = 200000;

  function ym(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function title(date) {
    const d = date || new Date();
    return (d.getMonth() + 1) + '月のチャレンジ';
  }

  function getSteps() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getSteps === 'function') return RinchanStorage.getSteps();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanSteps') || '[]'); } catch(e) { return []; }
  }

  function rowDate(row) {
    return String(row.date || row.activityDate || row.createdAt || row.datetime || '').slice(0, 10);
  }

  function monthlySteps(date) {
    const key = ym(date);
    const rows = getSteps();
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      return sum + Number(row.steps || row.step || row.count || 0);
    }, 0);
  }

  function daysLeft(date) {
    const d = date || new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.max(0, last - d.getDate() + 1);
  }

  function build(date) {
    const current = monthlySteps(date);
    const target = DEFAULT_TARGET;
    const rate = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const remain = Math.max(0, target - current);
    return {
      version: VERSION,
      ym: ym(date),
      title: title(date),
      target,
      current,
      remain,
      rate,
      achieved: current >= target,
      daysLeft: daysLeft(date),
      message: current >= target ? '今月のチャレンジ達成！すばらしい歩みです。' : 'あと' + remain.toLocaleString('ja-JP') + '歩で今月の目標達成です。'
    };
  }

  return { VERSION, build, monthlySteps };
})();
window.RinchanMonthlyChallengeEngine = RinchanMonthlyChallengeEngine;
