const RINCHAN_V135_SYNC = 'v0.9.59';
const RINCHAN_SYNC_TIME_KEY = 'rinchanLastSyncedAt';
const RINCHAN_SYNC_STATUS_KEY = 'rinchanSyncStatus';
const RINCHAN_SYNC_TOKEN_KEY = 'rinchanSyncToken';

function v135ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function v135SaveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function v135Participant() {
  return v135ReadJson('rinchanParticipant', null);
}

function v135SaveParticipant(participant) {
  localStorage.setItem('rinchanParticipant', JSON.stringify(participant));
}

function v135EmployeeId() {
  const participant = v135Participant();
  return participant && (participant.employeeId || participant.id) ? String(participant.employeeId || participant.id) : '';
}

function v135SyncToken() {
  return String(localStorage.getItem(RINCHAN_SYNC_TOKEN_KEY) || '').trim();
}

function v135SaveSyncToken(token) {
  if (token) localStorage.setItem(RINCHAN_SYNC_TOKEN_KEY, String(token));
}

async function v135Api(action, payload) {
  if (typeof v051Api === 'function') return v051Api(action, payload || {});
  return { ok: false, reason: 'api_not_ready' };
}

function v135NormalizeActivities(list) {
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
      version: String(item.version || RINCHAN_V135_SYNC),
      savedAt: String(item.savedAt || '')
    }))
    .filter(item => item.activityId || item.date || item.steps > 0);
}

function v135NormalizeThanks(list) {
  return (Array.isArray(list) ? list : []).map(item => Object.assign({}, item, {
    thanksId: String(item.thanksId || item.id || ''),
    createdAt: String(item.createdAt || ''),
    reason: String(item.reason || 'ありがとう')
  }));
}

function v135ApplyState(state) {
  if (!state) return;

  if (state.syncToken) v135SaveSyncToken(state.syncToken);
  if (state.unchanged === true) return;

  if (state.user) {
    const current = v135Participant() || {};
    v135SaveParticipant(Object.assign({}, current, state.user));
  }

  if (Array.isArray(state.activities)) {
    v135SaveJson('rinchanActivities', v135NormalizeActivities(state.activities));
  }

  if (Array.isArray(state.receivedThanks)) {
    v135SaveJson('rinchanReceivedThanks', v135NormalizeThanks(state.receivedThanks));
  }

  if (Array.isArray(state.sentThanks)) {
    v135SaveJson('rinchanSentThanks', v135NormalizeThanks(state.sentThanks));
  }

  if (Array.isArray(state.thanksTimeline)) {
    v135SaveJson('rinchanGoodTimeline', state.thanksTimeline);
  }

  if (Array.isArray(state.readNewsIds)) {
    v135SaveJson('rinchanReadNewsIds', state.readNewsIds);
  }

  if (state.thanksStats) {
    v135SaveJson('rinchanThanksStats', state.thanksStats);
  }
}

function v135SetSyncStatus(status, message) {
  const now = new Date().toISOString();
  const data = { status, message: message || '', at: now };
  v135SaveJson(RINCHAN_SYNC_STATUS_KEY, data);

  if (status === 'synced') {
    localStorage.setItem(RINCHAN_SYNC_TIME_KEY, now);
  }

  v135RenderSyncStatus();
}

function v135FormatSyncTime(value) {
  if (!value) return '未同期';
  const date = new Date(value);
  if (isNaN(date)) return '未同期';
  return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}

function v135RenderSyncStatus() {
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

  const status = v135ReadJson(RINCHAN_SYNC_STATUS_KEY, null);
  const lastSync = localStorage.getItem(RINCHAN_SYNC_TIME_KEY);
  const label = status && status.status === 'syncing' ? '同期中...' : '最終同期 ' + v135FormatSyncTime(lastSync);
  const detail = status && status.status === 'error' ? '通信できませんでした。保存済みデータを表示中です。' : '';
  box.innerHTML = '<span>' + label + '</span>' + (detail ? '<small>' + detail + '</small>' : '');
  box.classList.toggle('is-syncing', !!status && status.status === 'syncing');
  box.classList.toggle('is-error', !!status && status.status === 'error');
}

function v135ApplyApiResult(response) {
  if (!response || !response.ok) return response;
  if (response.state) {
    const unchanged = response.state.unchanged === true;
    v135ApplyState(response.state);
    v135SetSyncStatus('synced', unchanged ? 'unchanged' : '');
    if (!unchanged) v135RefreshUi();
  }
  return response;
}

function v135PatchApiFunction(name) {
  const original = window[name];
  if (typeof original !== 'function' || original.__rinchanSyncPatched) return;
  const patched = async function() {
    const response = await original.apply(this, arguments);
    return v135ApplyApiResult(response);
  };
  patched.__rinchanSyncPatched = true;
  patched.__original = original;
  window[name] = patched;
}

function v135PatchApis() {
  v135PatchApiFunction('v051Api');
  v135PatchApiFunction('rinchanApi');
}

async function v135SyncUserState(options) {
  const employeeId = v135EmployeeId();
  if (!employeeId) {
    v135RenderSyncStatus();
    return;
  }

  const silent = options && options.silent === true;
  if (!silent) v135SetSyncStatus('syncing', '');

  try {
    const payload = { employeeId };
    const token = v135SyncToken();
    if (token) payload.syncToken = token;
    const response = await v135Api('getUserState', payload);
    if (!response || !response.ok || !response.state) throw new Error('sync_failed');
    const unchanged = response.state.unchanged === true;
    v135ApplyState(response.state);
    v135SetSyncStatus('synced', unchanged ? 'unchanged' : '');
    if (!unchanged) v135RefreshUi();
  } catch (e) {
    v135SetSyncStatus('error', e.message || 'sync_failed');
  }
}

function v135RefreshUi() {
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
  try { v135RenderSyncStatus(); } catch (e) {}
}

async function v135MarkNewsRead(newsId) {
  const employeeId = v135EmployeeId();
  if (!employeeId || !newsId) return;

  try {
    const response = await v135Api('markNewsRead', { employeeId, newsId, syncToken: v135SyncToken() });
    v135ApplyApiResult(response);
  } catch (e) {
    v135SetSyncStatus('error', e.message || 'news_sync_failed');
  }
}

function v135InstallNewsHooks() {
  const oldMark = window.markNoticeReadV113;
  window.markNoticeReadV113 = function(id) {
    if (typeof oldMark === 'function') oldMark(id);
    v135MarkNewsRead(id);
  };

  const oldOpen = window.openNews;
  window.openNews = function(id) {
    if (typeof oldOpen === 'function') oldOpen(id);
    v135MarkNewsRead(id);
  };
}

function v135ScheduleBackgroundSync() {
  v135PatchApis();
  v135RenderSyncStatus();
  setTimeout(() => v135SyncUserState({ silent: true }), 150);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      v135PatchApis();
      v135SyncUserState({ silent: true });
    }
  });
}

(function() {
  v135PatchApis();
  v135InstallNewsHooks();
  document.addEventListener('DOMContentLoaded', v135ScheduleBackgroundSync);
  setTimeout(v135PatchApis, 500);
  setTimeout(v135PatchApis, 1500);
})();
