const RinchanDiagnostics = (() => {
  const VERSION = 'v0.9.62';

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const el = byId(id);
    if (el) el.textContent = text;
  }

  function safeJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function storageKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf('rinchan') === 0) keys.push(key);
    }
    return keys.sort();
  }

  function status(ok, label, detail, level) {
    return { ok, label, detail, level: level || (ok ? 'ok' : 'error') };
  }

  function checks() {
    const participant = window.RinchanStorage ? RinchanStorage.getParticipant() : safeJson('rinchanParticipant', null);
    const activities = safeJson('rinchanActivities', []);
    const receivedThanks = safeJson('rinchanReceivedThanks', []);
    const sentThanks = safeJson('rinchanSentThanks', []);
    const queue = safeJson('rinchanOfflineQueue', []);
    const syncToken = localStorage.getItem('rinchanSyncToken') || '';
    const apiUrl = window.RINCHAN_CONFIG && window.RINCHAN_CONFIG.API_URL ? window.RINCHAN_CONFIG.API_URL : '';

    return [
      status(!!window.RinchanStorage, 'core/storage.js', window.RinchanStorage ? '読み込み済み' : '未読み込み'),
      status(!!window.RinchanApi, 'core/api.js', window.RinchanApi ? '読み込み済み' : '未読み込み'),
      status(!!window.RinchanSync, 'core/sync.js', window.RinchanSync ? '読み込み済み' : '未読み込み'),
      status(!!window.RinchanOfflineQueue, 'core/offline-queue.js', window.RinchanOfflineQueue ? '読み込み済み' : '未読み込み'),
      status(!!apiUrl, 'API URL', apiUrl ? '設定あり' : '未設定', apiUrl ? 'ok' : 'warn'),
      status(!!participant && !!(participant.id || participant.employeeId), 'ログイン情報', participant ? '社員番号: ' + (participant.employeeId || participant.id || '-') : '未ログイン', participant ? 'ok' : 'warn'),
      status(Array.isArray(activities), '歩数履歴キャッシュ', Array.isArray(activities) ? activities.length + '件' : '読み込み不可'),
      status(Array.isArray(receivedThanks), '受信ありがとうキャッシュ', Array.isArray(receivedThanks) ? receivedThanks.length + '件' : '読み込み不可'),
      status(Array.isArray(sentThanks), '送信ありがとうキャッシュ', Array.isArray(sentThanks) ? sentThanks.length + '件' : '読み込み不可'),
      status(Array.isArray(queue), '未送信キュー', Array.isArray(queue) ? queue.length + '件' : '読み込み不可', Array.isArray(queue) && queue.length ? 'warn' : 'ok'),
      status(true, 'syncToken', syncToken ? 'あり' : 'なし', syncToken ? 'ok' : 'warn'),
      status(navigator.onLine, 'オンライン状態', navigator.onLine ? 'オンライン' : 'オフライン', navigator.onLine ? 'ok' : 'warn')
    ];
  }

  function renderChecks(items) {
    const box = byId('diagnosticsList');
    if (!box) return;
    box.innerHTML = items.map(item => {
      const icon = item.level === 'ok' ? '✅' : item.level === 'warn' ? '⚠️' : '❌';
      return '<div class="admin-member-row diag-row diag-' + item.level + '"><div><strong>' + icon + ' ' + item.label + '</strong><small>' + item.detail + '</small></div></div>';
    }).join('');
  }

  function renderDevice() {
    const box = byId('diagnosticsDevice');
    if (!box) return;
    const keys = storageKeys();
    const participant = window.RinchanStorage ? RinchanStorage.getParticipant() : safeJson('rinchanParticipant', null);
    const deviceId = window.RinchanStorage && typeof RinchanStorage.deviceId === 'function' ? RinchanStorage.deviceId() : (localStorage.getItem('rinchanDeviceId') || '-');
    box.innerHTML = '<div class="info-grid"><span>端末ID</span><strong>' + deviceId + '</strong><span>社員番号</span><strong>' + (participant ? (participant.employeeId || participant.id || '-') : '-') + '</strong><span>保存キー数</span><strong>' + keys.length + '</strong><span>ブラウザ</span><strong>' + navigator.userAgent.slice(0, 80) + '</strong></div><p class="admin-note">保存キー: ' + (keys.length ? keys.join(', ') : 'なし') + '</p>';
  }

  function render() {
    const items = checks();
    const ok = items.filter(item => item.level === 'ok').length;
    const warn = items.filter(item => item.level === 'warn').length;
    const error = items.filter(item => item.level === 'error').length;
    setText('diagOkCount', String(ok));
    setText('diagWarnCount', String(warn));
    setText('diagErrorCount', String(error));
    setText('diagStorageCount', String(storageKeys().length));
    setText('diagnosticsStatus', '最終診断: ' + new Date().toLocaleString('ja-JP'));
    renderChecks(items);
    renderDevice();
  }

  function install() {
    render();
    const refresh = byId('diagnosticsRefresh');
    if (refresh) refresh.addEventListener('click', render);
  }

  document.addEventListener('DOMContentLoaded', install);

  return { VERSION, render };
})();
