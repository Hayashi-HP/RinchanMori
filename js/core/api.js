const RinchanApi = (() => {
  const VERSION = 'v1.4.4';

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

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') {
        return RinchanStorage.getParticipant();
      }
      const raw = localStorage.getItem('rinchanParticipant');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isAdminUser(user) {
    return !!(user && (
      String(user.admin || '') === '1' ||
      user.admin === true ||
      String(user.role || '').toLowerCase() === 'admin'
    ));
  }

  function authState() {
    const user = participant();
    const employeeId = user && (user.employeeId || user.id || user.participantId)
      ? String(user.employeeId || user.id || user.participantId)
      : '';
    return {
      user,
      employeeId,
      loggedIn: !!employeeId,
      isAdmin: isAdminUser(user)
    };
  }

  function normalizeError(value, fallback) {
    if (!value) return fallback || 'api_error';
    if (typeof value === 'string') return value;
    return String(value.error || value.reason || value.message || value.msg || fallback || 'api_error');
  }

  function normalizeResponse(json, fallbackReason) {
    if (!json || typeof json !== 'object') {
      return { ok: false, reason: fallbackReason || 'empty_response', error: fallbackReason || 'empty_response', msg: fallbackReason || 'empty_response', raw: json || null };
    }
    if (json.ok === true) {
      if (!json.msg && json.message) json.msg = json.message;
      if (!json.message && json.msg) json.message = json.msg;
      return json;
    }
    const reason = normalizeError(json, fallbackReason || 'api_error');
    return Object.assign({}, json, {
      ok: false,
      reason,
      error: json.error || reason,
      msg: json.msg || json.message || reason,
      message: json.message || json.msg || reason,
      raw: json
    });
  }

  async function request(action, payload) {
    const url = apiUrl();
    if (!url) return normalizeResponse(null, 'api_url_empty');

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

      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        return normalizeResponse(null, res && res.ok ? 'invalid_json_response' : 'network_response_error');
      }

      return normalizeResponse(json, res && res.ok ? 'api_error' : 'network_response_error');
    } catch (e) {
      const reason = e && (e.message || e.name) ? String(e.message || e.name) : 'network_error';
      return normalizeResponse(null, reason || 'network_error');
    }
  }

  return {
    VERSION,
    request,
    apiUrl,
    normalizeResponse,
    participant,
    isAdminUser,
    authState
  };
})();

window.RinchanApi = RinchanApi;