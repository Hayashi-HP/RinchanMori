const RinchanOfflineQueue = (() => {
  const VERSION = 'v1.4.6';
  const QUEUE_KEY = 'rinchanPendingQueue';
  const FLUSHING_KEY = 'rinchanQueueFlushing';
  const RETRY_ACTIONS = ['saveActivity', 'deleteActivity', 'saveThanks', 'saveUser', 'markNewsRead'];
  const LOCK_LIMIT_MS = 30000;

  function readJson(key, fallback) {
    if (window.RinchanStorage) return RinchanStorage.readJson(key, fallback);
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    if (window.RinchanStorage) return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    return readJson('rinchanParticipant', null) || {};
  }

  function currentEmployeeId() {
    const p = participant() || {};
    return String(p.employeeId || p.id || p.participantId || '').trim();
  }

  function queue() {
    const list = readJson(QUEUE_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveQueue(list) {
    writeJson(QUEUE_KEY, Array.isArray(list) ? list : []);
    renderStatus();
  }

  function actionKey(action, payload, fallbackId) {
    const id = payload && (payload.activityId || payload.thanksId || payload.employeeId || payload.id || payload.participantId || payload.newsId);
    return action + ':' + String(id || fallbackId || Date.now());
  }

  function repairPayload(action, payload) {
    const p = Object.assign({}, payload || {});
    if (String(action) === 'saveActivity' || String(action) === 'deleteActivity') {
      const eid = String(p.employeeId || p.participantId || p.id || currentEmployeeId() || '').trim();
      if (eid) {
        p.employeeId = eid;
        p.participantId = eid;
        p.id = eid;
      }
      if (p.steps != null) p.steps = Number(p.steps || 0);
      if (p.date) p.date = String(p.date).slice(0, 10);
    }
    return p;
  }

  function repairItem(item) {
    if (!item || !item.action) return item;
    const payload = repairPayload(item.action, item.payload || {});
    return Object.assign({}, item, { payload, key: actionKey(item.action, payload, item.id || item.key) });
  }

  function reasonOf(value, fallback) {
    if (!value) return fallback || 'send_failed';
    if (typeof value === 'string') return value;
    return String(value.reason || value.error || value.message || value.msg || fallback || 'send_failed');
  }

  function normalizeResult(result, fallback) {
    if (!result || typeof result !== 'object') {
      const reason = fallback || 'empty_response';
      return { ok: false, reason, error: reason, msg: reason, raw: result || null };
    }
    if (result.ok === true) {
      if (!result.msg && result.message) result.msg = result.message;
      if (!result.message && result.msg) result.message = result.msg;
      return result;
    }
    const reason = reasonOf(result, fallback || 'send_failed');
    return Object.assign({}, result, {
      ok: false,
      reason,
      error: result.error || reason,
      msg: result.msg || result.message || reason,
      message: result.message || result.msg || reason
    });
  }

  function lockAgeMs(raw) {
    if (!raw) return 0;
    if (raw === '1') return LOCK_LIMIT_MS + 1;
    const t = Date.parse(raw);
    if (isNaN(t)) return LOCK_LIMIT_MS + 1;
    return Date.now() - t;
  }

  function isLocked() {
    const raw = localStorage.getItem(FLUSHING_KEY);
    if (!raw) return false;
    if (lockAgeMs(raw) > LOCK_LIMIT_MS) {
      localStorage.removeItem(FLUSHING_KEY);
      return false;
    }
    return true;
  }

  function setLock() {
    localStorage.setItem(FLUSHING_KEY, new Date().toISOString());
  }

  function clearLock() {
    localStorage.removeItem(FLUSHING_KEY);
  }

  function clearStaleLock() {
    if (localStorage.getItem(FLUSHING_KEY) && !isLocked()) renderStatus();
  }

  function enqueue(action, payload, reason) {
    if (!action || !RETRY_ACTIONS.includes(String(action))) return null;
    const current = queue();
    const fixedPayload = repairPayload(action, payload || {});
    const item = {
      id: 'Q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      action: String(action),
      payload: fixedPayload,
      reason: reason || 'offline',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      lastTriedAt: ''
    };
    item.key = actionKey(item.action, item.payload, item.id);

    const exists = current.some(old => old && old.key === item.key);
    if (!exists) current.push(item);
    saveQueue(current.slice(-50));
    setSyncStatus('error', '通信できないため未送信として保存しました。');
    return item;
  }

  function online() {
    return navigator.onLine !== false;
  }

  function setSyncStatus(status, message) {
    if (window.RinchanSync && typeof RinchanSync.setStatus === 'function') {
      RinchanSync.setStatus(status, message || '');
      return;
    }
    writeJson('rinchanSyncStatus', { status, message: message || '', at: new Date().toISOString() });
  }

  async function request(action, payload) {
    try {
      const fixedPayload = repairPayload(action, payload || {});
      if (window.RinchanApi && typeof RinchanApi.request === 'function') return normalizeResult(await RinchanApi.request(action, fixedPayload), 'send_failed');
      if (typeof v051Api === 'function') return normalizeResult(await v051Api(action, fixedPayload), 'send_failed');
      if (typeof rinchanApi === 'function') return normalizeResult(await rinchanApi(action, fixedPayload), 'send_failed');
    } catch (e) {
      return normalizeResult(null, e && e.message ? e.message : 'send_failed');
    }
    return normalizeResult(null, 'api_not_ready');
  }

  function applyResult(result) {
    const safe = normalizeResult(result, 'send_failed');
    if (!safe.ok) return safe;
    try {
      if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(safe) || safe;
      if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(safe) || safe;
    } catch (e) {
      return normalizeResult(null, e && e.message ? e.message : 'apply_failed');
    }
    return safe;
  }

  async function flush(options) {
    const silent = options && options.silent === true;
    if (isLocked()) {
      renderStatus();
      return;
    }
    if (!online()) {
      setSyncStatus('error', 'オフラインのため未送信があります。');
      return;
    }

    let current = queue().map(repairItem).filter(Boolean);
    saveQueue(current);
    if (!current.length) {
      clearLock();
      renderStatus();
      return;
    }

    setLock();
    if (!silent) setSyncStatus('syncing', '未送信データを送信中...');

    const remaining = [];
    try {
      for (const rawItem of current) {
        const item = repairItem(rawItem);
        if (!item || !item.action) continue;
        const next = Object.assign({}, item, { retryCount: Number(item.retryCount || 0) + 1, lastTriedAt: new Date().toISOString() });
        try {
          const result = normalizeResult(await request(item.action, item.payload || {}), 'send_failed');
          if (result.ok) applyResult(result);
          else { next.reason = reasonOf(result, 'send_failed'); remaining.push(next); }
        } catch (e) {
          next.reason = e && e.message ? e.message : 'send_failed';
          remaining.push(next);
        }
      }

      saveQueue(remaining.slice(-50));
      if (!remaining.length) {
        setSyncStatus('synced', '');
        try { if (window.RinchanSync && typeof RinchanSync.sync === 'function') RinchanSync.sync({ silent: true }); } catch(e) {}
      } else {
        setSyncStatus('error', '未送信データがあります。');
      }
    } finally {
      clearLock();
      renderStatus();
    }
  }

  function patchApi(name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__rinchanCoreQueuePatched) return;
    const patched = async function(action, payload) {
      try {
        const fixedPayload = repairPayload(action, payload || {});
        const result = normalizeResult(await original.call(this, action, fixedPayload), 'api_failed');
        if (result.ok === false && RETRY_ACTIONS.includes(String(action))) enqueue(action, fixedPayload, reasonOf(result, 'api_failed'));
        return result;
      } catch (e) {
        const result = normalizeResult(null, e && e.message ? e.message : 'api_failed');
        if (RETRY_ACTIONS.includes(String(action))) enqueue(action, repairPayload(action, payload || {}), reasonOf(result, 'api_failed'));
        return result;
      }
    };
    patched.__rinchanCoreQueuePatched = true;
    patched.__original = original;
    window[name] = patched;
  }

  function patchApis() {
    patchApi('v051Api');
    patchApi('rinchanApi');
  }

  function clearQueue() {
    saveQueue([]);
    clearLock();
    setSyncStatus('synced', '');
  }

  function renderStatus() {
    const page = document.querySelector('.app');
    if (!page) return;
    const count = queue().length;
    let box = document.getElementById('rinchanQueueStatus');
    if (!count) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.id = 'rinchanQueueStatus';
      box.className = 'rinchan-queue-status';
      const sync = document.getElementById('rinchanSyncStatus');
      const nav = page.querySelector('.nav');
      if (sync && sync.parentNode) sync.parentNode.insertBefore(box, sync.nextSibling);
      else if (nav) page.insertBefore(box, nav);
      else page.appendChild(box);
    }
    box.innerHTML = '<span>未送信 ' + count + '件</span><button type="button" onclick="RinchanOfflineQueue.flush()">再送</button>';
  }

  function install() {
    clearStaleLock();
    patchApis();
    renderStatus();
    setTimeout(() => flush({ silent: true }), 600);
    window.addEventListener('online', () => flush({ silent: true }));
    window.addEventListener('focus', () => flush({ silent: true }));
  }

  document.addEventListener('DOMContentLoaded', install);
  setTimeout(clearStaleLock, 200);
  setTimeout(patchApis, 500);
  setTimeout(patchApis, 1500);

  return { VERSION, queue, enqueue, flush, renderStatus, patchApis, normalizeResult, clearQueue, clearStaleLock, repairPayload };
})();
window.RinchanOfflineQueue = RinchanOfflineQueue;