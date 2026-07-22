const RinchanAdminUsers = (() => {
  const VERSION = 'v1.0.0';
  const state = {
    rows: [],
    departments: [],
    roles: [],
    editing: null,
    loading: false,
    saving: false,
    filterTimer: null
  };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
  function number(v) { return Number(v || 0).toLocaleString('ja-JP'); }

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

  function roleLabel(role) {
    const found = state.roles.find(item => String(item.value || '') === String(role || ''));
    return found ? found.label : (role || '一般');
  }

  function setStatus(text, isError) {
    const el = byId('adminUsersStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminUsersRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? '職員一覧を更新中' : '職員一覧を更新');
  }

  function setMessage(text, type) {
    const el = byId('adminUserMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success', 'is-error', 'is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function formatDate(valueToFormat) {
    const raw = String(valueToFormat || '').trim();
    if (!raw) return '記録なし';
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString('ja-JP');
  }

  function refreshOptions() {
    const filterDept = byId('adminUsersDept');
    const editDept = byId('adminUserDept');
    const filterRole = byId('adminUsersRole');
    const editRole = byId('adminUserRole');
    const deptOptions = state.departments.map(item => '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>');
    const roleOptions = state.roles.map(item => '<option value="' + escapeHtml(item.value) + '">' + escapeHtml(item.label) + '</option>');

    if (filterDept) {
      const keep = filterDept.value;
      filterDept.innerHTML = '<option value="">全部署</option>' + deptOptions.join('');
      filterDept.value = keep;
    }
    if (editDept) {
      const keep = editDept.value;
      editDept.innerHTML = '<option value="">所属未設定</option>' + deptOptions.join('');
      editDept.value = keep;
    }
    if (filterRole) {
      const keep = filterRole.value;
      filterRole.innerHTML = '<option value="">すべて</option>' + roleOptions.join('');
      filterRole.value = keep;
    }
    if (editRole) {
      const keep = editRole.value;
      editRole.innerHTML = roleOptions.join('');
      editRole.value = keep || 'general';
    }
  }

  function renderList() {
    const box = byId('adminUsersList');
    if (!box) return;
    if (!state.rows.length) {
      box.innerHTML = '<p class="admin-empty">条件に合う職員はいません。</p>';
      return;
    }

    box.innerHTML = state.rows.map(row => {
      const displayName = row.name || row.nick || row.employeeId;
      const role = String(row.role || 'general');
      return '<details class="admin-user-row">'
        + '<summary class="admin-user-summary"><span class="admin-user-summary-copy"><strong>' + escapeHtml(displayName) + '</strong><small>' + escapeHtml(row.dept || '所属未設定') + '・' + escapeHtml(row.employeeId) + '</small></span><span class="admin-user-role role-' + escapeHtml(role) + '">' + escapeHtml(roleLabel(role)) + '</span></summary>'
        + '<div class="admin-user-row-detail"><div class="admin-user-meta">'
        + '<span><small>メール</small><b>' + escapeHtml(row.email || '未設定') + '</b></span>'
        + '<span><small>週間目標</small><b>' + escapeHtml(row.weeklyStepGoal ? number(row.weeklyStepGoal) + '歩' : '未設定') + '</b></span>'
        + '<span><small>累計歩数</small><b>' + escapeHtml(number(row.totalSteps)) + '歩</b></span>'
        + '<span><small>最終記録</small><b>' + escapeHtml(formatDate(row.lastDate)) + '</b></span>'
        + '</div><div class="admin-user-row-actions"><button type="button" class="soft-button" data-action="edit-user" data-id="' + escapeHtml(row.employeeId) + '">編集</button></div></div>'
        + '</details>';
    }).join('');
  }

  function currentFilters() {
    return { query: value('adminUsersQuery'), dept: value('adminUsersDept'), role: value('adminUsersRole') };
  }

  async function loadUsers() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('職員一覧を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminUserList', Object.assign({ employeeId: auth.employeeId }, currentFilters()));
      if (!result || !result.ok || !result.data) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = Array.isArray(result.data.users) ? result.data.users : [];
      state.departments = Array.isArray(result.data.departments) ? result.data.departments : [];
      state.roles = Array.isArray(result.data.roles) ? result.data.roles : [];
      refreshOptions();
      renderList();
      setStatus('該当 ' + state.rows.length + '名', false);
    } catch (e) {
      state.rows = [];
      renderList();
      setStatus('職員一覧を取得できませんでした。', true);
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function findUser(employeeId) {
    return state.rows.find(row => String(row.employeeId || '') === String(employeeId || '')) || null;
  }

  function openEditor(row) {
    if (!row) return;
    state.editing = row;
    byId('adminUserEmployeeId').value = row.employeeId || '';
    byId('adminUserName').value = row.name || '';
    byId('adminUserNick').value = row.nick || '';
    byId('adminUserEmail').value = row.email || '';
    byId('adminUserDept').value = row.dept || '';
    byId('adminUserRole').value = row.role || 'general';
    byId('adminUserWeeklyGoal').value = row.weeklyStepGoal || '';
    setMessage('', 'info');
    const editor = byId('adminUserEditor');
    editor.classList.remove('hidden');
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.editing = null;
    byId('adminUserEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function validateForm() {
    const name = value('adminUserName');
    const email = value('adminUserEmail');
    const weeklyStepGoal = value('adminUserWeeklyGoal');
    if (!name) return { ok: false, message: '氏名を入力してください。' };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'メールアドレスの形式を確認してください。' };
    if (weeklyStepGoal && (!/^\d+$/.test(weeklyStepGoal) || Number(weeklyStepGoal) < 1000 || Number(weeklyStepGoal) > 1000000)) {
      return { ok: false, message: '週間歩数目標は1,000〜1,000,000歩で入力してください。' };
    }
    return {
      ok: true,
      payload: {
        targetEmployeeId: value('adminUserEmployeeId'),
        name,
        nick: value('adminUserNick'),
        email,
        dept: value('adminUserDept'),
        role: value('adminUserRole'),
        weeklyStepGoal
      }
    };
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminUserSave', 'adminUserCancel', 'adminUsersRefresh'].forEach(id => { const el = byId(id); if (el) el.disabled = !!busy; });
    const save = byId('adminUserSave');
    if (save) save.textContent = busy ? '保存中...' : '変更を保存';
  }

  function errorMessage(reason) {
    const messages = {
      admin_required: '管理者として認証できませんでした。もう一度ログインしてください。',
      manage_users_required: '職員管理の権限がありません。',
      user_not_found: '対象の職員が見つかりません。',
      name_required: '氏名を入力してください。',
      email_invalid: 'メールアドレスの形式を確認してください。',
      role_invalid: '権限の選択を確認してください。',
      self_admin_role_required: '自分自身の管理者権限は外せません。',
      weekly_step_goal_integer_required: '週間歩数目標は数字で入力してください。',
      weekly_step_goal_out_of_range: '週間歩数目標は1,000〜1,000,000歩で入力してください。'
    };
    return messages[String(reason || '')] || '通信に失敗しました。時間をおいてもう一度お試しください。';
  }

  function updateLocalParticipant(user) {
    const auth = authState();
    if (!user || auth.employeeId !== String(user.employeeId || '')) return;
    const merged = Object.assign({}, auth.user || {}, user);
    try {
      if (window.RinchanStorage && typeof RinchanStorage.setParticipant === 'function') RinchanStorage.setParticipant(merged);
      else localStorage.setItem('rinchanParticipant', JSON.stringify(merged));
    } catch (e) {}
  }

  async function saveUser() {
    if (state.saving || !state.editing) return;
    const checked = validateForm();
    if (!checked.ok) {
      setMessage(checked.message, 'error');
      return;
    }
    const oldRole = String(state.editing.role || 'general');
    const newRole = String(checked.payload.role || 'general');
    const prompt = oldRole === newRole
      ? 'この職員情報を更新します。よろしいですか？'
      : '権限を「' + roleLabel(oldRole) + '」から「' + roleLabel(newRole) + '」へ変更します。よろしいですか？';
    if (!confirm(prompt)) return;

    setSaving(true);
    setMessage('保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminUpdateUser', Object.assign({ employeeId: auth.employeeId }, checked.payload));
      if (!result || !result.ok || !result.user) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      updateLocalParticipant(result.user);
      setMessage('職員情報を更新しました。', 'success');
      await loadUsers();
      setTimeout(closeEditor, 700);
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  function bind() {
    byId('adminUsersRefresh').addEventListener('click', loadUsers);
    byId('adminUserSave').addEventListener('click', saveUser);
    byId('adminUserCancel').addEventListener('click', closeEditor);
    byId('adminUsersList').addEventListener('click', event => {
      const button = event.target.closest('[data-action="edit-user"]');
      if (!button) return;
      openEditor(findUser(button.dataset.id));
    });
    ['adminUsersDept', 'adminUsersRole'].forEach(id => byId(id).addEventListener('change', loadUsers));
    byId('adminUsersQuery').addEventListener('input', () => {
      clearTimeout(state.filterTimer);
      state.filterTimer = setTimeout(loadUsers, 280);
    });
  }

  function init() {
    if (!guardPageAccess()) return;
    bind();
    loadUsers();
  }

  return { VERSION, init, loadUsers };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminUsers.init);
