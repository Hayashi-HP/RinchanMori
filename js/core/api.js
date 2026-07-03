const RinchanApi = (() => {
  const VERSION = 'v1.0.18';

  function apiUrl() {
    return (typeof RINCHAN_CONFIG !== 'undefined' && RINCHAN_CONFIG.API_URL)
      ? String(RINCHAN_CONFIG.API_URL).trim()
      : '';
  }

  function deviceId() {
    if (window.RinchanStorage && typeof RinchanStorage.deviceId === 'function') {
      return RinchanStorage.deviceId();
    }
    let id = localStorage.getItem('rinchanDeviceId');
    if (!id) {
      id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('rinchanDeviceId', id);
    }
    return id;
  }

  async function request(action, payload) {
    const url = apiUrl();
    if (!url) return { ok: false, reason: 'api_url_empty' };

    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({
          action,
          deviceId: deviceId(),
          appVersion: VERSION
        }, payload || {}))
      });
      const json = await res.json();
      return json && json.ok ? json : { ok: false, reason: (json && (json.error || json.reason)) || 'api_error', raw: json };
    } catch (e) {
      return { ok: false, reason: e.message || 'network_error' };
    }
  }

  return {
    VERSION,
    request,
    apiUrl
  };
})();

window.RinchanApi = RinchanApi;
