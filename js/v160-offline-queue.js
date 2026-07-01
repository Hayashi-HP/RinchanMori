const RINCHAN_V160_QUEUE = 'v0.9.60';
const RINCHAN_PENDING_QUEUE_KEY = 'rinchanPendingQueue';
const RINCHAN_QUEUE_FLUSHING_KEY = 'rinchanQueueFlushing';

function v160ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function v160SaveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function v160Queue() {
  return v160ReadJson(RINCHAN_PENDING_QUEUE_KEY, []);
}

function v160SaveQueue(queue) {
  v160SaveJson(RINCHAN_PENDING_QUEUE_KEY, Array.isArray(queue) ? queue : []);
  v160RenderQueueStatus();
}

function queuePending(action, payload, reason) {
  if (!action) return;
  const queue = v160Queue();
  const item = {
    id: 'Q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    action,
    payload: payload || {},
    reason: reason || 'offline',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    lastTriedAt: ''
  };

  const key = action + ':' + String((payload && (payload.activityId || payload.thanksId || payload.employeeId || payload.id)) || item.id);
  const exists = queue.some(old => old.key === key);
  item.key = key;
  if (!exists) queue.push(item);
  v160SaveQueue(queue.slice(-50));
}

function v160Online() {
  return navigator.onLine !== false;
}

function v160SetStatus(status, message) {
  try {
    if (typeof v135SetSyncStatus === 'function') v135SetSyncStatus(status, message || '');
    else localStorage.setItem('rinchanSyncStatus', JSON.stringify({ status, message: message || '', at: new Date().toISOString() }));
  } catch (e) {}
}

async function v160CallApi(action, payload) {
  if (typeof v051Api === 'function') return v051Api(action, payload || {});
  if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
  return { ok: false, reason: 'api_not_ready' };
}

async function flushPendingQueue(options) {
  const silent = options && options.silent === true;
  if (localStorage.getItem(RINCHAN_QUEUE_FLUSHING_KEY) === '1') return;
  if (!v160Online()) {
    v160SetStatus('error', 'オフラインのため未送信があります。');
    return;
  }

  let queue = v160Queue();
  if (!queue.length) {
    v160RenderQueueStatus();
    return;
  }

  localStorage.setItem(RINCHAN_QUEUE_FLUSHING_KEY, '1');
  if (!silent) v160SetStatus('syncing', '未送信データを送信中...');

  const remaining = [];
  try {
    for (const item of queue) {
      const next = Object.assign({}, item, { lastTriedAt: new Date().toISOString(), retryCount: Number(item.retryCount || 0) + 1 });
      try {
        const result = await v160CallApi(item.action, item.payload || {});
        if (!result || !result.ok) {
          next.reason = (result && (result.reason || result.error)) || 'send_failed';
          remaining.push(next);
        }
      } catch (e) {
        next.reason = e.message || 'send_failed';
        remaining.push(next);
      }
    }

    v160SaveQueue(remaining.slice(-50));
    if (!remaining.length) {
      v160SetStatus('synced', '');
      if (typeof v135SyncUserState === 'function') v135SyncUserState({ silent: true });
    } else {
      v160SetStatus('error', '未送信データがあります。');
    }
  } finally {
    localStorage.removeItem(RINCHAN_QUEUE_FLUSHING_KEY);
    v160RenderQueueStatus();
  }
}

function v160PatchApiFunction(name) {
  const original = window[name];
  if (typeof original !== 'function' || original.__rinchanQueuePatched) return;

  const patched = async function(action, payload) {
    const result = await original.apply(this, arguments);
    if (result && result.ok === false && action && ['saveActivity', 'deleteActivity', 'saveThanks', 'saveUser', 'markNewsRead'].includes(String(action))) {
      queuePending(action, payload || {}, result.reason || result.error || 'api_failed');
      v160SetStatus('error', '通信できないため未送信として保存しました。');
    }
    return result;
  };
  patched.__rinchanQueuePatched = true;
  patched.__original = original;
  window[name] = patched;
}

function v160PatchApis() {
  v160PatchApiFunction('v051Api');
  v160PatchApiFunction('rinchanApi');
}

function v160RenderQueueStatus() {
  const page = document.querySelector('.app');
  if (!page) return;
  const count = v160Queue().length;
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
  box.innerHTML = '<span>未送信 ' + count + '件</span><button type="button" onclick="flushPendingQueue()">再送</button>';
}

function v160Install() {
  v160PatchApis();
  v160RenderQueueStatus();
  setTimeout(() => flushPendingQueue({ silent: true }), 600);
  window.addEventListener('online', () => flushPendingQueue({ silent: true }));
  window.addEventListener('focus', () => flushPendingQueue({ silent: true }));
}

document.addEventListener('DOMContentLoaded', v160Install);
setTimeout(v160PatchApis, 500);
setTimeout(v160PatchApis, 1500);
