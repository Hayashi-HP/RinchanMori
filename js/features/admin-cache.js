const RinchanAdminCache = (() => {
  const VERSION = 'v1.0.0';
  const state = { entries:[], loading:false, clearing:false };

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

  function formatBytes(value) {
    const bytes = Math.max(0, Number(value || 0));
    if (bytes < 1024) return Math.round(bytes) + ' B';
    return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
  }

  function ttlLabel(seconds) {
    const value = Number(seconds || 0);
    if (value >= 60 && value % 60 === 0) return String(value / 60) + '分';
    return String(value) + '秒';
  }

  function cacheIcon() {
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';
  }

  function setStatus(text, error) {
    const el = byId('adminCacheStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setMessage(text, type) {
    const el = byId('adminCacheMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success','is-error','is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setRefreshBusy(busy) {
    const button = byId('adminCacheRefresh');
    if (!button) return;
    button.disabled = !!busy || state.clearing;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'キャッシュ状態を更新中' : 'キャッシュ状態を更新');
    if (byId('adminCacheClear')) byId('adminCacheClear').disabled = !!busy || state.clearing;
  }

  function updateSummary(cache) {
    const entries = state.entries;
    const active = entries.filter(item => item.active).length;
    const size = entries.reduce((sum, item) => sum + Number(item.approximateBytes || 0), 0);
    byId('adminCacheActiveCount').textContent = active + '/' + (entries.length || 3);
    byId('adminCacheSize').textContent = formatBytes(size);
    byId('adminCacheVersion').textContent = String((cache && cache.version) || '-');
  }

  function renderList() {
    const box = byId('adminCacheList');
    if (!box) return;
    if (!state.entries.length) { box.innerHTML = '<p class="admin-empty">キャッシュ情報はありません。</p>'; return; }
    box.innerHTML = state.entries.map(item => '<article class="admin-cache-item ' + (item.active ? 'is-active' : 'is-empty') + '"><span class="admin-cache-item-icon">' + cacheIcon() + '</span><div class="admin-cache-item-copy"><strong>' + escapeHtml(item.label || item.name) + '</strong><small>保持時間：最大 ' + escapeHtml(ttlLabel(item.ttlSeconds)) + '</small><small>およその容量：' + escapeHtml(formatBytes(item.approximateBytes)) + '</small></div><span class="admin-badge-status ' + (item.active ? 'is-active' : 'is-inactive') + '">' + (item.active ? '保持中' : '未作成') + '</span></article>').join('');
  }

  async function loadCacheStatus() {
    if (state.loading || state.clearing) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('キャッシュ状態を確認中...', false);
    try {
      const auth = authState();
      const result = await api('cacheStatus', { employeeId:auth.employeeId });
      if (!result || !result.ok || !result.cache || !Array.isArray(result.cache.entries)) throw new Error(String((result && (result.reason || result.error)) || 'cache_status_failed'));
      state.entries = result.cache.entries;
      updateSummary(result.cache);
      renderList();
      setStatus('確認日時 ' + formatDate(result.cache.checkedAt), false);
    } catch (e) {
      state.entries = [];
      updateSummary(null);
      renderList();
      setStatus('キャッシュ状態を取得できませんでした。', true);
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。', 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function setClearing(busy) {
    state.clearing = !!busy;
    const button = byId('adminCacheClear');
    if (button) { button.disabled = !!busy; button.textContent = busy ? '消去中...' : '一時保存を消去'; }
    if (byId('adminCacheRefresh')) byId('adminCacheRefresh').disabled = !!busy;
  }

  async function clearCache() {
    if (state.clearing) return;
    if (!confirm('表示を速くする一時保存だけを消去します。スプレッドシートの元データは消えません。実行してよろしいですか？')) return;
    setClearing(true);
    setMessage('一時保存を消去しています...', 'info');
    try {
      const auth = authState();
      const result = await api('clearCache', { employeeId:auth.employeeId });
      if (!result || !result.ok || !result.cleared || !result.cleared.cleared) throw new Error(String((result && (result.reason || result.error)) || 'clear_failed'));
      setMessage('一時保存を消去しました。各画面の次回表示時に、最新データから自動で作り直されます。', 'success');
      setClearing(false);
      await loadCacheStatus();
    } catch (e) {
      setMessage('一時保存を消去できませんでした。時間をおいてもう一度お試しください。', 'error');
    } finally {
      setClearing(false);
    }
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminCacheRefresh').addEventListener('click', loadCacheStatus);
    byId('adminCacheClear').addEventListener('click', clearCache);
    loadCacheStatus();
  }

  return { VERSION, init, loadCacheStatus };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminCache.init);
