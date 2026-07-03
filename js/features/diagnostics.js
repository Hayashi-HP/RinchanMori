const RinchanDiagnostics = (() => {
  const VERSION = 'v1.0.34';

  function byId(id) { return document.getElementById(id); }
  function setText(id, text) { const el = byId(id); if (el) el.textContent = text; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
  function safeJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function storageKeys() { try { const keys = []; for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (key && key.indexOf('rinchan') === 0) keys.push(key); } return keys.sort(); } catch (e) { return []; } }
  function isGenericScriptError(log) { const message = String((log && log.message) || '').trim(); const source = String((log && log.source) || '').trim(); const line = String((log && log.line) || '').trim(); const column = String((log && log.column) || '').trim(); const stack = String((log && log.stack) || '').trim(); return message === 'Script error.' && !source && !line && !column && !stack; }
  function errorLogs() { try { const logs = (window.RinchanErrorLog && typeof RinchanErrorLog.readLogs === 'function') ? RinchanErrorLog.readLogs() : safeJson('rinchanErrorLogs', []); return Array.isArray(logs) ? logs.filter(log => !isGenericScriptError(log)) : []; } catch (e) { return []; } }
  function status(ok, label, detail, level) { return { ok, label, detail, level: level || (ok ? 'ok' : 'error') }; }

  function checks() {
    try {
      const participant = window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function' ? RinchanStorage.getParticipant() : safeJson('rinchanParticipant', null);
      const activities = safeJson('rinchanActivities', []);
      const receivedThanks = safeJson('rinchanReceivedThanks', []);
      const sentThanks = safeJson('rinchanSentThanks', []);
      const queue = safeJson('rinchanOfflineQueue', safeJson('rinchanPendingQueue', []));
      const logs = errorLogs();
      const syncToken = localStorage.getItem('rinchanSyncToken') || '';
      const apiUrl = window.RINCHAN_CONFIG && window.RINCHAN_CONFIG.API_URL ? window.RINCHAN_CONFIG.API_URL : '';
      return [
        status(!!window.RinchanStorage, 'core/storage.js', window.RinchanStorage ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanErrorLog, 'core/error-log.js', window.RinchanErrorLog ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanApi, 'core/api.js', window.RinchanApi ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanSync, 'core/sync.js', window.RinchanSync ? '読み込み済み' : '未読み込み'),
        status(!!window.RinchanOfflineQueue, 'core/offline-queue.js', window.RinchanOfflineQueue ? '読み込み済み' : '未読み込み'),
        status(!!apiUrl, 'API URL', apiUrl ? '設定あり' : '未設定', apiUrl ? 'ok' : 'warn'),
        status(!!participant && !!(participant.id || participant.employeeId), 'ログイン情報', participant ? '社員番号: ' + (participant.employeeId || participant.id || '-') : '未ログイン', participant ? 'ok' : 'warn'),
        status(Array.isArray(activities), '歩数履歴キャッシュ', Array.isArray(activities) ? activities.length + '件' : '読み込み不可'),
        status(Array.isArray(receivedThanks), '受信ありがとうキャッシュ', Array.isArray(receivedThanks) ? receivedThanks.length + '件' : '読み込み不可'),
        status(Array.isArray(sentThanks), '送信ありがとうキャッシュ', Array.isArray(sentThanks) ? sentThanks.length + '件' : '読み込み不可'),
        status(Array.isArray(queue), '未送信キュー', Array.isArray(queue) ? queue.length + '件' : '読み込み不可', Array.isArray(queue) && queue.length ? 'warn' : 'ok'),
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

  function renderErrors() {
    const box = byId('diagnosticsErrors'); if (!box) return;
    const logs = errorLogs();
    if (!logs.length) { box.innerHTML = '<p class="admin-empty">この端末に保存されたエラーはありません。</p>'; return; }
    box.innerHTML = logs.map(log => { const at = log.at ? new Date(log.at).toLocaleString('ja-JP') : '-'; const locationText = [log.page || '', log.line ? 'L' + log.line : '', log.column ? 'C' + log.column : ''].filter(Boolean).join(' / '); return '<div class="admin-member-row diag-row diag-warn"><div><strong>⚠️ ' + escapeHtml(log.message || log.type || 'Error') + '</strong><small>' + escapeHtml(at + ' / ' + locationText) + '</small><small>' + escapeHtml((log.source || '') + (log.stack ? ' / ' + String(log.stack).slice(0, 220) : '')) + '</small></div></div>'; }).join('');
  }

  function renderDevice() {
    const box = byId('diagnosticsDevice'); if (!box) return;
    const keys = storageKeys();
    const participant = window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function' ? RinchanStorage.getParticipant() : safeJson('rinchanParticipant', null);
    const deviceId = window.RinchanStorage && typeof RinchanStorage.deviceId === 'function' ? RinchanStorage.deviceId() : (localStorage.getItem('rinchanDeviceId') || '-');
    box.innerHTML = '<div class="info-grid"><span>端末ID</span><strong>' + escapeHtml(deviceId) + '</strong><span>社員番号</span><strong>' + escapeHtml(participant ? (participant.employeeId || participant.id || '-') : '-') + '</strong><span>保存キー数</span><strong>' + keys.length + '</strong><span>ブラウザ</span><strong>' + escapeHtml(navigator.userAgent.slice(0, 80)) + '</strong></div><p class="admin-note">保存キー: ' + escapeHtml(keys.length ? keys.join(', ') : 'なし') + '</p>';
  }

  function render() {
    try {
      if (window.RinchanErrorLog && typeof RinchanErrorLog.pruneGenericScriptErrors === 'function') RinchanErrorLog.pruneGenericScriptErrors();
      const items = checks();
      const ok = items.filter(item => item.level === 'ok').length;
      const warn = items.filter(item => item.level === 'warn').length;
      const error = items.filter(item => item.level === 'error').length;
      setText('diagOkCount', String(ok)); setText('diagWarnCount', String(warn)); setText('diagErrorCount', String(error)); setText('diagStorageCount', String(storageKeys().length)); setText('diagnosticsStatus', '最終診断: ' + new Date().toLocaleString('ja-JP'));
      renderChecks(items); renderErrors(); renderDevice();
    } catch (e) {
      setText('diagnosticsStatus', '表示できる範囲で診断中');
      const box = byId('diagnosticsList'); if (box) box.innerHTML = '<p class="admin-empty">診断画面の表示を保護しました。</p>';
    }
  }

  function clearErrors() {
    if (!confirm('この端末のエラーログを消去しますか？')) return;
    if (window.RinchanErrorLog && typeof RinchanErrorLog.clear === 'function') RinchanErrorLog.clear(); else localStorage.removeItem('rinchanErrorLogs');
    render();
  }

  function install() {
    try {
      render();
      const refresh = byId('diagnosticsRefresh'); if (refresh && !refresh.__rinchanDiagInstalled) { refresh.__rinchanDiagInstalled = true; refresh.addEventListener('click', render); }
      const clear = byId('clearErrorLogs'); if (clear && !clear.__rinchanDiagInstalled) { clear.__rinchanDiagInstalled = true; clear.addEventListener('click', clearErrors); }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', install);
  return { VERSION, render, clearErrors };
})();
window.RinchanDiagnostics = RinchanDiagnostics;