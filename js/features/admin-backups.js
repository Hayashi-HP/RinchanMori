const RinchanAdminBackups = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows:[], loading:false, creating:false };

  function byId(id) { return document.getElementById(id); }
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

  function formatDate(value) {
    const date = new Date(value || '');
    if (isNaN(date)) return '日時不明';
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function labelText(value) {
    return String(value || '') === 'daily' ? '日次自動' : '手動';
  }

  function parseDetail(row) {
    try {
      const detail = JSON.parse(String(row.detailJson || '{}'));
      return detail && Array.isArray(detail.results) ? detail.results : [];
    } catch (e) { return []; }
  }

  function setStatus(text, error) {
    const el = byId('adminBackupsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setMessage(text, type) {
    const el = byId('adminBackupMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success','is-error','is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setRefreshBusy(busy) {
    const button = byId('adminBackupsRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'バックアップ履歴を更新中' : 'バックアップ履歴を更新');
  }

  function updateSummary() {
    const latest = state.rows[0] || null;
    byId('adminBackupHistoryCount').textContent = String(state.rows.length) + '件';
    byId('adminBackupLatestAt').textContent = latest ? formatDate(latest.createdAt) : 'まだありません';
    byId('adminBackupLatestResult').textContent = latest ? (latest.ok ? '成功' : '要確認') : '-';
  }

  function renderList() {
    const box = byId('adminBackupsList');
    if (!box) return;
    if (!state.rows.length) { box.innerHTML = '<p class="admin-empty">バックアップ履歴はまだありません。</p>'; return; }
    box.innerHTML = state.rows.map(row => {
      const results = parseDetail(row);
      const failures = results.filter(item => !item.copied);
      const copiedNames = results.filter(item => item.copied).map(item => item.sourceName).filter(Boolean);
      const detail = copiedNames.length ? copiedNames.join('、') : '詳細情報なし';
      return '<details class="admin-badge-row">'
        + '<summary class="admin-badge-summary"><span class="admin-badge-icon">' + (row.ok ? '🗄️' : '⚠️') + '</span><span class="admin-badge-summary-copy"><strong>' + escapeHtml(formatDate(row.createdAt)) + '</strong><small>' + escapeHtml(labelText(row.label)) + '・' + escapeHtml(row.copiedCount || 0) + '/' + escapeHtml(row.sourceCount || 0) + 'シート</small></span><span class="admin-badge-status ' + (row.ok ? 'is-active' : 'is-inactive') + '">' + (row.ok ? '成功' : '要確認') + '</span></summary>'
        + '<div class="admin-badge-row-detail"><div class="admin-badge-meta"><small>コピーした対象</small><b>' + escapeHtml(detail) + '</b>' + (failures.length ? '<small>コピーできなかった対象</small><b>' + escapeHtml(failures.map(item => item.sourceName || '不明').join('、')) + '</b>' : '') + '<small>実行者</small><b>' + escapeHtml(row.actorEmployeeId || '自動実行') + '</b></div></div>'
        + '</details>';
    }).join('');
  }

  async function loadBackups() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('バックアップ履歴を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('recentBackups', { employeeId:auth.employeeId, limit:50 });
      if (!result || !result.ok || !Array.isArray(result.backups)) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = result.backups;
      updateSummary();
      renderList();
      setStatus('履歴 ' + state.rows.length + '件', false);
    } catch (e) {
      state.rows = [];
      updateSummary();
      renderList();
      setStatus('バックアップ履歴を取得できませんでした。', true);
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。', 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function setCreating(busy) {
    state.creating = !!busy;
    const button = byId('adminBackupCreate');
    if (button) { button.disabled = !!busy; button.textContent = busy ? '作成中...' : '今すぐバックアップ'; }
    if (byId('adminBackupsRefresh')) byId('adminBackupsRefresh').disabled = !!busy;
  }

  async function createBackup() {
    if (state.creating) return;
    if (!confirm('現在の主要データを、同じスプレッドシート内の非表示シートへコピーします。実行してよろしいですか？')) return;
    setCreating(true);
    setMessage('バックアップを作成しています。画面を閉じずにお待ちください...', 'info');
    try {
      const auth = authState();
      const result = await api('createBackup', { employeeId:auth.employeeId, label:'manual' });
      if (!result || !result.ok || !result.backup) throw new Error(String((result && (result.reason || result.error)) || 'backup_failed'));
      setMessage(result.backup.copiedCount + 'シートのバックアップを作成しました。', 'success');
      await loadBackups();
    } catch (e) {
      setMessage('すべてのバックアップを作成できませんでした。履歴の「要確認」を確認してください。', 'error');
      await loadBackups();
    } finally {
      setCreating(false);
    }
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminBackupsRefresh').addEventListener('click', loadBackups);
    byId('adminBackupCreate').addEventListener('click', createBackup);
    loadBackups();
  }

  return { VERSION, init, loadBackups };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminBackups.init);
