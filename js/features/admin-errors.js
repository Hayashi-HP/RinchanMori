const RinchanAdminErrors = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows:[], groups:[], loading:false, reloadPending:false, queryTimer:null };

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }

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

  function eventDate(row) { return row && (row.loggedAt || row.receivedAt) ? String(row.loggedAt || row.receivedAt) : ''; }
  function formatDate(value) {
    const date = new Date(value || '');
    if (isNaN(date)) return '日時不明';
    return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function pageLabel(value) {
    const text = String(value || '').split('?')[0].replace(/\/+$/, '');
    const part = text.split('/').filter(Boolean).pop();
    return part || text || '画面不明';
  }

  function typeLabel(type) {
    const labels = { error:'画面エラー', unhandledrejection:'通信・非同期エラー', admin:'管理画面エラー' };
    return labels[String(type || '').toLowerCase()] || String(type || '種類不明');
  }

  function groupRows(rows) {
    const map = new Map();
    rows.forEach(row => {
      const key = [String(row.type || '').toLowerCase(), String(row.page || '').split('?')[0], String(row.message || '').trim(), String(row.source || ''), String(row.line || '')].join('|');
      if (!map.has(key)) map.set(key, { latest:row, first:row, rows:[], employeeIds:new Set(), deviceIds:new Set() });
      const group = map.get(key);
      group.rows.push(row);
      group.first = row;
      if (row.employeeId) group.employeeIds.add(String(row.employeeId));
      if (row.deviceId) group.deviceIds.add(String(row.deviceId));
    });
    return Array.from(map.values());
  }

  function setStatus(text, error) {
    const el = byId('adminErrorsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminErrorsRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'エラーログを更新中' : 'エラーログを更新');
  }

  function updateSummary() {
    const pages = new Set(state.rows.map(row => pageLabel(row.page)));
    byId('adminErrorOccurrenceCount').textContent = String(state.rows.length) + '件';
    byId('adminErrorGroupCount').textContent = String(state.groups.length) + '種類';
    byId('adminErrorPageCount').textContent = String(pages.size) + '画面';
    byId('adminErrorLatestAt').textContent = state.rows.length ? formatDate(eventDate(state.rows[0])) : '-';
  }

  function errorIcon() {
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
  }

  function locationLabel(row) {
    const parts = [];
    if (row.source) parts.push(String(row.source).split('?')[0]);
    if (row.line) parts.push('行 ' + row.line);
    if (row.column) parts.push('列 ' + row.column);
    return parts.join(' / ') || '位置情報なし';
  }

  function renderList() {
    const box = byId('adminErrorsList');
    if (!box) return;
    if (!state.groups.length) { box.innerHTML = '<p class="admin-empty">条件に一致するエラーはありません。</p>'; return; }
    box.innerHTML = state.groups.map(group => {
      const row = group.latest;
      const employees = Array.from(group.employeeIds);
      const stack = String(row.stack || '').trim();
      return '<details class="admin-badge-row admin-error-row">'
        + '<summary class="admin-badge-summary"><span class="admin-badge-icon admin-error-icon">' + errorIcon() + '</span><span class="admin-badge-summary-copy"><strong>' + escapeHtml(row.message || typeLabel(row.type)) + '</strong><small>' + escapeHtml(formatDate(eventDate(row))) + '・' + escapeHtml(pageLabel(row.page)) + '・' + escapeHtml(typeLabel(row.type)) + '</small></span><span class="admin-error-count">' + escapeHtml(group.rows.length) + '回</span></summary>'
        + '<div class="admin-badge-row-detail"><div class="admin-badge-meta"><small>最後に発生</small><b>' + escapeHtml(formatDate(eventDate(row))) + '</b><small>今回の一覧内で最初に発生</small><b>' + escapeHtml(formatDate(eventDate(group.first))) + '</b><small>発生画面</small><b>' + escapeHtml(row.page || '画面不明') + '</b><small>発生位置</small><b>' + escapeHtml(locationLabel(row)) + '</b><small>社員番号</small><b>' + escapeHtml(employees.length ? employees.join('、') : '未ログイン・情報なし') + '</b><small>端末</small><b>' + escapeHtml(group.deviceIds.size ? group.deviceIds.size + '台' : '情報なし') + '</b>' + (stack ? '<small>詳細</small><pre class="admin-error-stack">' + escapeHtml(stack) + '</pre>' : '') + '<small>クライアント版</small><b>' + escapeHtml(row.clientVersion || '-') + '</b><small>ブラウザ情報</small><b>' + escapeHtml(row.userAgent || '情報なし') + '</b></div></div>'
        + '</details>';
    }).join('');
  }

  function filterPayload() {
    const auth = authState();
    return {
      employeeId:auth.employeeId,
      type:byId('adminErrorType').value,
      page:byId('adminErrorPage').value.trim(),
      limit:Number(byId('adminErrorLimit').value || 100),
      query:byId('adminErrorQuery').value.trim()
    };
  }

  async function loadErrorLogs() {
    if (state.loading) { state.reloadPending = true; return; }
    state.loading = true;
    setRefreshBusy(true);
    setStatus('エラーログを読み込み中...', false);
    try {
      const result = await api('recentErrorLogs', filterPayload());
      if (!result || !result.ok || !Array.isArray(result.logs)) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = result.logs;
      state.groups = groupRows(state.rows);
      updateSummary();
      renderList();
      setStatus('発生 ' + state.rows.length + '件・' + state.groups.length + '種類', false);
    } catch (e) {
      state.rows = [];
      state.groups = [];
      updateSummary();
      renderList();
      setStatus('エラーログを取得できませんでした。時間をおいてもう一度お試しください。', true);
    } finally {
      state.loading = false;
      setRefreshBusy(false);
      if (state.reloadPending) { state.reloadPending = false; loadErrorLogs(); }
    }
  }

  function queueSearch() {
    clearTimeout(state.queryTimer);
    state.queryTimer = setTimeout(loadErrorLogs, 400);
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminErrorsRefresh').addEventListener('click', loadErrorLogs);
    byId('adminErrorType').addEventListener('change', loadErrorLogs);
    byId('adminErrorLimit').addEventListener('change', loadErrorLogs);
    byId('adminErrorPage').addEventListener('input', queueSearch);
    byId('adminErrorQuery').addEventListener('input', queueSearch);
    loadErrorLogs();
  }

  return { VERSION, init, loadErrorLogs };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminErrors.init);
