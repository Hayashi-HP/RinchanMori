const RinchanHomeDashboard = (() => {
  const VERSION = 'v1.0.0';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return match[1] + '-' + String(match[2]).padStart(2, '0') + '-' + String(match[3]).padStart(2, '0');
    const parsed = new Date(raw);
    return isNaN(parsed) ? raw.slice(0, 10) : dateKey(parsed);
  }

  function participant() {
    if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant() || {};
    return readJson('rinchanParticipant', {}) || {};
  }

  function todaySteps() {
    const today = dateKey(new Date());
    const rows = readJson('rinchanActivities', []);
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((total, row) => normalizeDateKey(row.date || row.createdAt || row.savedAt) === today ? total + Number(row.steps || 0) : total, 0);
  }

  function render() {
    const value = document.getElementById('todayStepsNumber');
    const ring = document.querySelector('.today-ring');
    const status = document.getElementById('todayStepsStatus');
    const goalText = document.getElementById('todayStepsGoal');
    const dateText = document.getElementById('todayDate');
    if (!value || !ring || !status) return;
    const steps = todaySteps();
    const user = participant();
    const goal = Math.max(1, Number(String(user.dailyStepGoal || user.stepGoal || 8000).replace(/,/g, '')) || 8000);
    const percentage = Math.min(100, Math.round((steps / goal) * 100));
    const remaining = Math.max(0, goal - steps);
    value.textContent = steps.toLocaleString('ja-JP');
    ring.style.setProperty('--today-progress', percentage * 3.6 + 'deg');
    ring.style.setProperty('--today-blue-progress', percentage * 3.6 * 0.58 + 'deg');
    ring.setAttribute('aria-valuenow', String(percentage));
    if (goalText) goalText.textContent = '目標 ' + goal.toLocaleString('ja-JP') + '歩';
    if (dateText) {
      const now = new Date();
      const weeks = ['日', '月', '火', '水', '木', '金', '土'];
      dateText.textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日（' + weeks[now.getDay()] + '）';
    }
    status.textContent = remaining > 0 ? '目標 ' + goal.toLocaleString('ja-JP') + '歩まで、あと ' + remaining.toLocaleString('ja-JP') + '歩' : '今日の目標を達成しました。おつかれさまです。';
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('pageshow', () => setTimeout(render, 80));
  return { VERSION, render, todaySteps };
})();
window.RinchanHomeDashboard = RinchanHomeDashboard;
