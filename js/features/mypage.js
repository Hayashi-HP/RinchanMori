const RinchanMypage = (() => {
  const VERSION = 'v1.0.08';

  function readJson(key, fallback) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.writeJson === 'function') return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function isRegistered(user) { return !!(user && (user.employeeId || user.id)); }
  function dateKeyFromDate(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return dateKeyFromDate(parsed);
    return raw.slice(0, 10);
  }
  function formatDateLabel(value) {
    const key = normalizeDateKey(value);
    const parts = key.split('-');
    if (parts.length !== 3) return key.replace(/-/g, '/');
    const y = Number(parts[0]); const m = Number(parts[1]); const d = Number(parts[2]);
    if (!y || !m || !d) return key.replace(/-/g, '/');
    const dt = new Date(y, m - 1, d);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return String(m).padStart(2, '0') + '/' + String(d).padStart(2, '0') + ' ' + days[dt.getDay()];
  }
  function newerScore(item) {
    const saved = Date.parse(item.savedAt || '');
    const created = Date.parse(item.createdAt || '');
    return Math.max(isNaN(saved) ? 0 : saved, isNaN(created) ? 0 : created);
  }
  function normalizedActivities() {
    const byDate = {};
    (readJson('rinchanActivities', []) || []).forEach(item => {
      const key = normalizeDateKey(item.date || item.createdAt || item.savedAt);
      if (!key) return;
      const row = { activityId: String(item.activityId || ''), date: key, steps: Number(item.steps || 0), challenge: item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE', comment: String(item.comment || ''), createdAt: String(item.createdAt || item.savedAt || item.date || ''), savedAt: String(item.savedAt || '') };
      const current = byDate[key];
      if (!current || newerScore(row) >= newerScore(current)) byDate[key] = row;
    });
    const rows = Object.values(byDate).sort((a, b) => normalizeDateKey(b.date).localeCompare(normalizeDateKey(a.date)) || newerScore(b) - newerScore(a));
    writeJson('rinchanActivities', rows);
    return rows;
  }
  function activities() { return normalizedActivities(); }
  function thanksStats() {
    return readJson('rinchanThanksStats', { sentCount: readJson('rinchanSentThanks', []).length, receivedCount: readJson('rinchanReceivedThanks', []).length, totalCount: readJson('rinchanSentThanks', []).length + readJson('rinchanReceivedThanks', []).length });
  }
  function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
  function totalSteps() { return activities().reduce((sum, item) => sum + Number(item.steps || 0), 0); }
  function activityDays() { return Array.from(new Set(activities().map(item => normalizeDateKey(item.date)).filter(Boolean))).sort(); }
  function treeState(steps) {
    if (steps >= 300000) return { icon: '🌲', title: '大きな杜の木になりました', text: 'たくさんの歩みが、しっかりした木を育てています。', progress: 100 };
    if (steps >= 100000) return { icon: '🌳', title: '木が大きく育っています', text: '日々の記録が、あなたの木を育てています。', progress: 80 };
    if (steps >= 30000) return { icon: '🌿', title: '若葉が広がっています', text: '少しずつ、あなたの木に葉が増えています。', progress: 55 };
    if (steps >= 5000) return { icon: '🌱', title: '芽が育ちはじめました', text: '今日の一歩が、次の成長につながります。', progress: 30 };
    return { icon: '🌱', title: '小さな芽が出ました', text: '活動を記録すると、あなたの木が育ちます。', progress: 10 };
  }
  function streak() {
    const days = activityDays();
    if (!days.length) return { current: 0, best: 0 };
    const set = new Set(days); const today = new Date(); let current = 0;
    for (let i = 0; i < 365; i += 1) { const d = new Date(today); d.setDate(today.getDate() - i); if (set.has(dateKeyFromDate(d))) current += 1; else if (i > 0) break; }
    let best = 1; let run = 1;
    for (let i = 1; i < days.length; i += 1) { const prev = new Date(days[i - 1]); const cur = new Date(days[i]); const diff = Math.round((cur - prev) / 86400000); if (diff === 1) run += 1; else run = 1; best = Math.max(best, run); }
    return { current, best };
  }
  function renderProfile() {
    const user = participant() || {};
    setText('v070ProfileName', user.name || 'ゲスト');
    setText('v070ProfileDept', user.dept || '未設定');
    setText('v070EmployeeId', user.employeeId || user.id || '-');
    setText('v070ProfileNick', user.nick || '-');
    setText('weeklyGoalText', user.weeklyGoal || '未設定');
    setText('declarationText', user.declaration || 'まだ登録されていません。');
    setText('v136WeeklyStepGoalText', user.weeklyStepGoal ? Number(user.weeklyStepGoal).toLocaleString() + '歩' : '未設定');
  }
  function renderTree() {
    const state = treeState(totalSteps());
    setText('treeIcon', state.icon); setText('treeTitle', state.title); setText('treeText', state.text); setText('growthNote', state.progress >= 100 ? 'しっかり育っています。' : '次の成長まで、あと少し。');
    const bar = document.getElementById('growthBar'); if (bar) bar.style.width = state.progress + '%';
  }
  function renderActivityStats() {
    const rows = activities(); const createdAt = participant() && participant().createdAt ? new Date(participant().createdAt) : new Date(); const age = Math.max(1, Math.ceil((new Date() - createdAt) / 86400000) + 1); const s = streak();
    setText('v070TreeAge', age.toLocaleString() + '日'); setText('v070TotalSteps', totalSteps().toLocaleString() + '歩'); setText('v070ActivityCount', rows.length.toLocaleString() + '回'); setText('v070Streak', s.current.toLocaleString() + '日'); setText('v070BestStreak', s.best.toLocaleString() + '日');
  }
  function renderHistory() {
    const box = document.getElementById('v070History'); if (!box) return;
    const rows = activities().slice(0, 10);
    if (!rows.length) { box.innerHTML = '<p class="empty-note">まだ記録がありません。</p>'; return; }
    box.innerHTML = rows.map(item => { const comment = String(item.comment || '').trim(); return '<div class="history-row"><strong>' + escapeHtml(formatDateLabel(item.date)) + '　' + Number(item.steps || 0).toLocaleString() + '歩</strong>' + (comment ? '<small>' + escapeHtml(comment) + '</small>' : '') + '</div>'; }).join('');
  }
  function renderThanksStats() {
    const s = thanksStats(); setText('v139SentThanksCount', Number(s.sentCount || 0).toLocaleString() + '件'); setText('v139ReceivedThanksCount', Number(s.receivedCount || 0).toLocaleString() + '件'); setText('v139TotalThanksCount', Number(s.totalCount || 0).toLocaleString() + '件');
  }
  function renderBadges() {
    const box = document.getElementById('badgeList'); if (!box) return;
    const steps = totalSteps(); const count = activities().length; const thanks = thanksStats().totalCount || 0;
    const badges = [
      { icon: '🌱', title: 'はじめの一歩', note: '最初の活動記録', earned: count >= 1 },
      { icon: '🔥', title: '継続の芽', note: '7回記録', earned: count >= 7 },
      { icon: '🌿', title: '若葉バッジ', note: '30,000歩達成', earned: steps >= 30000 },
      { icon: '🌳', title: '成長の木', note: '100,000歩達成', earned: steps >= 100000 },
      { icon: '💌', title: 'ありがとう', note: 'ありがとう参加', earned: thanks >= 1 },
      { icon: '🏆', title: '杜の達人', note: '300,000歩達成', earned: steps >= 300000 }
    ];
    box.innerHTML = badges.map(badge => '<div class="badge-card premium-badge ' + (badge.earned ? 'is-earned' : 'is-locked') + '"><div class="badge-shine"></div><div class="badge-medal"><span class="badge-laurel">⌾</span><span class="badge-mark">' + badge.icon + '</span><span class="badge-lock">🔒</span></div><strong>' + escapeHtml(badge.title) + '</strong><small>' + escapeHtml(badge.note) + '</small></div>').join('');
  }
  function hideEdit() { document.querySelectorAll('.form.edit-panel').forEach(el => el.classList.add('hidden')); document.body.classList.remove('edit-open'); }
  function showEdit(id) {
    const user = participant(); if (!isRegistered(user)) { alert('登録後に編集できます。'); location.href = 'login.html'; return; }
    hideEdit();
    if (id === 'profileEdit') { setInput('editName', user.name || ''); setInput('editDept', user.dept || ''); setInput('editNick', user.nick || ''); }
    if (id === 'declarationEdit') setInput('editDeclaration', user.declaration || '');
    if (id === 'goalEdit') setInput('editGoal', user.weeklyGoal || '');
    if (id === 'weeklyStepGoalEdit') setInput('editWeeklyStepGoal', user.weeklyStepGoal || '');
    const box = document.getElementById(id); if (box) { if (box.parentElement !== document.body) document.body.appendChild(box); box.classList.remove('hidden'); document.body.classList.add('edit-open'); }
  }
  function setInput(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
  function renderAll() { renderProfile(); renderTree(); renderActivityStats(); renderHistory(); renderThanksStats(); renderBadges(); }
  function install() {
    if (!document.getElementById('mypageV070')) return;
    renderAll(); window.renderV070Mypage = renderAll; window.showEdit = showEdit; window.hideEdit = hideEdit;
  }
  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  document.addEventListener('DOMContentLoaded', install); window.showEdit = showEdit; window.hideEdit = hideEdit;
  return { VERSION, install, renderAll, renderProfile, renderTree, renderHistory, renderBadges, showEdit, hideEdit };
})();