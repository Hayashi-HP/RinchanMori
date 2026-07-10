const RinchanMoriSummaryFix = (() => {
  const VERSION = 'v1.4.18';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function allActivities() {
    const rows = readJson('rinchanAllActivities', []);
    if (Array.isArray(rows) && rows.length) return rows;
    const steps = readJson('rinchanAllSteps', []);
    if (Array.isArray(steps) && steps.length) return steps;
    const local = readJson('rinchanActivities', []);
    return Array.isArray(local) ? local : [];
  }

  function members() {
    const rows = readJson('rinchanMoriMembers', []);
    return Array.isArray(rows) ? rows : [];
  }

  function forestSummary() {
    const summary = readJson('rinchanForestSummary', null);
    return summary && typeof summary === 'object' ? summary : null;
  }

  function totalSteps() {
    const summary = forestSummary();
    if (summary && Number(summary.totalSteps || 0) > 0) return Number(summary.totalSteps || 0);
    const mori = readJson('rinchanMoriState', null);
    if (mori && Number(mori.totalSteps || mori.steps || 0) > 0) return Number(mori.totalSteps || mori.steps || 0);
    const memberRows = members();
    if (memberRows.length) {
      const total = memberRows.reduce((sum, item) => sum + Number(item.totalSteps || item.steps || item.sumSteps || 0), 0);
      if (total > 0) return total;
    }
    return allActivities().reduce((sum, item) => sum + Number(item.steps || item.step || item.count || 0), 0);
  }

  function moriLevel(steps) {
    const thresholds = [0, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000];
    let level = 1;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (steps >= thresholds[i]) level = i + 1;
    }
    const next = thresholds[level] || thresholds[thresholds.length - 1];
    const prev = thresholds[level - 1] || 0;
    const progress = next > prev ? Math.min(100, Math.round(((steps - prev) / (next - prev)) * 100)) : 100;
    return { level, next, prev, progress };
  }

  function iconForLevel(level) {
    if (level >= 7) return '🌲';
    if (level >= 5) return '🌳';
    if (level >= 3) return '🌿';
    return '🌱';
  }

  function formatTime(date) {
    try {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return '';
    }
  }

  function renderStatus() {
    const steps = totalSteps();
    const level = moriLevel(steps);
    const icon = document.getElementById('moriStatusIcon');
    const levelEl = document.getElementById('moriStatusLevel');
    const stepsEl = document.getElementById('moriStatusSteps');
    const bar = document.getElementById('moriStatusProgressBar');
    const note = document.getElementById('moriStatusProgressNote');
    const updated = document.getElementById('moriUpdatedAt');
    if (icon) icon.textContent = iconForLevel(level.level);
    if (levelEl) levelEl.textContent = '杜レベル ' + level.level;
    if (stepsEl) stepsEl.textContent = '累計 ' + steps.toLocaleString('ja-JP') + '歩';
    if (bar) bar.style.width = level.progress + '%';
    if (note) {
      const remain = Math.max(0, level.next - steps);
      note.textContent = remain > 0 ? 'あと' + remain.toLocaleString('ja-JP') + '歩でレベル ' + (level.level + 1) : '最高レベルに到達しました';
    }
    if (updated) updated.textContent = '最終更新 ' + formatTime(new Date());
  }

  function install() {
    renderStatus();
    setTimeout(renderStatus, 300);
    setTimeout(renderStatus, 1200);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 150));

  return { VERSION, install, renderStatus, totalSteps };
})();
window.RinchanMoriSummaryFix = RinchanMoriSummaryFix;
