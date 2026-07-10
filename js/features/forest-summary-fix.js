const RinchanForestSummaryFix = (() => {
  const VERSION = 'v1.4.19';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function tokyoParts(date) {
    const d = date || new Date();
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(d).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts;
  }

  function tokyoDateKey(date) {
    const p = tokyoParts(date || new Date());
    return p.year + '-' + p.month + '-' + p.day;
  }

  function tokyoMonthDay(date) {
    const p = tokyoParts(date || new Date());
    return Number(p.month) + '/' + Number(p.day) + ' ' + String(p.weekday || '').replace('曜日', '');
  }

  function tokyoTime(date) {
    const p = tokyoParts(date || new Date());
    return p.hour + ':' + p.minute;
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return tokyoDateKey(parsed);
    return raw.slice(0, 10);
  }

  function allActivities() {
    const candidates = [
      readJson('rinchanAllActivities', []),
      readJson('rinchanAllSteps', []),
      readJson('rinchanStepRecords', []),
      readJson('rinchanActivities', [])
    ];
    for (const rows of candidates) {
      if (Array.isArray(rows) && rows.length) return rows;
    }
    return [];
  }

  function owner(row) {
    return String(row.employeeId || row.participantId || row.id || row.userId || row.staffId || '').trim();
  }

  function steps(row) {
    return Number(row.steps || row.step || row.count || row.totalSteps || 0);
  }

  function rowDate(row) {
    return normalizeDateKey(row.date || row.activityDate || row.createdAt || row.savedAt || row.datetime || '');
  }

  function rowKey(row) {
    const activityId = String(row.activityId || row.recordId || '').trim();
    if (activityId) return 'activity:' + activityId;
    return [owner(row), rowDate(row), steps(row), row.createdAt || row.savedAt || ''].join('|');
  }

  function uniqueRows() {
    const seen = {};
    return allActivities().filter(row => {
      const k = rowKey(row);
      if (!k || seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  function summary() {
    const today = tokyoDateKey(new Date());
    const rows = uniqueRows();
    const todayRows = rows.filter(row => rowDate(row) === today);
    const totalSteps = rows.reduce((sum, row) => sum + steps(row), 0);
    const todaySteps = todayRows.reduce((sum, row) => sum + steps(row), 0);
    const server = readJson('rinchanForestSummary', {}) || {};
    const timeline = readJson('rinchanGoodTimeline', []);
    const thanksStats = readJson('rinchanThanksStats', {}) || {};
    return {
      version: VERSION,
      timezone: 'Asia/Tokyo',
      today,
      todayActivities: todayRows.length || Number(server.todayActivities || 0),
      todaySteps: todaySteps || Number(server.todaySteps || 0),
      totalSteps: totalSteps || Number(server.totalSteps || server.steps || 0),
      thanksCount: Array.isArray(timeline) && timeline.length ? timeline.length : Number(thanksStats.total || thanksStats.count || 0),
      rows: rows.length
    };
  }

  function stat(icon, value, label) {
    return '<div class="forest-summary-stat"><span class="forest-summary-stat-icon">' + icon + '</span><div><strong>' + Number(value || 0).toLocaleString('ja-JP') + '</strong><small>' + label + '</small></div></div>';
  }

  function moriLevel(totalSteps) {
    const thresholds = [0, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000];
    let level = 1;
    for (let i = 0; i < thresholds.length; i += 1) if (totalSteps >= thresholds[i]) level = i + 1;
    const next = thresholds[level] || thresholds[thresholds.length - 1];
    const prev = thresholds[level - 1] || 0;
    const progress = next > prev ? Math.min(100, Math.round(((totalSteps - prev) / (next - prev)) * 100)) : 100;
    return { level, next, progress };
  }

  function iconForLevel(level) {
    if (level >= 7) return '🌲';
    if (level >= 5) return '🌳';
    if (level >= 3) return '🌿';
    return '🌱';
  }

  function renderNewsSummary() {
    const statsEl = document.getElementById('forestSummaryStats');
    if (!statsEl) return;
    const data = summary();
    const dateEl = document.getElementById('newsSummaryDate');
    if (dateEl) dateEl.textContent = tokyoMonthDay(new Date());
    statsEl.innerHTML = [
      stat('📝', data.todayActivities, '今日の記録'),
      stat('👟', data.todaySteps, '今日の歩数'),
      stat('🌳', data.totalSteps, '累計歩数'),
      stat('🌸', data.thanksCount, 'ありがとうの花')
    ].join('');
  }

  function renderMoriStatus() {
    const stepsEl = document.getElementById('moriStatusSteps');
    if (!stepsEl) return;
    const data = summary();
    const level = moriLevel(Number(data.totalSteps || 0));
    const icon = document.getElementById('moriStatusIcon');
    const levelEl = document.getElementById('moriStatusLevel');
    const bar = document.getElementById('moriStatusProgressBar');
    const note = document.getElementById('moriStatusProgressNote');
    const updated = document.getElementById('moriUpdatedAt');
    if (icon) icon.textContent = iconForLevel(level.level);
    if (levelEl) levelEl.textContent = '杜レベル ' + level.level;
    stepsEl.textContent = '累計 ' + Number(data.totalSteps || 0).toLocaleString('ja-JP') + '歩';
    if (bar) bar.style.width = level.progress + '%';
    if (note) {
      const remain = Math.max(0, level.next - Number(data.totalSteps || 0));
      note.textContent = remain > 0 ? 'あと' + remain.toLocaleString('ja-JP') + '歩でレベル ' + (level.level + 1) : '最高レベルに到達しました';
    }
    if (updated) updated.textContent = '全員データ反映 ' + tokyoTime(new Date());
  }

  function renderAll() {
    renderNewsSummary();
    renderMoriStatus();
  }

  function install() {
    renderAll();
    setTimeout(renderAll, 300);
    setTimeout(renderAll, 1200);
    setTimeout(renderAll, 2500);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, summary, renderAll, tokyoDateKey };
})();
window.RinchanForestSummaryFix = RinchanForestSummaryFix;