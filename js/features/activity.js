const RinchanActivity = (() => {
  const VERSION = 'v0.9.94';

  function readJson(key, fallback) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.writeJson === 'function') return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function deviceId() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.deviceId === 'function') return RinchanStorage.deviceId();
    let id = localStorage.getItem('rinchanDeviceId');
    if (!id) {
      id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('rinchanDeviceId', id);
    }
    return id;
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function checked(id) {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = !!busy;
    if (label) button.textContent = label;
  }

  async function api(action, payload) {
    if (typeof RinchanApi !== 'undefined' && RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    if (window.RinchanApi && typeof window.RinchanApi.request === 'function') return window.RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyResult(result) {
    if (typeof RinchanSync !== 'undefined' && RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result);
    if (window.RinchanSync && typeof window.RinchanSync.applyApiResult === 'function') return window.RinchanSync.applyApiResult(result);
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return parsed.getFullYear() + '-' + String(parsed.getMonth() + 1).padStart(2, '0') + '-' + String(parsed.getDate()).padStart(2, '0');
    return raw.slice(0, 10);
  }

  function formatDateLabel(value) {
    const key = normalizeDateKey(value);
    const parts = key.split('-');
    if (parts.length !== 3) return key.replace(/-/g, '/');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return key.replace(/-/g, '/');
    const dt = new Date(y, m - 1, d);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return String(m).padStart(2, '0') + '/' + String(d).padStart(2, '0') + ' ' + days[dt.getDay()];
  }

  function normalizeActivity(item) {
    return {
      activityId: String(item.activityId || 'A' + Date.now().toString(36)),
      participantId: String(item.participantId || item.employeeId || item.id || ''),
      deviceId: String(item.deviceId || deviceId()),
      date: normalizeDateKey(item.date || item.createdAt),
      steps: Number(item.steps || 0),
      challenge: item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE',
      comment: String(item.comment || ''),
      createdAt: String(item.createdAt || new Date().toISOString()),
      version: String(item.version || VERSION),
      savedAt: String(item.savedAt || '')
    };
  }

  function upsertLocalActivity(activity) {
    const list = activities().map(normalizeActivity);
    const next = normalizeActivity(activity);
    const sameDateIndex = list.findIndex(item => normalizeDateKey(item.date) === normalizeDateKey(next.date));
    const sameIdIndex = list.findIndex(item => String(item.activityId || '') === String(next.activityId || ''));
    const index = sameIdIndex >= 0 ? sameIdIndex : sameDateIndex;
    if (index >= 0) list[index] = Object.assign({}, list[index], next, { activityId: list[index].activityId || next.activityId });
    else list.unshift(next);
    writeJson('rinchanActivities', list);
    renderRecentActivities();
    return index >= 0 ? list[index] : next;
  }

  function removeLocalActivity(activityId) {
    writeJson('rinchanActivities', activities().filter(item => String(item.activityId || '') !== String(activityId || '')));
    renderRecentActivities();
  }

  function initDate() {
    const input = document.getElementById('activityDate');
    if (input && !input.value) input.value = todayKey();
  }

  function findExistingIdByDate(dateValue) {
    const key = normalizeDateKey(dateValue);
    const row = activities().map(normalizeActivity).find(item => normalizeDateKey(item.date) === key);
    return row ? row.activityId : '';
  }

  function buildActivityPayload(existingId) {
    const user = participant();
    if (!user || !(user.employeeId || user.id)) return null;
    const steps = Number(value('steps') || 0);
    if (!steps || steps < 0) return null;
    const date = value('activityDate') || todayKey();
    const id = existingId || findExistingIdByDate(date) || 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    return normalizeActivity({
      activityId: id,
      participantId: user.employeeId || user.id,
      employeeId: user.employeeId || user.id,
      deviceId: deviceId(),
      date,
      steps,
      challenge: checked('challenge'),
      comment: value('comment'),
      createdAt: new Date().toISOString(),
      version: VERSION
    });
  }

  async function saveActivity(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('activityForm');
    const button = form ? form.querySelector('button[type="submit"],button.submit') : null;
    const payload = buildActivityPayload(form && form.dataset ? form.dataset.editingId : '');

    if (!payload) {
      alert('歩数を入力してください。');
      return;
    }

    setBusy(button, true, '保存中...');
    const savedLocal = upsertLocalActivity(payload);

    const result = await api('saveActivity', savedLocal || payload);
    applyResult(result);

    if (result && result.ok) {
      if (form && form.dataset) delete form.dataset.editingId;
      if (form) form.reset();
      initDate();
      const complete = document.getElementById('complete');
      if (complete) complete.classList.remove('hidden');
      renderRecentActivities();
    } else {
      alert('端末には保存しましたが、スプレッドシートへ送信できませんでした。理由: ' + ((result && (result.reason || result.error)) || 'unknown'));
    }

    setBusy(button, false, '記録する');
  }

  async function deleteActivity(activityId) {
    if (!activityId) return;
    if (!confirm('この記録を削除しますか？')) return;
    const user = participant();
    const employeeId = user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
    removeLocalActivity(activityId);
    const result = await api('deleteActivity', { activityId, employeeId, participantId: employeeId });
    applyResult(result);
  }

  function editActivity(activityId) {
    const item = activities().map(normalizeActivity).find(row => String(row.activityId || '') === String(activityId || ''));
    if (!item) return;
    const form = document.getElementById('activityForm');
    if (form && form.dataset) form.dataset.editingId = item.activityId;
    const date = document.getElementById('activityDate');
    const steps = document.getElementById('steps');
    const challenge = document.getElementById('challenge');
    const comment = document.getElementById('comment');
    if (date) date.value = normalizeDateKey(item.date) || todayKey();
    if (steps) steps.value = Number(item.steps || 0) || '';
    if (challenge) challenge.checked = item.challenge === true || String(item.challenge).toUpperCase() === 'TRUE';
    if (comment) comment.value = item.comment || '';
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderRecentActivities() {
    const box = document.getElementById('activityToolsList');
    if (!box) return;
    const rows = activities()
      .map(normalizeActivity)
      .sort((a, b) => normalizeDateKey(b.date).localeCompare(normalizeDateKey(a.date)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 5);

    if (!rows.length) {
      box.innerHTML = '<p class="empty-note">まだ記録がありません。</p>';
      return;
    }

    box.innerHTML = rows.map(item => {
      const date = formatDateLabel(item.date);
      const steps = Number(item.steps || 0).toLocaleString();
      const comment = item.comment ? '<small>' + escapeHtml(item.comment) + '</small>' : '';
      return '<div class="activity-tool-row"><div class="activity-tool-main"><strong>' + date + '　' + steps + '歩</strong>' + comment + '</div><div class="activity-tool-actions"><button type="button" class="activity-edit-btn" aria-label="修正" onclick="RinchanActivity.editActivity(\'' + escapeAttr(item.activityId) + '\')">✏️</button><button type="button" class="activity-delete-btn" aria-label="削除" onclick="RinchanActivity.deleteActivity(\'' + escapeAttr(item.activityId) + '\')">🗑️</button></div></div>';
    }).join('');
    writeJson('rinchanActivities', activities().map(normalizeActivity));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function install() {
    initDate();
    renderRecentActivities();
    const form = document.getElementById('activityForm');
    if (form && !form.__rinchanActivityInstalled) {
      form.__rinchanActivityInstalled = true;
      form.addEventListener('submit', saveActivity, true);
    }
    window.v102RenderActivityTools = renderRecentActivities;
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    saveActivity,
    deleteActivity,
    editActivity,
    renderRecentActivities,
    upsertLocalActivity,
    removeLocalActivity
  };
})();