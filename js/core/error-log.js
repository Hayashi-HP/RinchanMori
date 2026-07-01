const RinchanErrorLog = (() => {
  const VERSION = 'v0.9.62';
  const KEY = 'rinchanErrorLogs';
  const LIMIT = 30;

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

  function add(entry) {
    const logs = readLogs();
    const item = Object.assign({
      at: new Date().toISOString(),
      page: location.pathname,
      url: location.href,
      userAgent: navigator.userAgent,
      employeeId: participantId(),
      version: VERSION
    }, entry || {});
    logs.unshift(item);
    writeLogs(logs);
    return item;
  }

  function clear() {
    localStorage.removeItem(KEY);
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
  }

  install();

  return {
    VERSION,
    add,
    clear,
    readLogs
  };
})();
