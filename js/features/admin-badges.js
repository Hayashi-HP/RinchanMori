const RinchanAdminBadges = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows: [], editing: null, loading: false, saving: false };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }

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
    return { employeeId, loggedIn:!!employeeId, isAdmin };
  }

  function guardPageAccess() {
    const auth = authState();
    if (!auth.loggedIn) { alert('ログイン後に管理画面をご利用ください。'); location.href = 'login.html'; return false; }
    if (!auth.isAdmin) { location.href = 'mypage.html'; return false; }
    return true;
  }

  async function api(action, payload) {
    if (window.RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    return { ok:false, error:'api_not_ready' };
  }

  function setStatus(text, error) {
    const el = byId('adminBadgesStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setMessage(text, type) {
    const el = byId('adminBadgeMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success', 'is-error', 'is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setRefreshBusy(busy) {
    const button = byId('adminBadgesRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'バッジ一覧を更新中' : 'バッジ一覧を更新');
  }

  function renderList() {
    const box = byId('adminBadgesList');
    if (!box) return;
    if (!state.rows.length) { box.innerHTML = '<p class="admin-empty">この分類のバッジはありません。</p>'; return; }
    box.innerHTML = state.rows.map(row => {
      const statusClass = row.active ? 'is-active' : 'is-inactive';
      const statusLabel = row.active ? '表示中' : '休止中';
      return '<details class="admin-badge-row">'
        + '<summary class="admin-badge-summary"><span class="admin-badge-icon">' + escapeHtml(row.icon || '🏅') + '</span><span class="admin-badge-summary-copy"><strong>' + escapeHtml(row.name || '-') + '</strong><small>' + escapeHtml(row.group || '-') + '・' + escapeHtml(row.hint || '条件未設定') + '</small></span><span class="admin-badge-status ' + statusClass + '">' + statusLabel + '</span></summary>'
        + '<div class="admin-badge-row-detail"><div class="admin-badge-meta"><small>自動付与ID</small><b>' + escapeHtml(row.badgeId || '-') + '</b></div><div class="admin-badge-row-actions"><button type="button" class="soft-button" data-action="edit-badge" data-id="' + escapeHtml(row.badgeId || '') + '">編集</button></div></div>'
        + '</details>';
    }).join('');
  }

  function refreshGroupOptions(groups) {
    const select = byId('adminBadgeFilterGroup');
    if (!select) return;
    const keep = select.value;
    select.innerHTML = '<option value="">すべて</option>' + (groups || []).map(group => '<option value="' + escapeHtml(group) + '">' + escapeHtml(group) + '</option>').join('');
    select.value = keep;
  }

  async function loadBadges() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('バッジ一覧を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminBadgeList', { employeeId:auth.employeeId, group:value('adminBadgeFilterGroup') });
      if (!result || !result.ok || !result.data) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = Array.isArray(result.data.badges) ? result.data.badges : [];
      refreshGroupOptions(result.data.groups || []);
      renderList();
      setStatus('表示中 ' + Number(result.data.activeCount || 0) + '件・全' + Number(result.data.total || 0) + '件', false);
    } catch (e) {
      state.rows = [];
      renderList();
      setStatus('バッジ一覧を取得できませんでした。', true);
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function findBadge(id) { return state.rows.find(row => String(row.badgeId || '') === String(id || '')) || null; }

  function openEditor(row) {
    if (!row) return;
    state.editing = row;
    byId('adminBadgeEditorTitle').textContent = row.name || 'バッジを編集';
    byId('adminBadgeGroup').value = row.group || '';
    byId('adminBadgeIcon').value = row.icon || '';
    byId('adminBadgeName').value = row.name || '';
    byId('adminBadgeHint').value = row.hint || '';
    byId('adminBadgeActive').value = row.active ? 'true' : 'false';
    setMessage('', 'info');
    const editor = byId('adminBadgeEditor');
    editor.classList.remove('hidden');
    editor.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function closeEditor() {
    state.editing = null;
    byId('adminBadgeEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function errorMessage(reason) {
    const messages = {
      admin_required:'管理者として認証できませんでした。もう一度ログインしてください。',
      manage_badges_required:'バッジ管理の権限がありません。',
      badge_not_found:'対象のバッジが見つかりません。',
      badge_name_required:'バッジ名を入力してください。',
      badge_icon_too_long:'アイコンが長すぎます。',
      badge_name_too_long:'バッジ名は80文字以内で入力してください。',
      badge_hint_too_long:'獲得条件の説明は120文字以内で入力してください。'
    };
    return messages[String(reason || '')] || '通信に失敗しました。時間をおいてもう一度お試しください。';
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminBadgeSave','adminBadgeCancel','adminBadgesRefresh'].forEach(id => { const el = byId(id); if (el) el.disabled = !!busy; });
    byId('adminBadgeSave').textContent = busy ? '保存中...' : '変更を保存';
  }

  async function saveBadge() {
    if (state.saving || !state.editing) return;
    const name = value('adminBadgeName');
    if (!name) { setMessage('バッジ名を入力してください。', 'error'); return; }
    if (!confirm('「' + name + '」の表示内容を更新します。よろしいですか？')) return;
    setSaving(true);
    setMessage('保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminSaveBadge', {
        employeeId:auth.employeeId,
        badgeId:state.editing.badgeId,
        icon:value('adminBadgeIcon'),
        name,
        hint:value('adminBadgeHint'),
        active:value('adminBadgeActive') === 'true'
      });
      if (!result || !result.ok || !result.saved) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      await loadBadges();
      closeEditor();
      setMessage('バッジ設定を保存しました。利用者画面には次回同期時に反映されます。', 'success');
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  function bind() {
    byId('adminBadgesRefresh').addEventListener('click', loadBadges);
    byId('adminBadgeFilterGroup').addEventListener('change', loadBadges);
    byId('adminBadgeSave').addEventListener('click', saveBadge);
    byId('adminBadgeCancel').addEventListener('click', closeEditor);
    byId('adminBadgesList').addEventListener('click', event => {
      const button = event.target.closest('[data-action="edit-badge"]');
      if (button) openEditor(findBadge(button.dataset.id));
    });
  }

  function init() {
    if (!guardPageAccess()) return;
    bind();
    loadBadges();
  }

  return { VERSION, init, loadBadges };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminBadges.init);
