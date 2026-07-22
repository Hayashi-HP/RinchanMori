const RinchanAdminChallenges = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows: [], departments: [], editing: null, loading: false, saving: false, deleting: false };
  const defaults = {
    individual: { icon: '👟', title: '月間チャレンジ', targetSteps: 200000, message: '今月も無理なく歩こう。' },
    department: { icon: '🌳', title: '部署チャレンジ', targetSteps: 1000000, message: '部署のみんなで一歩ずつ積み重ねよう。' },
    hospital: { icon: '🏥', title: '病院みんなのチャレンジ', targetSteps: 20000000, message: '病院全体で目標達成を目指します。' }
  };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
  function formatNumber(v) { return Number(v || 0).toLocaleString('ja-JP'); }

  function participant() {
    try {
      if (window.RinchanApi && typeof RinchanApi.authState === 'function') return RinchanApi.authState().user || null;
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    } catch (e) { return null; }
  }

  function authState() {
    const user = participant();
    const employeeId = user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
    const role = String((user && user.role) || '').toLowerCase();
    const isAdmin = !!(user && (String(user.admin || '') === '1' || user.admin === true || role === 'admin' || role === 'system'));
    return { user, employeeId, loggedIn: !!employeeId, isAdmin };
  }

  function guardPageAccess() {
    const auth = authState();
    if (!auth.loggedIn) {
      alert('ログイン後に管理画面をご利用ください。');
      location.href = 'login.html';
      return false;
    }
    if (!auth.isAdmin) {
      try { sessionStorage.setItem('rinchanAdminAccessNotice', '管理者のみ利用できます。'); } catch (e) {}
      location.href = 'mypage.html';
      return false;
    }
    return true;
  }

  async function api(action, payload) {
    if (window.RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    return { ok: false, error: 'api_not_ready' };
  }

  function currentYearMonth() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function scopeLabel(scope) {
    return { individual: '個人', department: '部署', hospital: '病院全体' }[String(scope || '')] || '未設定';
  }

  function targetLabel(row) {
    if (String(row.scope || '') !== 'department') return scopeLabel(row.scope);
    return String(row.targetDept || '') === '*' ? '全部署共通' : String(row.targetDept || '部署未設定');
  }

  function setStatus(text, isError) {
    const el = byId('adminChallengesStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminChallengesRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'チャレンジ一覧を更新中' : 'チャレンジ一覧を更新');
  }

  function setMessage(text, type) {
    const el = byId('adminChallengeMessageBox');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success', 'is-error', 'is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function refreshDepartmentOptions() {
    const select = byId('adminChallengeDept');
    if (!select) return;
    const keep = select.value;
    select.innerHTML = '<option value="*">全部署共通</option>' + state.departments.map(name => '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>').join('');
    select.value = keep && (keep === '*' || state.departments.indexOf(keep) >= 0) ? keep : '*';
  }

  function renderList() {
    const box = byId('adminChallengesList');
    if (!box) return;
    if (!state.rows.length) {
      box.innerHTML = '<p class="admin-empty">この条件の設定はありません。標準目標がそのまま表示されます。</p>';
      return;
    }

    box.innerHTML = state.rows.map(row => {
      const statusClass = row.active ? 'is-active' : 'is-inactive';
      const statusLabel = row.active ? '表示中' : '休止中';
      return '<details class="admin-challenge-row">'
        + '<summary class="admin-challenge-summary"><span class="admin-challenge-icon">' + escapeHtml(row.icon || '👟') + '</span><span class="admin-challenge-summary-copy"><strong>' + escapeHtml(row.title || '-') + '</strong><small>' + escapeHtml(row.yearMonth || '-') + '・' + escapeHtml(targetLabel(row)) + '</small></span><span class="admin-challenge-status ' + statusClass + '">' + statusLabel + '</span></summary>'
        + '<div class="admin-challenge-row-detail"><div class="admin-challenge-meta"><span><small>種類</small><b>' + escapeHtml(scopeLabel(row.scope)) + '</b></span><span><small>目標歩数</small><b>' + escapeHtml(formatNumber(row.targetSteps)) + '歩</b></span><span class="wide"><small>メッセージ</small><b>' + escapeHtml(row.message || '未設定') + '</b></span></div><div class="admin-challenge-row-actions"><button type="button" class="soft-button" data-action="edit-challenge" data-id="' + escapeHtml(row.challengeId || '') + '">編集</button><button type="button" class="soft-button challenge-reset-button" data-action="delete-challenge" data-id="' + escapeHtml(row.challengeId || '') + '">標準に戻す</button></div></div>'
        + '</details>';
    }).join('');
  }

  function filters() {
    return { yearMonth: value('adminChallengeFilterMonth'), scope: value('adminChallengeFilterScope') };
  }

  async function loadChallenges() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('チャレンジ設定を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminChallengeList', Object.assign({ employeeId: auth.employeeId }, filters()));
      if (!result || !result.ok || !result.data) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = Array.isArray(result.data.challenges) ? result.data.challenges : [];
      state.departments = Array.isArray(result.data.departments) ? result.data.departments : [];
      refreshDepartmentOptions();
      renderList();
      setStatus('設定 ' + state.rows.length + '件', false);
    } catch (e) {
      state.rows = [];
      renderList();
      setStatus('チャレンジ設定を取得できませんでした。', true);
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function findChallenge(challengeId) {
    return state.rows.find(row => String(row.challengeId || '') === String(challengeId || '')) || null;
  }

  function toggleDepartment() {
    const isDepartment = value('adminChallengeScope') === 'department';
    byId('adminChallengeDeptWrap').classList.toggle('hidden', !isDepartment);
  }

  function applyDefaults(scope) {
    const selected = defaults[scope] || defaults.individual;
    byId('adminChallengeIcon').value = selected.icon;
    byId('adminChallengeTitle').value = selected.title;
    byId('adminChallengeTarget').value = selected.targetSteps;
    byId('adminChallengeMessage').value = selected.message;
  }

  function openEditor(row) {
    state.editing = row || null;
    byId('adminChallengeEditorTitle').textContent = row ? '設定を編集' : '設定を追加';
    byId('adminChallengeMonth').value = row ? String(row.yearMonth || '') : (value('adminChallengeFilterMonth') || currentYearMonth());
    byId('adminChallengeScope').value = row ? String(row.scope || 'individual') : 'individual';
    if (row) {
      byId('adminChallengeDept').value = row.targetDept || '*';
      byId('adminChallengeIcon').value = row.icon || '';
      byId('adminChallengeTitle').value = row.title || '';
      byId('adminChallengeTarget').value = row.targetSteps || '';
      byId('adminChallengeMessage').value = row.message || '';
      byId('adminChallengeActive').value = row.active ? 'true' : 'false';
    } else {
      byId('adminChallengeDept').value = '*';
      byId('adminChallengeActive').value = 'true';
      applyDefaults('individual');
    }
    toggleDepartment();
    setMessage('', 'info');
    const editor = byId('adminChallengeEditor');
    editor.classList.remove('hidden');
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.editing = null;
    byId('adminChallengeEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function validateForm() {
    const yearMonth = value('adminChallengeMonth');
    const scope = value('adminChallengeScope');
    const targetDept = scope === 'department' ? value('adminChallengeDept') : '';
    const title = value('adminChallengeTitle');
    const targetSteps = value('adminChallengeTarget');
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) return { ok: false, message: '対象月を選択してください。' };
    if (scope === 'department' && !targetDept) return { ok: false, message: '対象部署を選択してください。' };
    if (!title) return { ok: false, message: 'タイトルを入力してください。' };
    if (!/^\d+$/.test(targetSteps) || Number(targetSteps) < 1000 || Number(targetSteps) > 1000000000) {
      return { ok: false, message: '目標歩数は1,000〜1,000,000,000歩で入力してください。' };
    }
    return {
      ok: true,
      payload: {
        challengeId: state.editing ? state.editing.challengeId : '',
        yearMonth,
        scope,
        targetDept,
        title,
        icon: value('adminChallengeIcon'),
        message: value('adminChallengeMessage'),
        targetSteps,
        active: value('adminChallengeActive') === 'true'
      }
    };
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminChallengeSave', 'adminChallengeCancel', 'adminChallengeCreate', 'adminChallengesRefresh'].forEach(id => {
      const el = byId(id);
      if (el) el.disabled = !!busy;
    });
    const save = byId('adminChallengeSave');
    if (save) save.textContent = busy ? '保存中...' : '変更を保存';
  }

  function errorMessage(reason) {
    const messages = {
      admin_required: '管理者として認証できませんでした。もう一度ログインしてください。',
      manage_challenges_required: 'チャレンジ管理の権限がありません。',
      challenge_not_found: '対象の設定が見つかりません。',
      challenge_month_required: '対象月を選択してください。',
      challenge_scope_required: '種類を選択してください。',
      challenge_department_required: '対象部署を選択してください。',
      challenge_title_required: 'タイトルを入力してください。',
      challenge_duplicate: '同じ月・種類・対象の設定がすでにあります。既存設定を編集してください。',
      challenge_target_integer_required: '目標歩数は整数で入力してください。',
      challenge_target_out_of_range: '目標歩数は1,000〜1,000,000,000歩で入力してください。'
    };
    return messages[String(reason || '')] || '通信に失敗しました。時間をおいてもう一度お試しください。';
  }

  async function saveChallenge() {
    if (state.saving) return;
    const checked = validateForm();
    if (!checked.ok) { setMessage(checked.message, 'error'); return; }
    const actionLabel = state.editing ? '更新' : '追加';
    const publishLabel = checked.payload.active ? '表示' : '休止';
    if (!confirm(checked.payload.yearMonth + 'の' + targetLabel(checked.payload) + '設定を' + actionLabel + 'し、' + publishLabel + 'にします。よろしいですか？')) return;

    setSaving(true);
    setMessage('保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminSaveChallenge', Object.assign({ employeeId: auth.employeeId }, checked.payload));
      if (!result || !result.ok || !result.saved) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      setMessage('チャレンジ設定を保存しました。利用者画面には次回同期時に反映されます。', 'success');
      byId('adminChallengeFilterMonth').value = checked.payload.yearMonth;
      await loadChallenges();
      setTimeout(closeEditor, 1000);
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteChallenge(row) {
    if (!row || state.deleting || state.saving) return;
    if (!confirm((row.yearMonth || '') + 'の' + targetLabel(row) + 'の追加設定を削除し、自動の標準チャレンジへ戻します。よろしいですか？')) return;

    state.deleting = true;
    setMessage('標準チャレンジへ戻しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminDeleteChallenge', { employeeId: auth.employeeId, challengeId: row.challengeId });
      if (!result || !result.ok || !result.deleted) throw new Error(String((result && (result.reason || result.error)) || 'delete_failed'));
      closeEditor();
      await loadChallenges();
      setMessage('追加設定を削除し、自動の標準チャレンジへ戻しました。利用者画面には次回同期時に反映されます。', 'success');
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.deleting = false;
    }
  }

  function bind() {
    byId('adminChallengesRefresh').addEventListener('click', loadChallenges);
    byId('adminChallengeCreate').addEventListener('click', () => openEditor(null));
    byId('adminChallengeCancel').addEventListener('click', closeEditor);
    byId('adminChallengeSave').addEventListener('click', saveChallenge);
    byId('adminChallengeFilterMonth').addEventListener('change', loadChallenges);
    byId('adminChallengeFilterScope').addEventListener('change', loadChallenges);
    byId('adminChallengeScope').addEventListener('change', () => {
      toggleDepartment();
      if (!state.editing) applyDefaults(value('adminChallengeScope'));
    });
    byId('adminChallengesList').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const row = findChallenge(button.dataset.id);
      if (!row) return;
      if (button.dataset.action === 'edit-challenge') openEditor(row);
      if (button.dataset.action === 'delete-challenge') deleteChallenge(row);
    });
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminChallengeFilterMonth').value = currentYearMonth();
    bind();
    loadChallenges();
  }

  return { VERSION, init, loadChallenges };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminChallenges.init);
