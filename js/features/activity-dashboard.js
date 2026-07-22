const RinchanActivityDashboard = (() => {
  const VERSION = 'v1.5.32';

  function readJson(key, fallback) {
    if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function participant() {
    if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant() || {};
    return readJson('rinchanParticipant', {}) || {};
  }
  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    return isNaN(parsed) ? raw.slice(0, 10) : dateKey(parsed);
  }
  function displayDate(key) {
    const parts = String(key || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[1] || !parts[2]) return '今日';
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return parts[1] + '月' + parts[2] + '日（' + ['日','月','火','水','木','金','土'][date.getDay()] + '）';
  }
  function totalsByDate() {
    const totals = {};
    readJson('rinchanActivities', []).forEach(item => {
      const key = normalizeDateKey(item.date || item.createdAt);
      if (key) totals[key] = Math.max(totals[key] || 0, Number(item.steps || 0));
    });
    return totals;
  }
  function weekDays(base) {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });
  }
  function render() {
    const dateInput = document.getElementById('activityDate');
    if (!dateInput) return;
    const selectedKey = normalizeDateKey(dateInput.value) || dateKey(new Date());
    const totals = totalsByDate();
    const steps = Number(totals[selectedKey] || 0);
    const user = participant();
    const goal = Math.max(1, Number(String(user.dailyStepGoal || user.stepGoal || 8000).replace(/,/g, '')) || 8000);
    const percent = Math.min(100, Math.round((steps / goal) * 100));
    const ring = document.getElementById('activityProgressRing');
    const stepsEl = document.getElementById('activitySummarySteps');
    const goalEl = document.getElementById('activitySummaryGoal');
    const dateEl = document.getElementById('activitySummaryDate');
    if (ring) { ring.style.setProperty('--activity-progress', (percent * 3.6) + 'deg'); ring.style.setProperty('--activity-blue-progress', (percent * 2.1) + 'deg'); ring.setAttribute('aria-valuenow', String(percent)); }
    if (stepsEl) stepsEl.textContent = steps.toLocaleString('ja-JP');
    if (goalEl) goalEl.textContent = '目標 ' + goal.toLocaleString('ja-JP') + '歩';
    if (dateEl) dateEl.textContent = displayDate(selectedKey);

    const selectedDate = new Date(selectedKey + 'T00:00:00');
    const days = weekDays(isNaN(selectedDate) ? new Date() : selectedDate);
    const values = days.map(day => Number(totals[dateKey(day)] || 0));
    const maximum = Math.max(goal, ...values, 1);
    const total = values.reduce((sum, value) => sum + value, 0);
    const totalEl = document.getElementById('activityWeekTotal');
    const barsEl = document.getElementById('activityWeekBars');
    if (totalEl) totalEl.textContent = total.toLocaleString('ja-JP') + '歩';
    if (barsEl) barsEl.innerHTML = values.map((value, index) => {
      const height = value ? Math.max(8, Math.round((value / maximum) * 100)) : 3;
      const isSelected = dateKey(days[index]) === selectedKey ? ' is-selected' : '';
      return '<div class="activity-bar' + isSelected + '" title="' + value.toLocaleString('ja-JP') + '歩"><div><span style="height:' + height + '%"></span></div><small>' + ['月','火','水','木','金','土','日'][index] + '</small></div>';
    }).join('');
  }
  function install() {
    const input = document.getElementById('activityDate');
    if (input && !input.__rinchanDashboardInstalled) { input.__rinchanDashboardInstalled = true; input.addEventListener('change', render); }
    render();
    setTimeout(render, 300);
  }
  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', render);
  return { VERSION, render };
})();
window.RinchanActivityDashboard = RinchanActivityDashboard;
