const RinchanSync = (() => {
  const VERSION = 'v0.9.61';
  const SYNC_TIME_KEY = 'rinchanLastSyncedAt';
  const SYNC_STATUS_KEY = 'rinchanSyncStatus';
  const SYNC_TOKEN_KEY = 'rinchanSyncToken';

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

  function participant() {
    if (window.RinchanStorage) return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function employeeId() {
    if (window.RinchanStorage) return RinchanStorage.employeeId();
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  function syncToken() {
    return String(localStorage.getItem(SYNC_TOKEN_KEY) || '').trim();
  }

  function saveSyncToken(token) {
    if (token) localStorage.setItem(SYNC_TOKEN_KEY, String(token));
  }

  function normalizeActivities(list) {
    return (Array.isArray(list) ? list : [])
      .map(item => ({
        activityId: String(item.activityId || ''),
        participantId: String(item.participantId || item.id || ''),
        deviceId: String(item.deviceId || ''),
        date: String(item.date || '').slice(0, 10),
        steps: Number(item.steps || 0),
        challenge: item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE',
        comment: String(item.comment || ''),
        createdAt: String(item.createdAt || item.date || ''),
        version: String(item.version || VERSION),
        savedAt: String(item.savedAt || '')
      }))
      .filter(item => item.activityId || item.date || item.steps > 0);
  }

  function normalizeThanks(list) {
    return (Array.isArray(list) ? list : []).map(item => Object.assign({}, item, {
      thanksId: String(item.thanksId || item.id || ''),
      createdAt: String(item.createdAt || ''),
      reason: String(item.reason || 'ありがとう')
    }));
  }

  function applyState(state) {
    if (!state) return false;
    if (state.syncToken) saveSyncToken(state.syncToken);
    if (state.unchanged === true) return false;

    if (state.user) {
      const current = participant() || {};
      writeJson('rinchanParticipant', Object.assign({}, current, state.user));
    }
    if (Array.isArray(state.activities)) writeJson('rinchanActivities', normalizeActivities(state.activities));
    if (Array.isArray(state.receivedThanks)) writeJson('rinchanReceivedThanks', normalizeThanks(state.receivedThanks));
    if (Array.isArray(state.sentThanks)) writeJson('rinchanSentThanks', normalizeThanks(state.sentThanks));
    if (Array.isArray(state.thanksTimeline)) writeJson('rinchanGoodTimeline', state.thanksTimeline);
    if (Array.isArray(state.readNewsIds)) writeJson('rinchanReadNewsIds', state.readNewsIds);
    if (state.thanksStats) writeJson('rinchanThanksStats', state.thanksStats);
    return true;
  }

  function setStatus(status, message) {
    const now = new Date().toISOString();
    writeJson(SYNC_STATUS_KEY, { status, message: message || '', at: now });
    if (status === 'synced') localStorage.setItem(SYNC_TIME_KEY, now);
    renderStatus();
  }

  function formatSyncTime(value) {
    if (!value) return '未同期';
    const date = new Date(value);
    if (isNaN(date)) return '未同期';
    return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function renderStatus() {
    const page = document.querySelector('.app');
    if (!page) return;

    let box = document.getElementById('rinchanSyncStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'rinchanSyncStatus';
      box.className = 'rinchan-sync-status';
      const nav = page.querySelector('.nav');
      if (nav) page.insertBefore(box, nav);
      else page.appendChild(box);
    }

    const status = readJson(SYNC_STATUS_KEY, null);
    const lastSync = localStorage.getItem(SYNC_TIME_KEY);
    const label = status && status.status === 'syncing' ? '同期中...' : '最終同期 ' + formatSyncTime(lastSync);
    const detail = status && status.status === 'error' ? '通信できませんでした。保存済みデータを表示中です。' : '';
    box.innerHTML = '<span>' + label + '</span>' + (detail ? '<small>' + detail + '</small>' : '');
    box.classList.toggle('is-syncing', !!status && status.status === 'syncing');
    box.classList.toggle('is-error', !!status && status.status === 'error');
  }

  function refreshUi() {
    try { if (typeof renderV078Chart === 'function') renderV078Chart(); } catch (e) {}
    try { if (typeof renderV070Mypage === 'function') renderV070Mypage(); } catch (e) {}
    try { if (typeof v136RenderGoal === 'function') v136RenderGoal(); } catch (e) {}
    try { if (typeof v102RenderActivityTools === 'function') v102RenderActivityTools(); } catch (e) {}
    try { if (typeof v113LoadReceivedThanks === 'function') v113LoadReceivedThanks(); } catch (e) {}
    try { if (typeof v100RenderSummary === 'function') v100RenderSummary(); } catch (e) {}
    try { if (typeof v100RenderThanksFlowSummary === 'function') v100RenderThanksFlowSummary(); } catch (e) {}
    try { if (typeof v100RenderThanksStories === 'function') v100RenderThanksStories(); } catch (e) {}
    try { if (typeof v100RenderGroupNews === 'function') v100RenderGroupNews(); } catch (e) {}
    try { if (typeof updateNewsBadgesV051 === 'function') updateNewsBadgesV051(); } catch (e) {}
    try { if (typeof updateNewsRowsV051 === 'function') updateNewsRowsV051(); } catch (e) {}
    try { if (typeof v100RenderNotices === 'function') v100RenderNotices(); } catch (e) {}
    try { if (typeof renderAdminButtonV131 === 'function') renderAdminButtonV131(); } catch (e) {}
    renderStatus();
  }

  async function request(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  async function sync(options) {
    const id = employeeId();
    if (!id) {
      renderStatus();
      return;
    }

    const silent = options && options.silent === true;
    if (!silent) setStatus('syncing', '');

    try {
      const payload = { employeeId: id };
      const token = syncToken();
      if (token) payload.syncToken = token;
      const response = await request('getUserState', payload);
      if (!response || !response.ok || !response.state) throw new Error('sync_failed');
      const changed = applyState(response.state);
      setStatus('synced', changed ? '' : 'unchanged');
      if (changed) refreshUi();
    } catch (e) {
      setStatus('error', e.message || 'sync_failed');
    }
  }

  function applyApiResult(response) {
    if (!response || !response.ok || !response.state) return response;
    const changed = applyState(response.state);
    setStatus('synced', changed ? '' : 'unchanged');
    if (changed) refreshUi();
    return response;
  }

  return {
    VERSION,
    sync,
    applyState,
    applyApiResult,
    refreshUi,
    renderStatus,
    setStatus,
    syncToken
  };
})();
