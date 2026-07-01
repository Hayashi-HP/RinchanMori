const RinchanMypage = (() => {
  const VERSION = 'v0.9.61';

  function readJson(key, fallback) {
    if (window.RinchanStorage) return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function participant() {
    if (window.RinchanStorage) return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function thanksStats() {
    return readJson('rinchanThanksStats', {
      sentCount: readJson('rinchanSentThanks', []).length,
      receivedCount: readJson('rinchanReceivedThanks', []).length,
      totalCount: readJson('rinchanSentThanks', []).length + readJson('rinchanReceivedThanks', []).length
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function totalSteps() {
    return activities().reduce((sum, item) => sum + Number(item.steps || 0), 0);
  }

  function activityDays() {
    return Array.from(new Set(activities().map(item => String(item.date || '').slice(0, 10)).filter(Boolean))).sort();
  }

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
    const set = new Set(days);
    const today = new Date();
    let current = 0;
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (set.has(formatDateKey(d))) current += 1;
      else if (i > 0) break;
    }

    let best = 1;
    let run = 1;
    for (let i = 1; i < days.length; i += 1) {
      const prev = new Date(days[i - 1]);
      const cur = new Date(days[i]);
      const diff = Math.round((cur - prev) / 86400000);
      if (diff === 1) run += 1;
      else run = 1;
      best = Math.max(best, run);
    }
    return { current, best };
  }

  function renderProfile() {
    const user = participant() || {};
    setText('v070ProfileName', user.name || 'ゲスト');
    setText('v070ProfileDept', user.dept || '未設定');
    setText('v070EmployeeId', user.employeeId || user.id || '-');
    setText('v070ProfileNick', user.nick || '-');
    setText('weeklyGoalText', user.weeklyGoal || 'まずは無理なく続ける');
    setText('declarationText', user.declaration || 'まだ登録されていません。');
    setText('v136WeeklyStepGoalText', user.weeklyStepGoal ? Number(user.weeklyStepGoal).toLocaleString() + '歩' : '未設定');
  }

  function renderTree() {
    const state = treeState(totalSteps());
    setText('treeIcon', state.icon);
    setText('treeTitle', state.title);
    setText('treeText', state.text);
    setText('growthNote', state.progress >= 100 ? 'しっかり育っています。' : '次の成長まで、あと少し。');
    const bar = document.getElementById('growthBar');
    if (bar) bar.style.width = state.progress + '%';
  }

  function renderActivityStats() {
    const rows = activities();
    const days = activityDays();
    const createdAt = participant() && participant().createdAt ? new Date(participant().createdAt) : new Date();
    const age = Math.max(1, Math.ceil((new Date() - createdAt) / 86400000) + 1);
    const s = streak();

    setText('v070TreeAge', age.toLocaleString() + '日');
    setText('v070TotalSteps', totalSteps().toLocaleString() + '歩');
    setText('v070ActivityCount', rows.length.toLocaleString() + '回');
    setText('v070Streak', s.current.toLocaleString() + '日');
    setText('v070BestStreak', s.best.toLocaleString() + '日');
  }

  function renderHistory() {
    const box = document.getElementById('v070History');
    if (!box) return;
    const rows = activities().slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
    if (!rows.length) {
      box.innerHTML = '<p class="empty-note">まだ記録がありません。</p>';
      return;
    }
    box.innerHTML = rows.map(item => '<div class="history-row"><strong>' + escapeHtml(String(item.date || '').replace(/-/g, '/')) + '　' + Number(item.steps || 0).toLocaleString() + '歩</strong><small>' + escapeHtml(item.comment || '') + '</small></div>').join('');
  }

  function renderThanksStats() {
    const s = thanksStats();
    setText('v139SentThanksCount', Number(s.sentCount || 0).toLocaleString() + '件');
    setText('v139ReceivedThanksCount', Number(s.receivedCount || 0).toLocaleString() + '件');
    setText('v139TotalThanksCount', Number(s.totalCount || 0).toLocaleString() + '件');
  }

  function renderBadges() {
    const box = document.getElementById('badgeList');
    if (!box) return;
    const steps = totalSteps();
    const count = activities().length;
    const badges = [];
    if (count >= 1) badges.push(['🌱', 'はじめの一歩']);
    if (count >= 7) badges.push(['🔥', '継続の芽']);
    if (steps >= 30000) badges.push(['🌿', '若葉バッジ']);
    if (steps >= 100000) badges.push(['🌳', '成長の木']);
    if (thanksStats().totalCount >= 1) badges.push(['💌', 'ありがとう']);
    if (!badges.length) {
      box.innerHTML = '<p class="empty-note">まだバッジはありません。</p>';
      return;
    }
    box.innerHTML = badges.map(badge => '<div class="badge-chip"><span>' + badge[0] + '</span><strong>' + badge[1] + '</strong></div>').join('');
  }

  function showEdit(id) {
    const user = participant();
    if (!user || !user.id) {
      alert('登録後に編集できます。');
      location.href = 'login.html';
      return;
    }
    document.querySelectorAll('.form').forEach(el => el.classList.add('hidden'));
    if (id === 'profileEdit') {
      setInput('editName', user.name || '');
      setInput('editDept', user.dept || '');
      setInput('editNick', user.nick || '');
    }
    if (id === 'declarationEdit') setInput('editDeclaration', user.declaration || '');
    if (id === 'goalEdit') setInput('editGoal', user.weeklyGoal || '');
    if (id === 'weeklyStepGoalEdit') setInput('editWeeklyStepGoal', user.weeklyStepGoal || '');
    const box = document.getElementById(id);
    if (box) {
      box.classList.remove('hidden');
      setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }

  function setInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function renderAll() {
    renderProfile();
    renderTree();
    renderActivityStats();
    renderHistory();
    renderThanksStats();
    renderBadges();
  }

  function install() {
    if (!document.getElementById('mypageV070')) return;
    renderAll();
    window.renderV070Mypage = renderAll;
    window.showEdit = showEdit;
  }

  function formatDateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    renderAll,
    renderProfile,
    renderTree,
    renderHistory,
    renderBadges,
    showEdit
  };
})();
