const RinchanErrorLog = (() => {
  const VERSION = 'v0.9.63';
  const KEY = 'rinchanErrorLogs';
  const LIMIT = 30;
  let flushing = false;

  function readLogs() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLogs(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
    } catch (e) {
      // localStorageが使えない場合は何もしない
    }
  }

  function participantId() {
    try {
      const raw = localStorage.getItem('rinchanParticipant');
      const user = raw ? JSON.parse(raw) : null;
      return user ? String(user.employeeId || user.id || '') : '';
    } catch (e) {
      return '';
    }
  }

  function deviceId() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.deviceId === 'function') return RinchanStorage.deviceId();
      return localStorage.getItem('rinchanDeviceId') || '';
    } catch (e) {
      return '';
    }
  }

  function add(entry) {
    const logs = readLogs();
    const item = Object.assign({
      at: new Date().toISOString(),
      page: location.pathname,
      url: location.href,
      userAgent: navigator.userAgent,
      employeeId: participantId(),
      deviceId: deviceId(),
      version: VERSION,
      sentAt: ''
    }, entry || {});
    logs.unshift(item);
    writeLogs(logs);
    setTimeout(flush, 500);
    return item;
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function unsentLogs() {
    return readLogs().filter(log => !log.sentAt);
  }

  async function sendOne(log) {
    if (!window.RinchanApi || typeof RinchanApi.request !== 'function') return false;
    const result = await RinchanApi.request('saveErrorLog', {
      employeeId: log.employeeId || participantId(),
      deviceId: log.deviceId || deviceId(),
      clientVersion: VERSION,
      log
    });
    return !!(result && result.ok);
  }

  async function flush() {
    if (flushing) return { ok: false, reason: 'already_flushing' };
    if (!navigator.onLine) return { ok: false, reason: 'offline' };
    const pending = unsentLogs();
    if (!pending.length) return { ok: true, sent: 0 };

    flushing = true;
    let sent = 0;
    try {
      for (const log of pending.slice().reverse()) {
        const ok = await sendOne(log);
        if (!ok) break;
        log.sentAt = new Date().toISOString();
        sent += 1;
      }
      const all = readLogs();
      const byKey = new Map(pending.map(log => [String(log.at) + '|' + String(log.message), log]));
      const merged = all.map(log => {
        const updated = byKey.get(String(log.at) + '|' + String(log.message));
        return updated || log;
      });
      writeLogs(merged);
      return { ok: true, sent };
    } catch (e) {
      return { ok: false, reason: e.message || 'flush_failed', sent };
    } finally {
      flushing = false;
    }
  }

  function install() {
    window.addEventListener('error', event => {
      add({
        type: 'error',
        message: event.message || 'JavaScript error',
        source: event.filename || '',
        line: event.lineno || '',
        column: event.colno || '',
        stack: event.error && event.error.stack ? String(event.error.stack).slice(0, 1200) : ''
      });
    });

    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      add({
        type: 'unhandledrejection',
        message: reason && reason.message ? reason.message : String(reason || 'Unhandled promise rejection'),
        stack: reason && reason.stack ? String(reason.stack).slice(0, 1200) : ''
      });
    });

    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) flush();
    });
    setTimeout(flush, 1500);
  }

  install();

  return {
    VERSION,
    add,
    clear,
    readLogs,
    unsentLogs,
    flush
  };
})();
