const RinchanErrorLog = (() => {
  const VERSION = 'v1.0.34';
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
    } catch (e) {}
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

  function isGenericBrowserScriptError(entry) {
    const message = String((entry && entry.message) || '').trim();
    const source = String((entry && entry.source) || '').trim();
    const line = String((entry && entry.line) || '').trim();
    const column = String((entry && entry.column) || '').trim();
    const stack = String((entry && entry.stack) || '').trim();
    return message === 'Script error.' && !source && !line && !column && !stack;
  }

  function add(entry) {
    if (isGenericBrowserScriptError(entry)) return null;
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

  function pruneGenericScriptErrors() {
    const logs = readLogs();
    const cleaned = logs.filter(log => !isGenericBrowserScriptError(log));
    if (cleaned.length !== logs.length) writeLogs(cleaned);
    return cleaned;
  }

  function unsentLogs() {
    return pruneGenericScriptErrors().filter(log => !log.sentAt);
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
      const all = pruneGenericScriptErrors();
      const byKey = new Map(pending.map(log => [String(log.at) + '|' + String(log.message), log]));
      const merged = all.map(log => byKey.get(String(log.at) + '|' + String(log.message)) || log);
      writeLogs(merged);
      return { ok: true, sent };
    } catch (e) {
      return { ok: false, reason: e.message || 'flush_failed', sent };
    } finally {
      flushing = false;
    }
  }

  function install() {
    pruneGenericScriptErrors();

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

  return { VERSION, add, clear, readLogs, unsentLogs, flush, pruneGenericScriptErrors };
})();
window.RinchanErrorLog = RinchanErrorLog;