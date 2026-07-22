const RinchanAdminNews = (() => {
  const VERSION = 'v1.5.24';
  const state = {
    rows: [],
    departments: [],
    editing: null,
    loading: false,
    saving: false,
    filterTimer: null
  };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }

  function participant() {
    try {
      if (window.RinchanApi && typeof RinchanApi.authState === 'function') return RinchanApi.authState().user || null;
    } catch (e) {}
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    } catch (e) {
      return null;
    }
  }

  function authState() {
    const user = participant();
    const employeeId = user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
    const isAdmin = !!(user && (String(user.admin || '') === '1' || user.admin === true || String(user.role || '').toLowerCase() === 'admin'));
    return { user, employeeId, loggedIn: !!employeeId, isAdmin };
  }

  function denyAndRedirect(message, url) {
    try {
      if (url === 'mypage.html') sessionStorage.setItem('rinchanAdminAccessNotice', message);
      else alert(message);
    } catch (e) {}
    location.href = url;
  }

  function guardPageAccess() {
    const state = authState();
    if (!state.loggedIn) {
      denyAndRedirect('ログイン後に管理画面をご利用ください。', 'login.html');
      return false;
    }
    if (!state.isAdmin) {
      denyAndRedirect('管理者のみ利用できます。', 'mypage.html');
      return false;
    }
    return true;
  }

  async function api(action, payload) {
    if (window.RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    return { ok: false, error: 'api_not_ready' };
  }

  function setStatus(text, isError) {
    const el = byId('adminNewsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminNewsRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'お知らせ一覧を更新中' : 'お知らせ一覧を更新');
  }

  function setMessage(text, type) {
    const el = byId('adminNewsMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success', 'is-error', 'is-info');
    if (!text) return;
    el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function normalizeDateTimeLocalInput(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hour + ':' + minute;
  }

  function toLocalDateTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return normalizeDateTimeLocalInput(d);
  }

  function formatDateTime(value) {
    const d = new Date(String(value || ''));
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('ja-JP');
  }

  function statusLabel(status) {
    return String(status || '') === 'published' ? '公開中' : '下書き';
  }

  function targetLabel(row) {
    if (String(row.targetType || '') === 'department') return '部署: ' + String(row.targetDept || '-');
    return '全職員';
  }

  function refreshDeptOptions() {
    const deptFilter = byId('adminNewsFilterDept');
    const deptInput = byId('adminNewsTargetDept');
    const deptList = state.departments.slice();
    const options = ['<option value="">全部署</option>'].concat(deptList.map(item => '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>'));
    if (deptFilter) {
      const keep = deptFilter.value;
      deptFilter.innerHTML = options.join('');
      deptFilter.value = keep;
    }
    if (deptInput) {
      const keep = deptInput.value;
      deptInput.innerHTML = ['<option value="">選択してください</option>'].concat(deptList.map(item => '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>')).join('');
      deptInput.value = keep;
    }
  }

  function renderList() {
    const box = byId('adminNewsList');
    if (!box) return;
    if (!state.rows.length) {
      box.innerHTML = '<p class="admin-empty">条件に合うお知らせはありません。</p>';
      return;
    }

    box.innerHTML = state.rows.map(row => {
      const published = String(row.status || '') === 'published';
      const publishLabel = published ? '公開停止' : '公開';
      const statusClass = published ? 'status-published' : 'status-draft';
      return '<article class="admin-news-row">'
        + '<h3>' + escapeHtml(row.title || '-') + '</h3>'
        + '<div class="admin-news-row-meta">'
        + '<span>種別: ' + escapeHtml(row.type === 'group' ? 'グループニュース' : 'お知らせ') + '</span>'
        + '<span>対象: ' + escapeHtml(targetLabel(row)) + '</span>'
        + '<span>状態: <span class="admin-news-status-pill ' + statusClass + '">' + escapeHtml(statusLabel(row.status)) + '</span></span>'
        + '<span>公開開始: ' + escapeHtml(formatDateTime(row.startAt)) + '</span>'
        + '<span>公開終了: ' + escapeHtml(formatDateTime(row.endAt)) + '</span>'
        + '<span>更新日時: ' + escapeHtml(formatDateTime(row.updatedAt || row.createdAt)) + '</span>'
        + '</div>'
        + '<div class="admin-news-row-actions">'
        + '<button type="button" class="soft-button" data-action="edit" data-id="' + escapeHtml(row.noticeId || '') + '">編集</button>'
        + '<button type="button" class="soft-button" data-action="toggle" data-id="' + escapeHtml(row.noticeId || '') + '">' + publishLabel + '</button>'
        + '<button type="button" class="soft-button" data-action="delete" data-id="' + escapeHtml(row.noticeId || '') + '">削除</button>'
        + '</div>'
        + '</article>';
    }).join('');
  }

  function findRow(noticeId) {
    return state.rows.find(row => String(row.noticeId || '') === String(noticeId || '')) || null;
  }

  function currentFilters() {
    return {
      status: value('adminNewsFilterStatus'),
      type: value('adminNewsFilterType'),
      targetDept: value('adminNewsFilterDept'),
      query: value('adminNewsFilterQuery')
    };
  }

  async function loadList() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('一覧を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminNewsList', Object.assign({ employeeId: auth.employeeId }, currentFilters()));
      if (!result || !result.ok || !result.data) {
        setStatus('一覧取得に失敗しました。', true);
        setMessage('一覧取得に失敗しました。' + String((result && (result.reason || result.error)) || ''), 'error');
        state.rows = [];
        renderList();
        return;
      }
      state.rows = Array.isArray(result.data.notices) ? result.data.notices : [];
      state.departments = Array.isArray(result.data.departments) ? result.data.departments : [];
      refreshDeptOptions();
      renderList();
      setStatus('一覧 ' + state.rows.length + '件', false);
    } catch (e) {
      setStatus('一覧取得に失敗しました。', true);
      setMessage('一覧取得に失敗しました。' + (e.message || ''), 'error');
      state.rows = [];
      renderList();
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function resetEditor() {
    state.editing = null;
    byId('adminNewsEditorTitle').textContent = '新規作成';
    byId('adminNewsEditorNote').textContent = '項目を入力して保存してください。';
    byId('adminNewsType').value = 'notice';
    byId('adminNewsTitle').value = '';
    byId('adminNewsBody').value = '';
    byId('adminNewsAuthorName').value = '';
    byId('adminNewsTargetType').value = 'all';
    byId('adminNewsTargetDept').value = '';
    byId('adminNewsStartAt').value = '';
    byId('adminNewsEndAt').value = '';
    toggleTargetDept();
    setMessage('', 'info');
  }

  function openEditor(row) {
    const editor = byId('adminNewsEditor');
    if (!editor) return;
    editor.classList.remove('hidden');

    if (!row) {
      resetEditor();
      editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    state.editing = row;
    byId('adminNewsEditorTitle').textContent = '編集';
    byId('adminNewsEditorNote').textContent = 'noticeIdは変更されません。';
    byId('adminNewsType').value = String(row.type || 'notice');
    byId('adminNewsTitle').value = String(row.title || '');
    byId('adminNewsBody').value = String(row.body || '');
    byId('adminNewsAuthorName').value = String(row.authorName || '');
    byId('adminNewsTargetType').value = String(row.targetType || 'all');
    byId('adminNewsTargetDept').value = String(row.targetDept || '');
    byId('adminNewsStartAt').value = toLocalDateTime(row.startAt);
    byId('adminNewsEndAt').value = toLocalDateTime(row.endAt);
    toggleTargetDept();
    setMessage('', 'info');
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    const editor = byId('adminNewsEditor');
    if (!editor) return;
    editor.classList.add('hidden');
    resetEditor();
  }

  function toggleTargetDept() {
    const wrap = byId('adminNewsTargetDeptWrap');
    const targetType = value('adminNewsTargetType');
    if (!wrap) return;
    wrap.classList.toggle('hidden', targetType !== 'department');
  }

  function validateForm() {
    const type = value('adminNewsType');
    const title = value('adminNewsTitle');
    const body = value('adminNewsBody');
    const authorName = value('adminNewsAuthorName');
    const targetType = value('adminNewsTargetType');
    const targetDept = value('adminNewsTargetDept');
    const startAt = value('adminNewsStartAt');
    const endAt = value('adminNewsEndAt');

    if (!title) return { ok: false, message: 'タイトルは必須です。' };
    if (!body) return { ok: false, message: '本文は必須です。' };
    if (!authorName) return { ok: false, message: '発信者は必須です。' };
    if (!startAt) return { ok: false, message: '公開開始日時は必須です。' };
    if (targetType === 'department' && !targetDept) return { ok: false, message: '対象が部署の場合、対象部署は必須です。' };

    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) return { ok: false, message: '公開開始日時の形式が不正です。' };
    if (endAt) {
      const endDate = new Date(endAt);
      if (isNaN(endDate.getTime())) return { ok: false, message: '公開終了日時の形式が不正です。' };
      if (endDate.getTime() <= startDate.getTime()) return { ok: false, message: '公開終了日時は公開開始日時より後にしてください。' };
    }

    return {
      ok: true,
      payload: {
        noticeId: state.editing ? state.editing.noticeId : '',
        type,
        title,
        body,
        authorName,
        targetType,
        targetDept: targetType === 'department' ? targetDept : '',
        startAt,
        endAt
      }
    };
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminNewsSaveDraft', 'adminNewsSavePublish', 'adminNewsCancel', 'adminNewsCreate', 'adminNewsRefresh'].forEach(id => {
      const el = byId(id);
      if (el) el.disabled = !!busy;
    });
    const saveDraft = byId('adminNewsSaveDraft');
    const savePublish = byId('adminNewsSavePublish');
    if (saveDraft) saveDraft.textContent = busy ? '保存中...' : '下書き保存';
    if (savePublish) savePublish.textContent = busy ? '保存中...' : '公開保存';
  }

  async function saveNews(status) {
    if (state.saving) return;
    const checked = validateForm();
    if (!checked.ok) {
      setMessage(checked.message, 'error');
      return;
    }

    const confirmText = status === 'published' ? '公開保存します。よろしいですか？' : '下書き保存します。よろしいですか？';
    if (!confirm(confirmText)) return;

    setSaving(true);
    setMessage('保存中です...', 'info');
    try {
      const auth = authState();
      const payload = Object.assign({}, checked.payload, { status, employeeId: auth.employeeId });
      const result = await api('adminSaveNews', payload);
      if (!result || !result.ok || !result.saved || !result.saved.notice) {
        setMessage('保存に失敗しました。' + String((result && (result.reason || result.error)) || ''), 'error');
        return;
      }
      setMessage(status === 'published' ? '公開保存しました。' : '下書き保存しました。', 'success');
      await loadList();
      if (result.saved.notice && result.saved.notice.noticeId) {
        const updated = findRow(result.saved.notice.noticeId);
        if (updated) openEditor(updated);
      }
    } catch (e) {
      setMessage('保存に失敗しました。' + (e.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(noticeId) {
    const row = findRow(noticeId);
    if (!row) return;
    const published = String(row.status || '') === 'published';
    const ok = confirm(published ? '公開停止します。よろしいですか？' : '公開します。よろしいですか？');
    if (!ok) return;

    setMessage(published ? '公開停止中です...' : '公開中です...', 'info');
    try {
      const auth = authState();
      const action = published ? 'adminUnpublishNews' : 'adminPublishNews';
      const result = await api(action, { employeeId: auth.employeeId, noticeId: noticeId });
      if (!result || !result.ok) {
        setMessage((published ? '公開停止' : '公開') + 'に失敗しました。' + String((result && (result.reason || result.error)) || ''), 'error');
        return;
      }
      setMessage(published ? '公開停止しました。' : '公開しました。', 'success');
      await loadList();
    } catch (e) {
      setMessage((published ? '公開停止' : '公開') + 'に失敗しました。' + (e.message || ''), 'error');
    }
  }

  async function deleteNews(noticeId) {
    const row = findRow(noticeId);
    if (!row) return;
    if (!confirm('論理削除します。よろしいですか？\n削除後は通常一覧に表示されません。')) return;

    setMessage('削除中です...', 'info');
    try {
      const auth = authState();
      const result = await api('adminDeleteNews', { employeeId: auth.employeeId, noticeId: noticeId });
      if (!result || !result.ok) {
        setMessage('削除に失敗しました。' + String((result && (result.reason || result.error)) || ''), 'error');
        return;
      }
      setMessage('削除しました。', 'success');
      await loadList();
      if (state.editing && String(state.editing.noticeId || '') === String(noticeId)) closeEditor();
    } catch (e) {
      setMessage('削除に失敗しました。' + (e.message || ''), 'error');
    }
  }

  function installEvents() {
    const filterIds = ['adminNewsFilterStatus', 'adminNewsFilterType', 'adminNewsFilterDept'];
    filterIds.forEach(id => {
      const el = byId(id);
      if (!el || el.__adminNewsInstalled) return;
      el.__adminNewsInstalled = true;
      el.addEventListener('change', () => loadList());
    });

    const q = byId('adminNewsFilterQuery');
    if (q && !q.__adminNewsInstalled) {
      q.__adminNewsInstalled = true;
      q.addEventListener('input', () => {
        if (state.filterTimer) clearTimeout(state.filterTimer);
        state.filterTimer = setTimeout(() => loadList(), 220);
      });
    }

    const list = byId('adminNewsList');
    if (list && !list.__adminNewsInstalled) {
      list.__adminNewsInstalled = true;
      list.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest('button[data-action][data-id]');
        if (!button) return;
        const action = String(button.getAttribute('data-action') || '');
        const noticeId = String(button.getAttribute('data-id') || '');
        if (!noticeId) return;

        if (action === 'edit') {
          const row = findRow(noticeId);
          if (row) openEditor(row);
          return;
        }
        if (action === 'toggle') {
          togglePublish(noticeId);
          return;
        }
        if (action === 'delete') {
          deleteNews(noticeId);
        }
      });
    }

    const createButton = byId('adminNewsCreate');
    if (createButton && !createButton.__adminNewsInstalled) {
      createButton.__adminNewsInstalled = true;
      createButton.addEventListener('click', () => openEditor(null));
    }

    const refresh = byId('adminNewsRefresh');
    if (refresh && !refresh.__adminNewsInstalled) {
      refresh.__adminNewsInstalled = true;
      refresh.addEventListener('click', () => loadList());
    }

    const targetType = byId('adminNewsTargetType');
    if (targetType && !targetType.__adminNewsInstalled) {
      targetType.__adminNewsInstalled = true;
      targetType.addEventListener('change', toggleTargetDept);
    }

    const saveDraft = byId('adminNewsSaveDraft');
    if (saveDraft && !saveDraft.__adminNewsInstalled) {
      saveDraft.__adminNewsInstalled = true;
      saveDraft.addEventListener('click', () => saveNews('draft'));
    }

    const savePublish = byId('adminNewsSavePublish');
    if (savePublish && !savePublish.__adminNewsInstalled) {
      savePublish.__adminNewsInstalled = true;
      savePublish.addEventListener('click', () => saveNews('published'));
    }

    const cancel = byId('adminNewsCancel');
    if (cancel && !cancel.__adminNewsInstalled) {
      cancel.__adminNewsInstalled = true;
      cancel.addEventListener('click', () => closeEditor());
    }
  }

  function install() {
    if (!document.querySelector('.admin-news-app')) return;
    if (!guardPageAccess()) return;
    installEvents();
    resetEditor();
    loadList();
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    loadList
  };
})();

window.RinchanAdminNews = RinchanAdminNews;
