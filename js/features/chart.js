const RinchanChart = (() => {
  const VERSION = 'v0.9.93';

  function readJson(key, fallback) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function num(value) {
    return Number(value || 0).toLocaleString('ja-JP');
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return dateKey(parsed);
    return raw.slice(0, 10);
  }

  function shortDate(date) {
    return (date.getMonth() + 1) + '/' + date.getDate();
  }

  function dateWithWeek(date) {
    const weeks = ['日', '月', '火', '水', '木', '金', '土'];
    return shortDate(date) + '（' + weeks[date.getDay()] + '）';
  }

  function weekStartMonday(base) {
    const date = new Date(base);
    date.setHours(0, 0, 0, 0);
    const diff = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - diff);
    return date;
  }

  function participant() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant() || {};
    return readJson('rinchanParticipant', {}) || {};
  }

  function barHeight(value, max) {
    if (!value || !max) return 0;
    return Math.max(12, Math.min(100, Math.round((value / max) * 100)));
  }

  function renderWeeklySteps() {
    const box = document.getElementById('weeklyStepsChart');
    if (!box) return;

    const activities = readJson('rinchanActivities', []);
    const user = participant();
    const settings = readJson('rinchanAppSettings', {}) || {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = weekStartMonday(today);
    const lastStart = new Date(start);
    lastStart.setDate(start.getDate() - 7);

    const days = [];
    const lastDays = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);

      const lastDay = new Date(lastStart);
      lastDay.setDate(lastStart.getDate() + i);
      lastDays.push(lastDay);
    }

    const totals = {};
    activities.forEach(activity => {
      const key = normalizeDateKey(activity.date || activity.createdAt);
      if (!key) return;
      totals[key] = (totals[key] || 0) + Number(activity.steps || 0);
    });

    const values = days.map(day => totals[dateKey(day)] || 0);
    const lastValues = lastDays.map(day => totals[dateKey(day)] || 0);
    const weekTotal = values.reduce((sum, value) => sum + value, 0);
    const lastTotal = lastValues.reduce((sum, value) => sum + value, 0);
    const diff = weekTotal - lastTotal;
    const best = Math.max(...values);
    const max = best > 0 ? best * 1.1 : 1000;
    const range = dateWithWeek(days[0]) + '〜' + dateWithWeek(days[6]);
    const goal = Number(String(user.weeklyStepGoal || settings.defaultWeeklyStepGoal || 56000).replace(/,/g, ''));
    const hasGoal = goal > 0;
    const remain = hasGoal ? Math.max(0, goal - weekTotal) : 0;

    const goalHtml = hasGoal
      ? '<p class="steps-goal">目標 ' + num(goal) + '歩まで ' + (remain > 0 ? 'あと ' + num(remain) + '歩' : '達成しました') + '</p>'
      : '';
    const diffHtml = lastTotal > 0
      ? '<p class="steps-trend">📊 ' + (diff >= 0 ? '先週より +' + num(diff) + '歩' : '先週より ' + num(diff) + '歩') + '</p>'
      : '';

    box.innerHTML = '<div class="steps-summary"><p class="label">今週の歩数</p><strong>' + num(weekTotal) + '</strong><span>歩</span><small>' + range + '</small>' + goalHtml + '</div><div class="steps-bars">' + values.map((value, index) => '<div class="steps-bar-col"><div class="steps-bar-track"><div class="steps-bar-fill" style="height:' + barHeight(value, max) + '%"></div></div><small>' + ['日','月','火','水','木','金','土'][days[index].getDay()] + '</small></div>').join('') + '</div>' + diffHtml;
  }

  function install() {
    renderWeeklySteps();
    setTimeout(renderWeeklySteps, 300);
    setTimeout(renderWeeklySteps, 1200);
    window.renderV078Chart = renderWeeklySteps;
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', renderWeeklySteps);

  return {
    VERSION,
    install,
    renderWeeklySteps
  };
})();
