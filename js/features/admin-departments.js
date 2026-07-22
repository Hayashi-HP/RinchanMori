const RinchanAdminDepartments = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows: [], editing: null, loading: false, saving: false };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }

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

  function setStatus(text, isError) {
    const el = byId('adminDepartmentsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminDepartmentsRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? '部署一覧を更新中' : '部署一覧を更新');
  }

  function setMessage(text, type) {
    const el = byId('adminDepartmentMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success', 'is-error', 'is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function renderList() {
    const box = byId('adminDepartmentsList');
    if (!box) return;
    if (!state.rows.length) {
      box.innerHTML = '<p class="admin-empty">部署が登録されていません。</p>';
      return;
    }

    box.innerHTML = state.rows.map(row => {
      const statusClass = row.active ? 'is-active' : 'is-inactive';
      const statusLabel = row.active ? '利用中' : '利用停止';
      return '<details class="admin-department-row">'
        + '<summary class="admin-department-summary"><span class="admin-department-order">' + escapeHtml(row.displayOrder) + '</span><span class="admin-department-summary-copy"><strong>' + escapeHtml(row.deptName || '-') + '</strong><small>所属 ' + escapeHtml(row.memberCount || 0) + '名</small></span><span class="admin-department-status ' + statusClass + '">' + statusLabel + '</span></summary>'
        + '<div class="admin-department-row-detail"><div class="admin-department-meta"><span><small>部署ID</small><b>' + escapeHtml(row.deptId || '-') + '</b></span><span><small>杜の表示分類</small><b>' + escapeHtml(row.mapKey || 'other') + '</b></span></div><div class="admin-department-row-actions"><button type="button" class="soft-button" data-action="edit-department" data-id="' + escapeHtml(row.deptId || '') + '">編集</button></div></div>'
        + '</details>';
    }).join('');
  }

  async function loadDepartments() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('部署一覧を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminDepartmentList', { employeeId: auth.employeeId });
      if (!result || !result.ok || !result.data) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = Array.isArray(result.data.departments) ? result.data.departments : [];
      renderList();
      setStatus('全部署 ' + state.rows.length + '件・利用中 ' + Number(result.data.activeCount || 0) + '件', false);
    } catch (e) {
      state.rows = [];
      renderList();
      setStatus('部署一覧を取得できませんでした。', true);
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function findDepartment(deptId) {
    return state.rows.find(row => String(row.deptId || '') === String(deptId || '')) || null;
  }

  function nextDisplayOrder() {
    const max = state.rows.reduce((current, row) => Math.max(current, Number(row.displayOrder || 0)), 0);
    return Math.min(9999, max ? max + 10 : 10);
  }

  function configureInactiveOption(row) {
    const select = byId('adminDepartmentActive');
    if (!select) return;
    const inactive = select.querySelector('option[value="false"]');
    if (!inactive) return;
    inactive.disabled = !!(row && row.active && Number(row.memberCount || 0) > 0);
  }

  function openEditor(row) {
    state.editing = row || null;
    byId('adminDepartmentEditorTitle').textContent = row ? '部署を編集' : '部署を追加';
    byId('adminDepartmentEditorNote').textContent = row ? '部署IDは変更されません。' : '部署名と表示順を入力してください。';
    byId('adminDepartmentName').value = row ? String(row.deptName || '') : '';
    byId('adminDepartmentOrder').value = row ? String(row.displayOrder || '') : String(nextDisplayOrder());
    byId('adminDepartmentActive').value = row && row.active === false ? 'false' : 'true';
    configureInactiveOption(row);
    setMessage('', 'info');
    const editor = byId('adminDepartmentEditor');
    editor.classList.remove('hidden');
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.editing = null;
    configureInactiveOption(null);
    byId('adminDepartmentEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function validateForm() {
    const deptName = value('adminDepartmentName');
    const displayOrder = value('adminDepartmentOrder');
    if (!deptName) return { ok: false, message: '部署名を入力してください。' };
    if (!/^\d+$/.test(displayOrder) || Number(displayOrder) < 1 || Number(displayOrder) > 9999) {
      return { ok: false, message: '表示順は1〜9999の整数で入力してください。' };
    }
    return {
      ok: true,
      payload: {
        deptId: state.editing ? state.editing.deptId : '',
        deptName,
        displayOrder,
        active: value('adminDepartmentActive') === 'true'
      }
    };
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminDepartmentSave', 'adminDepartmentCancel', 'adminDepartmentCreate', 'adminDepartmentsRefresh'].forEach(id => {
      const el = byId(id);
      if (el) el.disabled = !!busy;
    });
    const save = byId('adminDepartmentSave');
    if (save) save.textContent = busy ? '保存中...' : '変更を保存';
  }

  function errorMessage(reason) {
    const messages = {
      admin_required: '管理者として認証できませんでした。もう一度ログインしてください。',
      manage_users_required: '部署管理の権限がありません。',
      department_not_found: '対象の部署が見つかりません。',
      department_name_required: '部署名を入力してください。',
      department_name_duplicate: '同じ名前の部署がすでに登録されています。',
      department_name_too_long: '部署名は80文字以内で入力してください。',
      department_order_integer_required: '表示順は整数で入力してください。',
      department_order_out_of_range: '表示順は1〜9999で入力してください。',
      department_in_use: '所属職員がいるため利用停止にできません。先に職員の所属を変更してください。'
    };
    return messages[String(reason || '')] || '通信に失敗しました。時間をおいてもう一度お試しください。';
  }

  async function saveDepartment() {
    if (state.saving) return;
    const checked = validateForm();
    if (!checked.ok) {
      setMessage(checked.message, 'error');
      return;
    }

    let prompt = state.editing ? '部署情報を更新します。よろしいですか？' : '新しい部署を追加します。よろしいですか？';
    if (state.editing && String(state.editing.deptName || '') !== checked.payload.deptName) {
      prompt = '部署名を「' + state.editing.deptName + '」から「' + checked.payload.deptName + '」へ変更します。所属職員とお知らせの対象部署も更新されます。よろしいですか？';
    }
    if (!confirm(prompt)) return;

    setSaving(true);
    setMessage('保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminSaveDepartment', Object.assign({ employeeId: auth.employeeId }, checked.payload));
      if (!result || !result.ok || !result.saved) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      const updatedUsers = Number(result.saved.updatedUsers || 0);
      const suffix = updatedUsers ? ' 所属職員' + updatedUsers + '名も更新しました。' : '';
      setMessage('部署情報を保存しました。' + suffix, 'success');
      await loadDepartments();
      setTimeout(closeEditor, 900);
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  function bind() {
    byId('adminDepartmentsRefresh').addEventListener('click', loadDepartments);
    byId('adminDepartmentCreate').addEventListener('click', () => openEditor(null));
    byId('adminDepartmentSave').addEventListener('click', saveDepartment);
    byId('adminDepartmentCancel').addEventListener('click', closeEditor);
    byId('adminDepartmentsList').addEventListener('click', event => {
      const button = event.target.closest('[data-action="edit-department"]');
      if (!button) return;
      openEditor(findDepartment(button.dataset.id));
    });
  }

  function init() {
    if (!guardPageAccess()) return;
    bind();
    loadDepartments();
  }

  return { VERSION, init, loadDepartments };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminDepartments.init);
