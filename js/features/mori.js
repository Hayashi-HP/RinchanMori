const RinchanMori = (() => {
  const VERSION = 'v1.0.05';

  function readJson(key, fallback) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function participant() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function members() {
    const list = readJson('rinchanMoriMembers', []);
    if (Array.isArray(list) && list.length) return list;
    const user = participant();
    if (user && (user.employeeId || user.id)) {
      const steps = activities().reduce((sum, item) => sum + Number(item.steps || 0), 0);
      return [{ employeeId: user.employeeId || user.id, id: user.id || user.employeeId, name: user.name || user.nick || '', nick: user.nick || '', dept: user.dept || 'その他', totalSteps: steps }];
    }
    return [];
  }

  function departments() {
    const cached = readJson('rinchanDepartments', []);
    if (Array.isArray(cached) && cached.length) return cached;
    return [
      { id: 'nurse', name: '看護部' },
      { id: 'reha', name: 'リハビリテーション部' },
      { id: 'care', name: '介護部' },
      { id: 'doctor', name: '医局' },
      { id: 'pharmacy', name: '薬剤部' },
      { id: 'nutrition', name: '栄養科' },
      { id: 'office', name: '事務部' },
      { id: 'other', name: 'その他' }
    ];
  }

  function totalSteps() {
    const memberList = members();
    if (memberList.length) return memberList.reduce((sum, item) => sum + Number(item.totalSteps || item.steps || 0), 0);
    return activities().reduce((sum, item) => sum + Number(item.steps || 0), 0);
  }

  function moriLevel(steps) {
    const thresholds = [0, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000];
    let level = 1;
    for (let i = 0; i < thresholds.length; i += 1) if (steps >= thresholds[i]) level = i + 1;
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

  function seasonMessage() {
    const hour = new Date().getHours();
    if (hour < 10) return '朝の杜に、今日の一歩が集まりはじめました。';
    if (hour < 16) return '今日の杜の様子を表示しています。';
    return '一日の歩みで、杜がゆっくり育っています。';
  }

  function renderStatus() {
    const steps = totalSteps();
    const level = moriLevel(steps);
    const icon = document.getElementById('moriStatusIcon');
    const levelEl = document.getElementById('moriStatusLevel');
    const stepsEl = document.getElementById('moriStatusSteps');
    const bar = document.getElementById('moriStatusProgressBar');
    const note = document.getElementById('moriStatusProgressNote');
    const season = document.getElementById('moriSeasonMessage');
    const updated = document.getElementById('moriUpdatedAt');

    if (icon) icon.textContent = iconForLevel(level.level);
    if (levelEl) levelEl.textContent = '杜レベル ' + level.level;
    if (stepsEl) stepsEl.textContent = '累計 ' + steps.toLocaleString() + '歩';
    if (bar) bar.style.width = level.progress + '%';
    if (note) {
      const remain = Math.max(0, level.next - steps);
      note.textContent = remain > 0 ? 'あと' + remain.toLocaleString() + '歩でレベル ' + (level.level + 1) : '最高レベルに到達しました';
    }
    if (season) season.textContent = seasonMessage();
    if (updated) updated.textContent = '最終更新 ' + formatTime(new Date());
  }

  function groupByDept() {
    const deptMap = {};
    departments().forEach(dept => {
      const name = dept.name || dept.dept || String(dept.id || 'その他');
      deptMap[name] = { dept: name, steps: 0, members: 0 };
    });

    members().forEach(member => {
      const dept = member.dept || 'その他';
      if (!deptMap[dept]) deptMap[dept] = { dept, steps: 0, members: 0 };
      deptMap[dept].members += 1;
      deptMap[dept].steps += Number(member.totalSteps || member.steps || 0);
    });

    return Object.keys(deptMap).map(key => deptMap[key]);
  }

  function membersByDept(deptName) {
    return members().filter(member => String(member.dept || 'その他') === String(deptName));
  }

  function renderMap() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const rows = groupByDept();
    if (!rows.length) {
      map.innerHTML = '<p class="empty-note">杜を読み込み中です。</p>';
      return;
    }
    map.innerHTML = rows.map(row => {
      const level = moriLevel(Number(row.steps || 0));
      const membersLabel = Number(row.members || 0).toLocaleString() + '人';
      return '<button type="button" class="dept-node mori-tree-node" onclick="RinchanMori.showDept(\'' + escapeAttr(row.dept) + '\')"><span>' + iconForLevel(level.level) + '</span><strong>' + escapeHtml(row.dept) + '</strong><em>' + membersLabel + '</em></button>';
    }).join('');
  }

  function showDept(deptName) {
    const card = document.getElementById('treeInfoCard');
    if (!card) return;
    const row = groupByDept().find(item => String(item.dept) === String(deptName)) || { dept: deptName, steps: 0, members: 0 };
    const level = moriLevel(Number(row.steps || 0));
    const deptMembers = membersByDept(deptName);
    const current = participant() || {};
    const currentId = String(current.employeeId || current.id || '');
    const memberHtml = deptMembers.length
      ? '<div class="dept-member-list">' + deptMembers.map(member => {
          const id = String(member.employeeId || member.id || '');
          const name = member.nick || member.name || 'メンバー';
          const steps = Number(member.totalSteps || member.steps || 0).toLocaleString();
          const disabled = currentId && id === currentId;
          return '<div class="dept-member-item"><div><strong>' + escapeHtml(name) + '</strong><small>' + steps + '歩</small></div><button type="button" class="dept-member-thanks" ' + (disabled ? 'disabled' : '') + ' onclick="RinchanMori.sendThanks(\'' + escapeAttr(id) + '\',\'' + escapeAttr(name) + '\')">ありがとう</button></div>';
        }).join('') + '</div>'
      : '<p class="dept-empty-note">この部署には、まだ登録メンバーがいません。</p>';

    card.classList.remove('hidden');
    card.innerHTML = '<button type="button" class="tree-card-close" onclick="RinchanMori.hideDept()">×</button><p class="label">部署の木</p><h2 class="dept-card-title">' + escapeHtml(row.dept) + '</h2><div class="tree-card-icon dept-icon">' + iconForLevel(level.level) + '</div><div class="mini-stats"><div><strong>' + Number(row.steps || 0).toLocaleString() + '歩</strong><small>累計歩数</small></div><div><strong>' + Number(row.members || 0).toLocaleString() + '人</strong><small>登録メンバー</small></div><div><strong>Lv.' + level.level + '</strong><small>成長</small></div></div><p class="dept-note">部署のメンバーにありがとうを送れます。</p>' + memberHtml;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function sendThanks(toId, toName) {
    if (!toId) return;
    sessionStorage.setItem('rinchanThanksTarget', JSON.stringify({ toEmployeeId: toId, toName: toName || '' }));
    location.href = 'thanks.html';
  }

  function hideDept() {
    const card = document.getElementById('treeInfoCard');
    if (card) card.classList.add('hidden');
  }

  function renderHighlight() {
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    const rows = groupByDept().slice().sort((a, b) => Number(b.steps || 0) - Number(a.steps || 0));
    if (!rows.length) return;
    const top = rows[0];
    if (title) title.textContent = '今日の杜';
    if (text) text.textContent = top.dept + 'の木がよく育っています。みんなの一歩で杜全体が広がります。';
  }

  function renderAll() {
    renderStatus();
    renderMap();
    renderHighlight();
  }

  function refresh() {
    if (typeof RinchanSync !== 'undefined' && RinchanSync && typeof RinchanSync.sync === 'function') RinchanSync.sync({ silent: false });
    renderAll();
  }

  function install() {
    renderAll();
    const refreshButton = document.getElementById('refreshMoriButton');
    if (refreshButton && !refreshButton.__rinchanMoriInstalled) {
      refreshButton.__rinchanMoriInstalled = true;
      refreshButton.addEventListener('click', refresh);
    }
    window.renderMoriMapV071 = renderMap;
    window.renderMoriStatusV144 = renderStatus;
  }

  function formatTime(date) {
    return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  document.addEventListener('DOMContentLoaded', install);

  return { VERSION, install, renderAll, renderStatus, renderMap, renderHighlight, refresh, showDept, hideDept, sendThanks };
})();