const RINCHAN_V158_STATE_BRIDGE = 'v0.9.58';

function v158ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function v158SaveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function v158NormalizeActivities(list) {
  return (Array.isArray(list) ? list : []).map(item => ({
    activityId: String(item.activityId || ''),
    participantId: String(item.participantId || item.id || ''),
    deviceId: String(item.deviceId || ''),
    date: String(item.date || '').slice(0, 10),
    steps: Number(item.steps || 0),
    challenge: item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE',
    comment: String(item.comment || ''),
    createdAt: String(item.createdAt || item.date || ''),
    version: String(item.version || RINCHAN_V158_STATE_BRIDGE),
    savedAt: String(item.savedAt || '')
  })).filter(item => item.activityId || item.date || item.steps > 0);
}

function v158NormalizeThanks(list) {
  return (Array.isArray(list) ? list : []).map(item => Object.assign({}, item, {
    thanksId: String(item.thanksId || item.id || ''),
    createdAt: String(item.createdAt || ''),
    reason: String(item.reason || 'ありがとう')
  }));
}

function v158ApplyState(state) {
  if (!state) return;

  if (typeof v135ApplyState === 'function') {
    v135ApplyState(state);
  } else {
    if (state.user) {
      const current = v158ReadJson('rinchanParticipant', {}) || {};
      localStorage.setItem('rinchanParticipant', JSON.stringify(Object.assign({}, current, state.user)));
    }
    if (Array.isArray(state.activities)) v158SaveJson('rinchanActivities', v158NormalizeActivities(state.activities));
    if (Array.isArray(state.receivedThanks)) v158SaveJson('rinchanReceivedThanks', v158NormalizeThanks(state.receivedThanks));
    if (Array.isArray(state.sentThanks)) v158SaveJson('rinchanSentThanks', v158NormalizeThanks(state.sentThanks));
    if (Array.isArray(state.thanksTimeline)) v158SaveJson('rinchanGoodTimeline', state.thanksTimeline);
    if (Array.isArray(state.readNewsIds)) v158SaveJson('rinchanReadNewsIds', state.readNewsIds);
    if (state.thanksStats) v158SaveJson('rinchanThanksStats', state.thanksStats);
  }

  const now = new Date().toISOString();
  localStorage.setItem('rinchanLastSyncedAt', now);
  v158SaveJson('rinchanSyncStatus', { status: 'synced', message: '', at: now });

  try { if (typeof v135RefreshUi === 'function') v135RefreshUi(); } catch (e) {}
  try { if (typeof v135RenderSyncStatus === 'function') v135RenderSyncStatus(); } catch (e) {}
}

function v158ApplyApiResult(result) {
  if (!result || !result.ok) return result;
  if (result.state) v158ApplyState(result.state);
  return result;
}

function v158PatchApiFunction(name) {
  const original = window[name];
  if (typeof original !== 'function' || original.__rinchanStateBridge) return;

  const patched = async function() {
    const result = await original.apply(this, arguments);
    return v158ApplyApiResult(result);
  };
  patched.__rinchanStateBridge = true;
  patched.__original = original;
  window[name] = patched;
}

function v158PatchApis() {
  v158PatchApiFunction('rinchanApi');
  v158PatchApiFunction('v051Api');
}

v158PatchApis();
document.addEventListener('DOMContentLoaded', v158PatchApis);
setTimeout(v158PatchApis, 300);
setTimeout(v158PatchApis, 1200);
