const RinchanHomeDashboard = (() => {
  const VERSION = 'v1.1.0';

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

  function weekDays(base) {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });
  }

  function totalsByDate() {
    const totals = {};
    const rows = readJson('rinchanActivities', []);
    if (!Array.isArray(rows)) return totals;
    rows.forEach(row => {
      const key = normalizeDateKey(row.date || row.createdAt || row.savedAt);
      if (key) totals[key] = Math.max(totals[key] || 0, Number(row.steps || 0));
    });
    return totals;
  }

  function currentWeekSteps() {
    const totals = totalsByDate();
    return weekDays(new Date()).reduce((sum, day) => sum + Number(totals[dateKey(day)] || 0), 0);
  }

  function render() {
    const value = document.getElementById('todayStepsNumber');
    const ring = document.querySelector('.today-ring');
    const status = document.getElementById('todayStepsStatus');
    const goalText = document.getElementById('todayStepsGoal');
    const dateText = document.getElementById('todayDate');
    if (!value || !ring || !status) return;
    const steps = currentWeekSteps();
    const user = participant();
    const customGoal = Number(String(user.weeklyStepGoal || '').replace(/,/g, '')) || 0;
    const dailyGoal = Number(String(user.dailyStepGoal || user.stepGoal || 8000).replace(/,/g, '')) || 8000;
    const goal = Math.max(1, customGoal || dailyGoal * 7);
    const rawPercentage = Math.round((steps / goal) * 100);
    const percentage = Math.min(100, rawPercentage);
    const overflowPercentage = Math.min(100, Math.max(0, rawPercentage - 100));
    const remaining = Math.max(0, goal - steps);
    const exceeded = Math.max(0, steps - goal);
    value.textContent = steps.toLocaleString('ja-JP');
    ring.style.setProperty('--today-progress', percentage * 3.6 + 'deg');
    ring.style.setProperty('--today-blue-progress', percentage * 3.6 * 0.58 + 'deg');
    ring.style.setProperty('--today-overflow', overflowPercentage * 3.6 + 'deg');
    ring.setAttribute('aria-valuenow', String(percentage));
    ring.setAttribute('aria-valuetext', steps.toLocaleString('ja-JP') + '歩、週間目標の' + rawPercentage + '%');
    if (goalText) goalText.textContent = (customGoal ? '週間目標 ' : '標準目標 ') + goal.toLocaleString('ja-JP') + '歩';
    if (dateText) {
      const days = weekDays(new Date());
      dateText.textContent = (days[0].getMonth() + 1) + '/' + days[0].getDate() + '〜' + (days[6].getMonth() + 1) + '/' + days[6].getDate();
    }
    status.textContent = remaining > 0
      ? '週間目標まで、あと ' + remaining.toLocaleString('ja-JP') + '歩'
      : exceeded > 0
        ? '目標達成！ さらに +' + exceeded.toLocaleString('ja-JP') + '歩（' + rawPercentage + '%）'
        : '週間目標を達成しました（100%）';
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('pageshow', () => setTimeout(render, 80));
  return { VERSION, render, todaySteps, currentWeekSteps };
})();
window.RinchanHomeDashboard = RinchanHomeDashboard;
