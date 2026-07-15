const RinchanDiagnostics = (() => {
  const VERSION = 'v1.4.13';

  function byId(id) { return document.getElementById(id); }
  function setText(id, text) { const el = byId(id); if (el) el.textContent = text; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
  function safeJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {} }
  function storageKeys() { try { const keys = []; for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (key && key.indexOf('rinchan') === 0) keys.push(key); } return keys.sort(); } catch (e) { return []; } }
  function isGenericScriptError(log) { const message = String((log && log.message) || '').trim(); const source = String((log && log.source) || '').trim(); const line = String((log && log.line) || '').trim(); const column = String((log && log.column) || '').trim(); const stack = String((log && log.stack) || '').trim(); return message === 'Script error.' && !source && !line && !column && !stack; }
  function errorLogs() { try { const logs = (window.RinchanErrorLog && typeof RinchanErrorLog.readLogs === 'function') ? RinchanErrorLog.readLogs() : safeJson('rinchanErrorLogs', []); return Array.isArray(logs) ? logs.filter(log => !isGenericScriptError(log)) : []; } catch (e) { return []; } }
  function status(ok, label, detail, level) { return { ok, label, detail, level: level || (ok ? 'ok' : 'error') }; }
  function queue() { const list = safeJson('rinchanPendingQueue', safeJson('rinchanOfflineQueue', [])); return Array.isArray(list) ? list : []; }
  function participant() {
    try {
      if (window.RinchanApi && typeof RinchanApi.authState === 'function') {
        return RinchanApi.authState().user || null;
      }
    } catch (e) {}
    return window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function' ? RinchanStorage.getParticipant() : safeJson('rinchanParticipant', null);
  }
  function isAdminUser(user) {
    if (window.RinchanApi && typeof RinchanApi.isAdminUser === 'function') return RinchanApi.isAdminUser(user);
    return !!(user && (String(user.admin || '') === '1' || user.admin === true || String(user.role || '').toLowerCase() === 'admin'));
  }
  function authState() {
    if (window.RinchanApi && typeof RinchanApi.authState === 'function') return RinchanApi.authState();
    const user = participant();
    const id = user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
    return { user, employeeId: id, loggedIn: !!id, isAdmin: isAdminUser(user) };
  }
  function employeeId() { const p = participant(); return p && (p.employeeId || p.id || p.participantId) ? String(p.employeeId || p.id || p.participantId) : ''; }
  async function api(action, payload) { if (window.RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {}); return { ok: false, error: 'api_not_ready' }; }

  function denyAndRedirect(message, url) {
    try {
      if (url === 'mypage.html') {
        sessionStorage.setItem('rinchanAdminAccessNotice', message);
      } else {
        alert(message);
      }
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

  function parseVersion(version) {
    const m = String(version || '').match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!m) return null;
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
  }

  function versionAtLeast(version, required) {
    const v = parseVersion(version);
    const r = parseVersion(required);
    if (!v || !r) return false;
    if (v.major !== r.major) return v.major > r.major;
    if (v.minor !== r.minor) return v.minor > r.minor;
    return v.patch >= r.patch;
  }

  function checks() {
    try {
      const p = participant();
      const activities = safeJson('rinchanActivities', []);
      const receivedThanks = safeJson('rinchanReceivedThanks', []);
      const sentThanks = safeJson('rinchanSentThanks', []);
      const pending = queue();
      const logs = errorLogs();
      const syncToken = localStorage.getItem('rinchanSyncToken') || '';
      const apiUrl = window.RINCHAN_CONFIG && window.RINCHAN_CONFIG.API_URL ? window.RINCHAN_CONFIG.API_URL : '';
      const flushing = localStorage.getItem('rinchanQueueFlushing') || '';
      return [
        status(!!window.RinchanStorage, 'core/storage.js', window.RinchanStorage ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanErrorLog, 'core/error-log.js', window.RinchanErrorLog ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanApi, 'core/api.js', window.RinchanApi ? '読み込み済み / ' + (window.RinchanApi.VERSION || '-') : '未読み込み'),
        status(!!window.RinchanSync, 'core/sync.js', window.RinchanSync ? '読み込み済み / ' + (window.RinchanSync.VERSION || '-') : '未読み込み'),
        status(!!window.RinchanOfflineQueue, 'core/offline-queue.js', window.RinchanOfflineQueue ? '読み込み済み / ' + (window.RinchanOfflineQueue.VERSION || '-') : '未読み込み'),
        status(!!apiUrl, 'API URL', apiUrl ? '設定あり' : '未設定', apiUrl ? 'ok' : 'warn'),
        status(!!p && !!(p.id || p.employeeId), 'ログイン情報', p ? '社員番号: ' + (p.employeeId || p.id || '-') : '未ログイン', p ? 'ok' : 'warn'),
        status(Array.isArray(activities), '歩数履歴キャッシュ', Array.isArray(activities) ? activities.length + '件' : '読み込み不可'),
        status(Array.isArray(receivedThanks), '受信ありがとうキャッシュ', Array.isArray(receivedThanks) ? receivedThanks.length + '件' : '読み込み不可'),
        status(Array.isArray(sentThanks), '送信ありがとうキャッシュ', Array.isArray(sentThanks) ? sentThanks.length + '件' : '読み込み不可'),
        status(Array.isArray(pending), '未送信キュー', Array.isArray(pending) ? pending.length + '件' : '読み込み不可', Array.isArray(pending) && pending.length ? 'warn' : 'ok'),
        status(true, '未送信ロック', flushing ? flushing : 'なし', flushing ? 'warn' : 'ok'),
        status(Array.isArray(logs), '端末エラーログ', Array.isArray(logs) ? logs.length + '件' : '読み込み不可', Array.isArray(logs) && logs.length ? 'warn' : 'ok'),
        status(true, 'syncToken', syncToken ? 'あり' : 'なし', syncToken ? 'ok' : 'warn'),
        status(navigator.onLine, 'オンライン状態', navigator.onLine ? 'オンライン' : 'オフライン', navigator.onLine ? 'ok' : 'warn')
      ];
    } catch (e) {
      return [status(false, '診断処理', e.message || '診断中にエラー', 'error')];
    }
  }

  function renderChecks(items) {
    const box = byId('diagnosticsList'); if (!box) return;
    box.innerHTML = items.map(item => { const icon = item.level === 'ok' ? '✅' : item.level === 'warn' ? '⚠️' : '❌'; return '<div class="admin-member-row diag-row diag-' + item.level + '"><div><strong>' + icon + ' ' + escapeHtml(item.label) + '</strong><small>' + escapeHtml(item.detail) + '</small></div></div>'; }).join('');
  }

  function itemLabel(item) {
    const p = item && item.payload ? item.payload : {};
    const parts = [];
    if (item && item.action) parts.push(String(item.action));
    if (p.date) parts.push('日付 ' + p.date);
    if (p.steps) parts.push(Number(p.steps || 0).toLocaleString('ja-JP') + '歩');
    if (p.reason) parts.push('理由 ' + p.reason);
    return parts.join(' / ') || '未送信データ';
  }

  function renderQueue() {
    const box = byId('diagnosticsQueue'); if (!box) return;
    const list = queue();
    if (!list.length) { box.innerHTML = '<p class="admin-empty">未送信キューはありません。</p>'; return; }
    box.innerHTML = '<div class="admin-note">再送しても残る場合は、下の内容を確認してください。</div>' +
      list.map((item, index) => {
        const p = item && item.payload ? item.payload : {};
        const detail = ['ID: ' + (item.id || '-'), 'key: ' + (item.key || '-'), 'reason: ' + (item.reason || '-'), 'retry: ' + Number(item.retryCount || 0), 'created: ' + (item.createdAt || '-'), 'last: ' + (item.lastTriedAt || '-')].join(' / ');
        const payload = JSON.stringify(p || {}).slice(0, 700);
        return '<div class="admin-member-row diag-row diag-warn"><div><strong>⚠️ #' + (index + 1) + ' ' + escapeHtml(itemLabel(item)) + '</strong><small>' + escapeHtml(detail) + '</small><small>' + escapeHtml(payload) + '</small></div></div>';
      }).join('');
  }

  function renderErrors() {
    const box = byId('diagnosticsErrors'); if (!box) return;
    const logs = errorLogs();
    if (!logs.length) { box.innerHTML = '<p class="admin-empty">この端末に保存されたエラーはありません。</p>'; return; }
    box.innerHTML = logs.map(log => { const at = log.at ? new Date(log.at).toLocaleString('ja-JP') : '-'; const locationText = [log.page || '', log.line ? 'L' + log.line : '', log.column ? 'C' + log.column : ''].filter(Boolean).join(' / '); return '<div class="admin-member-row diag-row diag-warn"><div><strong>⚠️ ' + escapeHtml(log.message || log.type || 'Error') + '</strong><small>' + escapeHtml(at + ' / ' + locationText) + '</small><small>' + escapeHtml((log.source || '') + (log.stack ? ' / ' + String(log.stack).slice(0, 220) : '')) + '</small></div></div>'; }).join('');
  }

  function renderDevice() {
    const box = byId('diagnosticsDevice'); if (!box) return;
    const keys = storageKeys();
    const p = participant();
    const deviceId = window.RinchanStorage && typeof RinchanStorage.deviceId === 'function' ? RinchanStorage.deviceId() : (localStorage.getItem('rinchanDeviceId') || '-');
    box.innerHTML = '<div class="info-grid"><span>端末ID</span><strong>' + escapeHtml(deviceId) + '</strong><span>社員番号</span><strong>' + escapeHtml(p ? (p.employeeId || p.id || '-') : '-') + '</strong><span>保存キー数</span><strong>' + keys.length + '</strong><span>ブラウザ</span><strong>' + escapeHtml(navigator.userAgent.slice(0, 80)) + '</strong></div><p class="admin-note">保存キー: ' + escapeHtml(keys.length ? keys.join(', ') : 'なし') + '</p>';
  }

  function renderServerIdle() {
    const box = byId('diagnosticsServer');
    if (!box) return;
    box.innerHTML = '<p class="admin-empty">Apps Script反映後に「サーバー確認」を押してください。</p>';
  }

  async function checkServer() {
    const box = byId('diagnosticsServer');
    if (!box) return;
    const id = employeeId();
    box.innerHTML = '<p class="admin-empty">サーバー確認中...</p>';
    if (!id) { box.innerHTML = '<div class="admin-member-row diag-row diag-warn"><div><strong>⚠️ ログイン情報なし</strong><small>社員番号が取得できません。</small></div></div>'; return; }
    try {
      const result = await api('getUserState', { employeeId: id, force: true, diagnostics: true });
      if (!result || !result.ok) {
        box.innerHTML = '<div class="admin-member-row diag-row diag-error"><div><strong>❌ getUserState失敗</strong><small>' + escapeHtml((result && (result.error || result.reason || result.message || result.msg)) || 'unknown_error') + '</small></div></div>';
        return;
      }
      const state = result.state || {};
      const reads = state.userReads || {};
      const readNewsIds = Array.isArray(state.readNewsIds) ? state.readNewsIds : (Array.isArray(reads.readNewsIds) ? reads.readNewsIds : []);
      const readThanksFlowerIds = Array.isArray(state.readThanksFlowerIds) ? state.readThanksFlowerIds : (Array.isArray(reads.readThanksFlowerIds) ? reads.readThanksFlowerIds : []);
      const version = result.version || state.version || '-';
      const expected = versionAtLeast(version, 'v1.4.8');
      const hasUserReads = !!state.userReads;
      const ok = expected && hasUserReads;
      box.innerHTML = '<div class="admin-member-row diag-row ' + (ok ? 'diag-ok' : 'diag-warn') + '"><div><strong>' + (ok ? '✅' : '⚠️') + ' Apps Script version: ' + escapeHtml(version) + '</strong><small>' + (ok ? 'v1.4.8以降が反映されています。' : 'user_reads応答またはApps Scriptバージョンを確認してください。') + '</small></div></div>' +
        '<div class="info-grid"><span>employeeId</span><strong>' + escapeHtml(state.employeeId || id) + '</strong><span>readNewsIds</span><strong>' + readNewsIds.length + '件</strong><span>readThanksFlowerIds</span><strong>' + readThanksFlowerIds.length + '件</strong><span>userReads</span><strong>' + (hasUserReads ? 'あり' : 'なし') + '</strong></div>';
    } catch (e) {
      box.innerHTML = '<div class="admin-member-row diag-row diag-error"><div><strong>❌ サーバー確認エラー</strong><small>' + escapeHtml(e.message || 'server_check_failed') + '</small></div></div>';
    }
  }

  function render() {
    try {
      if (window.RinchanErrorLog && typeof RinchanErrorLog.pruneGenericScriptErrors === 'function') RinchanErrorLog.pruneGenericScriptErrors();
      const items = checks();
      const ok = items.filter(item => item.level === 'ok').length;
      const warn = items.filter(item => item.level === 'warn').length;
      const error = items.filter(item => item.level === 'error').length;
      setText('diagOkCount', String(ok)); setText('diagWarnCount', String(warn)); setText('diagErrorCount', String(error)); setText('diagStorageCount', String(storageKeys().length)); setText('diagnosticsStatus', '最終診断: ' + new Date().toLocaleString('ja-JP'));
      renderChecks(items); renderQueue(); renderErrors(); renderDevice(); renderServerIdle();
    } catch (e) {
      setText('diagnosticsStatus', '表示できる範囲で診断中');
      const box = byId('diagnosticsList'); if (box) box.innerHTML = '<p class="admin-empty">診断画面の表示を保護しました。</p>';
    }
  }

  async function retryQueue() {
    if (window.RinchanOfflineQueue && typeof RinchanOfflineQueue.clearStaleLock === 'function') RinchanOfflineQueue.clearStaleLock();
    if (window.RinchanOfflineQueue && typeof RinchanOfflineQueue.flush === 'function') await RinchanOfflineQueue.flush();
    setTimeout(render, 500);
  }

  function clearQueue() {
    if (!confirm('未送信キューをこの端末から破棄しますか？\n\nすでに画面には保存済みのため、古い重複データや壊れた未送信だけを消す目的で使ってください。')) return;
    localStorage.removeItem('rinchanPendingQueue');
    localStorage.removeItem('rinchanOfflineQueue');
    localStorage.removeItem('rinchanQueueFlushing');
    writeJson('rinchanSyncStatus', { status: 'synced', message: '', at: new Date().toISOString() });
    try { if (window.RinchanOfflineQueue && typeof RinchanOfflineQueue.renderStatus === 'function') RinchanOfflineQueue.renderStatus(); } catch(e) {}
    render();
  }

  function clearErrors() {
    if (!confirm('この端末のエラーログを消去しますか？')) return;
    if (window.RinchanErrorLog && typeof RinchanErrorLog.clear === 'function') RinchanErrorLog.clear(); else localStorage.removeItem('rinchanErrorLogs');
    render();
  }

  function install() {
    try {
      if (!guardPageAccess()) return;
      render();
      const refresh = byId('diagnosticsRefresh'); if (refresh && !refresh.__rinchanDiagInstalled) { refresh.__rinchanDiagInstalled = true; refresh.addEventListener('click', render); }
      const server = byId('checkServer'); if (server && !server.__rinchanDiagInstalled) { server.__rinchanDiagInstalled = true; server.addEventListener('click', checkServer); }
      const retry = byId('retryQueue'); if (retry && !retry.__rinchanDiagInstalled) { retry.__rinchanDiagInstalled = true; retry.addEventListener('click', retryQueue); }
      const clearQueueButton = byId('clearQueue'); if (clearQueueButton && !clearQueueButton.__rinchanDiagInstalled) { clearQueueButton.__rinchanDiagInstalled = true; clearQueueButton.addEventListener('click', clearQueue); }
      const clear = byId('clearErrorLogs'); if (clear && !clear.__rinchanDiagInstalled) { clear.__rinchanDiagInstalled = true; clear.addEventListener('click', clearErrors); }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', install);
  return { VERSION, render, clearErrors, clearQueue, retryQueue, checkServer, versionAtLeast };
})();
window.RinchanDiagnostics = RinchanDiagnostics;