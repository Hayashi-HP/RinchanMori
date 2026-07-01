const RinchanOfflineQueue = (() => {
  const VERSION = 'v0.9.61';
  const QUEUE_KEY = 'rinchanPendingQueue';
  const FLUSHING_KEY = 'rinchanQueueFlushing';
  const RETRY_ACTIONS = ['saveActivity', 'deleteActivity', 'saveThanks', 'saveUser', 'markNewsRead'];

  function readJson(key, fallback) {
    if (window.RinchanStorage) return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (window.RinchanStorage) return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function queue() {
    return readJson(QUEUE_KEY, []);
  }

  function saveQueue(list) {
    writeJson(QUEUE_KEY, Array.isArray(list) ? list : []);
    renderStatus();
  }

  function actionKey(action, payload, fallbackId) {
    const id = payload && (payload.activityId || payload.thanksId || payload.employeeId || payload.id || payload.newsId);
    return action + ':' + String(id || fallbackId || Date.now());
  }

  function enqueue(action, payload, reason) {
    if (!action || !RETRY_ACTIONS.includes(String(action))) return null;
    const current = queue();
    const item = {
      id: 'Q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      action: String(action),
      payload: payload || {},
      reason: reason || 'offline',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      lastTriedAt: ''
    };
    item.key = actionKey(item.action, item.payload, item.id);

    const exists = current.some(old => old.key === item.key);
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
    if (typeof v135SetSyncStatus === 'function') {
      v135SetSyncStatus(status, message || '');
      return;
    }
    writeJson('rinchanSyncStatus', { status, message: message || '', at: new Date().toISOString() });
  }

  async function request(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyResult(result) {
    if (!result || !result.ok) return result;
    if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') {
      return RinchanSync.applyApiResult(result);
    }
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  async function flush(options) {
    const silent = options && options.silent === true;
    if (localStorage.getItem(FLUSHING_KEY) === '1') return;
    if (!online()) {
      setSyncStatus('error', 'オフラインのため未送信があります。');
      return;
    }

    let current = queue();
    if (!current.length) {
      renderStatus();
      return;
    }

    localStorage.setItem(FLUSHING_KEY, '1');
    if (!silent) setSyncStatus('syncing', '未送信データを送信中...');

    const remaining = [];
    try {
      for (const item of current) {
        const next = Object.assign({}, item, {
          retryCount: Number(item.retryCount || 0) + 1,
          lastTriedAt: new Date().toISOString()
        });

        try {
          const result = await request(item.action, item.payload || {});
          if (result && result.ok) {
            applyResult(result);
          } else {
            next.reason = (result && (result.reason || result.error)) || 'send_failed';
            remaining.push(next);
          }
        } catch (e) {
          next.reason = e.message || 'send_failed';
          remaining.push(next);
        }
      }

      saveQueue(remaining.slice(-50));
      if (!remaining.length) {
        setSyncStatus('synced', '');
        if (window.RinchanSync && typeof RinchanSync.sync === 'function') RinchanSync.sync({ silent: true });
        else if (typeof v135SyncUserState === 'function') v135SyncUserState({ silent: true });
      } else {
        setSyncStatus('error', '未送信データがあります。');
      }
    } finally {
      localStorage.removeItem(FLUSHING_KEY);
      renderStatus();
    }
  }

  function patchApi(name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__rinchanCoreQueuePatched) return;

    const patched = async function(action, payload) {
      const result = await original.apply(this, arguments);
      if (result && result.ok === false && RETRY_ACTIONS.includes(String(action))) {
        enqueue(action, payload || {}, result.reason || result.error || 'api_failed');
      }
      return result;
    };
    patched.__rinchanCoreQueuePatched = true;
    patched.__original = original;
    window[name] = patched;
  }

  function patchApis() {
    patchApi('v051Api');
    patchApi('rinchanApi');
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
    patchApis();
    renderStatus();
    setTimeout(() => flush({ silent: true }), 600);
    window.addEventListener('online', () => flush({ silent: true }));
    window.addEventListener('focus', () => flush({ silent: true }));
  }

  document.addEventListener('DOMContentLoaded', install);
  setTimeout(patchApis, 500);
  setTimeout(patchApis, 1500);

  return {
    VERSION,
    queue,
    enqueue,
    flush,
    renderStatus,
    patchApis
  };
})();
