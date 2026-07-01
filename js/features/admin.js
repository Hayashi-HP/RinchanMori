const RinchanAdmin = (() => {
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

  function writeJson(key, value) {
    if (window.RinchanStorage) return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    if (window.RinchanStorage) return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function employeeId() {
    if (window.RinchanStorage) return RinchanStorage.employeeId();
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  async function api(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function members() {
    const cached = readJson('rinchanMoriMembers', []);
    if (Array.isArray(cached) && cached.length) return cached;
    const user = participant();
    return user && user.id ? [user] : [];
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function localStats() {
    const rows = activities();
    const today = todayKey();
    const todayRows = rows.filter(item => String(item.date || '').slice(0, 10) === today);
    const memberRows = members();
    const activeIds = new Set(todayRows.map(item => String(item.participantId || item.employeeId || item.id || '')));
    return {
      totalUsers: memberRows.length,
      todayUsers: activeIds.size || todayRows.length,
      todayActivities: todayRows.length,
      todaySteps: todayRows.reduce((sum, item) => sum + Number(item.steps || 0), 0),
      members: memberRows,
      activities: rows
    };
  }

  function renderStats(data) {
    const stats = data || localStats();
    setText('adminTotalUsers', Number(stats.totalUsers || 0).toLocaleString());
    setText('adminTodayUsers', Number(stats.todayUsers || 0).toLocaleString());
    setText('adminTodayActivities', Number(stats.todayActivities || 0).toLocaleString());
    setText('adminTodaySteps', Number(stats.todaySteps || 0).toLocaleString());
    const status = document.getElementById('adminStatus');
    if (status) status.textContent = '最終更新 ' + formatTime(new Date());
  }

  function deptRanking(data) {
    const stats = data || localStats();
    const map = {};
    (stats.activities || []).forEach(item => {
      const dept = item.dept || 'その他';
      if (!map[dept]) map[dept] = { dept, steps: 0, count: 0 };
      map[dept].steps += Number(item.steps || 0);
      map[dept].count += 1;
    });
    return Object.keys(map).map(key => map[key]).sort((a, b) => b.steps - a.steps);
  }

  function renderDeptRanking(data) {
    const box = document.getElementById('adminDeptRanking');
    if (!box) return;
    const rows = deptRanking(data).slice(0, 10);
    if (!rows.length) {
      box.innerHTML = '<p class="admin-empty">部署別データはまだありません。</p>';
      return;
    }
    box.innerHTML = rows.map((row, index) => '<div class="admin-list-row"><strong>' + (index + 1) + '. ' + escapeHtml(row.dept) + '</strong><span>' + Number(row.steps || 0).toLocaleString() + '歩</span><small>' + Number(row.count || 0).toLocaleString() + '件</small></div>').join('');
  }

  function lastActivityMap() {
    const map = {};
    activities().forEach(item => {
      const id = String(item.participantId || item.employeeId || item.id || '');
      if (!id) return;
      const date = String(item.date || '').slice(0, 10);
      if (!map[id] || date > map[id]) map[id] = date;
    });
    return map;
  }

  function inactiveMembers() {
    const last = lastActivityMap();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);
    const thresholdKey = formatDateKey(threshold);
    return members().filter(member => {
      const id = String(member.employeeId || member.id || '');
      return !last[id] || last[id] < thresholdKey;
    });
  }

  function renderInactive() {
    const box = document.getElementById('adminInactiveMembers');
    if (!box) return;
    const rows = inactiveMembers().slice(0, 20);
    if (!rows.length) {
      box.innerHTML = '<p class="admin-empty">7日以上記録がない人はいません。</p>';
      return;
    }
    box.innerHTML = rows.map(member => '<div class="admin-list-row"><strong>' + escapeHtml(member.name || member.nick || member.employeeId || member.id || '未設定') + '</strong><span>' + escapeHtml(member.dept || '所属未設定') + '</span></div>').join('');
  }

  function renderOperations() {
    const box = document.getElementById('adminOperations');
    if (!box) return;
    const userRows = members();
    const noDept = userRows.filter(user => !user.dept);
    const inactive = inactiveMembers();
    const items = [];
    if (noDept.length) items.push('所属未設定：' + noDept.length + '人');
    if (inactive.length) items.push('7日以上記録なし：' + inactive.length + '人');
    if (!items.length) {
      box.innerHTML = '<p class="admin-empty">対応が必要な項目はありません。</p>';
      return;
    }
    box.innerHTML = items.map(text => '<div class="admin-alert-row">' + escapeHtml(text) + '</div>').join('');
  }

  function renderMembers() {
    const box = document.getElementById('adminMembers');
    if (!box) return;
    const query = String((document.getElementById('adminSearch') || {}).value || '').trim();
    const last = lastActivityMap();
    let rows = members().slice();
    if (query) {
      rows = rows.filter(member => [member.name, member.nick, member.dept, member.employeeId, member.id].some(value => String(value || '').includes(query)));
    }
    if (!rows.length) {
      box.innerHTML = '<p class="admin-empty">該当する利用者はいません。</p>';
      return;
    }
    box.innerHTML = rows.map(member => {
      const id = String(member.employeeId || member.id || '');
      return '<div class="admin-member-row"><div><strong>' + escapeHtml(member.name || member.nick || id || '未設定') + '</strong><p>' + escapeHtml(member.dept || '所属未設定') + '</p></div><small>最終記録 ' + escapeHtml(last[id] || '-') + '</small></div>';
    }).join('');
  }

  async function loadServerStats() {
    const user = participant();
    if (!user || String(user.admin || '') !== '1') {
      renderAll();
      return;
    }
    const result = await api('adminStats', { employeeId: employeeId() });
    if (result && result.ok && result.data) {
      writeJson('rinchanAdminStats', result.data);
      renderAll(result.data);
    } else {
      renderAll();
    }
  }

  function renderAll(data) {
    const source = data || readJson('rinchanAdminStats', null) || localStats();
    renderStats(source);
    renderDeptRanking(source);
    renderInactive();
    renderOperations();
    renderMembers();
  }

  function install() {
    if (!document.querySelector('.admin-app-v132')) return;
    renderAll();
    const search = document.getElementById('adminSearch');
    if (search && !search.__rinchanAdminInstalled) {
      search.__rinchanAdminInstalled = true;
      search.addEventListener('input', renderMembers);
    }
    const refresh = document.getElementById('adminRefresh');
    if (refresh && !refresh.__rinchanAdminInstalled) {
      refresh.__rinchanAdminInstalled = true;
      refresh.addEventListener('click', loadServerStats);
    }
    setTimeout(loadServerStats, 300);
  }

  function formatDateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function formatTime(date) {
    return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    renderAll,
    loadServerStats,
    renderMembers,
    renderStats
  };
})();
