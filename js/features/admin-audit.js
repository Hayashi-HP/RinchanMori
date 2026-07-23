const RinchanAdminAudit = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows:[], loading:false, reloadPending:false, queryTimer:null };

  const ACTION_LABELS = {
    adminUpdateUser:'職員情報を更新', adminSaveDepartment:'部署を保存', adminSaveChallenge:'チャレンジを保存',
    adminDeleteChallenge:'チャレンジを標準へ戻す', adminSaveBadge:'バッジを保存', adminSaveEvent:'イベントを保存',
    adminDeleteEvent:'イベントを削除・標準へ戻す', adminUpdateActivity:'歩数を修正', adminSaveNews:'お知らせを保存',
    adminPublishNews:'お知らせを公開', adminUnpublishNews:'お知らせを公開停止', adminDeleteNews:'お知らせを削除',
    createBackup:'バックアップを作成', clearCache:'キャッシュを消去', login:'ログイン', loginV2:'ログイン',
    loginUser:'ログイン', saveActivity:'歩数を記録', deleteActivity:'歩数記録を削除', saveThanks:'ありがとうを送信',
    recentAuditLogs:'監査ログを閲覧'
  };
  const CATEGORY_LABELS = { change:'変更', error:'要確認', access:'ログイン', view:'閲覧' };

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

  function formatDate(value) {
    const date = new Date(value || '');
    if (isNaN(date)) return '日時不明';
    return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function actionLabel(action) { return ACTION_LABELS[String(action || '')] || String(action || '操作内容不明'); }
  function categoryIcon(category) {
    const paths = {
      change:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
      error:'<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
      access:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      view:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
    };
    return '<svg aria-hidden="true" viewBox="0 0 24 24">' + (paths[category] || paths.view) + '</svg>';
  }
  function resultOk(row) { return String(row && row.status || '').toLowerCase() === 'ok'; }
  function actorLabel(row) {
    const name = String(row.actorName || '').trim();
    const id = String(row.actorEmployeeId || '').trim();
    if (name && id) return name + '（' + id + '）';
    return name || id || 'システム';
  }
  function targetLabel(row) {
    const type = String(row.targetType || '').trim();
    const id = String(row.targetId || '').trim();
    return [type, id].filter(Boolean).join(' / ') || '対象情報なし';
  }

  function detailLabel(key) {
    const labels = { date:'日付', dept:'部署', employeeId:'社員番号', id:'ID', title:'タイトル', name:'名称', status:'状態', reason:'理由', before:'変更前', after:'変更後' };
    return labels[key] || key;
  }

  function detailHtml(detailJson) {
    let detail;
    try { detail = JSON.parse(String(detailJson || '{}')); } catch (e) { return '<b>詳細情報なし</b>'; }
    if (!detail || typeof detail !== 'object') return '<b>詳細情報なし</b>';
    const entries = Object.keys(detail).filter(key => !/(pin|password|token|secret)/i.test(key)).slice(0, 8);
    if (!entries.length) return '<b>詳細情報なし</b>';
    return entries.map(key => {
      const raw = detail[key];
      const value = raw && typeof raw === 'object' ? JSON.stringify(raw, (nestedKey, nestedValue) => /(pin|password|token|secret)/i.test(nestedKey) ? '[非表示]' : nestedValue) : String(raw == null ? '' : raw);
      return '<small>' + escapeHtml(detailLabel(key)) + '</small><b>' + escapeHtml(value || '-') + '</b>';
    }).join('');
  }

  function setStatus(text, error) {
    const el = byId('adminAuditStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminAuditRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? '監査ログを更新中' : '監査ログを更新');
  }

  function updateSummary() {
    const failures = state.rows.filter(row => !resultOk(row)).length;
    byId('adminAuditCount').textContent = String(state.rows.length) + '件';
    byId('adminAuditFailureCount').textContent = String(failures) + '件';
    byId('adminAuditLatestAt').textContent = state.rows.length ? formatDate(state.rows[0].loggedAt) : '-';
  }

  function renderList() {
    const box = byId('adminAuditList');
    if (!box) return;
    if (!state.rows.length) { box.innerHTML = '<p class="admin-empty">条件に一致する記録はありません。</p>'; return; }
    box.innerHTML = state.rows.map(row => {
      const ok = resultOk(row);
      const category = String(row.category || 'view');
      return '<details class="admin-badge-row">'
        + '<summary class="admin-badge-summary"><span class="admin-badge-icon admin-audit-icon is-' + escapeHtml(category) + '">' + categoryIcon(category) + '</span><span class="admin-badge-summary-copy"><strong>' + escapeHtml(actionLabel(row.action)) + '</strong><small>' + escapeHtml(formatDate(row.loggedAt)) + '・' + escapeHtml(actorLabel(row)) + '</small></span><span class="admin-badge-status ' + (ok ? 'is-active' : 'is-error') + '">' + (ok ? '成功' : '失敗') + '</span></summary>'
        + '<div class="admin-badge-row-detail"><div class="admin-badge-meta"><small>種類</small><b>' + escapeHtml(CATEGORY_LABELS[category] || category) + '</b><small>対象</small><b>' + escapeHtml(targetLabel(row)) + '</b><small>記録メッセージ</small><b>' + escapeHtml(row.message || '記録なし') + '</b>' + detailHtml(row.detailJson) + '<small>記録バージョン</small><b>' + escapeHtml(row.version || '-') + '</b></div></div>'
        + '</details>';
    }).join('');
  }

  function filterPayload() {
    const auth = authState();
    return {
      employeeId:auth.employeeId,
      category:byId('adminAuditCategory').value,
      status:byId('adminAuditResult').value,
      limit:Number(byId('adminAuditLimit').value || 100),
      query:byId('adminAuditQuery').value.trim()
    };
  }

  async function loadAuditLogs() {
    if (state.loading) { state.reloadPending = true; return; }
    state.loading = true;
    setRefreshBusy(true);
    setStatus('監査ログを読み込み中...', false);
    try {
      const result = await api('recentAuditLogs', filterPayload());
      if (!result || !result.ok || !Array.isArray(result.logs)) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = result.logs;
      updateSummary();
      renderList();
      setStatus('表示中 ' + state.rows.length + '件', false);
    } catch (e) {
      state.rows = [];
      updateSummary();
      renderList();
      setStatus('監査ログを取得できませんでした。時間をおいてもう一度お試しください。', true);
    } finally {
      state.loading = false;
      setRefreshBusy(false);
      if (state.reloadPending) { state.reloadPending = false; loadAuditLogs(); }
    }
  }

  function queueSearch() {
    clearTimeout(state.queryTimer);
    state.queryTimer = setTimeout(loadAuditLogs, 400);
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminAuditRefresh').addEventListener('click', loadAuditLogs);
    ['adminAuditCategory','adminAuditResult','adminAuditLimit'].forEach(id => byId(id).addEventListener('change', loadAuditLogs));
    byId('adminAuditQuery').addEventListener('input', queueSearch);
    loadAuditLogs();
  }

  return { VERSION, init, loadAuditLogs };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminAudit.init);
