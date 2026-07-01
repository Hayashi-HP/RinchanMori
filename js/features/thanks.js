const RinchanThanks = (() => {
  const VERSION = 'v0.9.61';

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

  function deviceId() {
    if (window.RinchanStorage) return RinchanStorage.deviceId();
    let id = localStorage.getItem('rinchanDeviceId');
    if (!id) {
      id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('rinchanDeviceId', id);
    }
    return id;
  }

  async function api(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyResult(result) {
    if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result);
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  function normalizeThanks(item) {
    return Object.assign({}, item || {}, {
      thanksId: String((item && (item.thanksId || item.id)) || 'K' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      fromParticipantId: String((item && item.fromParticipantId) || ''),
      fromName: String((item && item.fromName) || ''),
      toParticipantId: String((item && item.toParticipantId) || ''),
      toName: String((item && item.toName) || ''),
      toDept: String((item && item.toDept) || ''),
      reason: String((item && item.reason) || 'ありがとう'),
      createdAt: String((item && item.createdAt) || new Date().toISOString()),
      version: String((item && item.version) || VERSION)
    });
  }

  function receivedThanks() {
    return readJson('rinchanReceivedThanks', []);
  }

  function sentThanks() {
    return readJson('rinchanSentThanks', []);
  }

  function timeline() {
    return readJson('rinchanGoodTimeline', []);
  }

  function stats() {
    return readJson('rinchanThanksStats', {
      sentCount: sentThanks().length,
      receivedCount: receivedThanks().length,
      totalCount: sentThanks().length + receivedThanks().length
    });
  }

  function addLocalSent(item) {
    const list = sentThanks();
    const next = normalizeThanks(item);
    const index = list.findIndex(row => String(row.thanksId || '') === next.thanksId);
    if (index >= 0) list[index] = Object.assign({}, list[index], next);
    else list.unshift(next);
    writeJson('rinchanSentThanks', list.slice(0, 50));
    writeJson('rinchanThanksStats', {
      sentCount: list.length,
      receivedCount: receivedThanks().length,
      totalCount: list.length + receivedThanks().length
    });
    renderStats();
    return next;
  }

  function buildPayload(toUser, reason) {
    const from = participant();
    if (!from || !(from.employeeId || from.id)) return null;
    const to = toUser || {};
    return normalizeThanks({
      thanksId: 'K' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fromParticipantId: from.employeeId || from.id,
      fromName: from.nick || from.name || '杜の仲間',
      toParticipantId: to.employeeId || to.id || to.participantId || '',
      toName: to.nick || to.name || '杜の仲間',
      toDept: to.dept || to.toDept || '',
      reason: reason || to.reason || 'ありがとう',
      createdAt: new Date().toISOString(),
      deviceId: deviceId(),
      version: VERSION
    });
  }

  async function sendThanks(toUser, reason) {
    const payload = buildPayload(toUser, reason);
    if (!payload || !payload.toParticipantId) {
      alert('ありがとうを送る相手を選んでください。');
      return null;
    }

    addLocalSent(payload);
    const result = await api('saveThanks', payload);
    applyResult(result);

    if (!result || !result.ok) {
      alert('通信できないため、未送信として保存しました。通信が戻ると再送します。');
    }
    return result;
  }

  function sendThanksFromDataset(button) {
    const el = button || (event && event.currentTarget) || null;
    if (!el) return;
    const data = el.dataset || {};
    const toUser = {
      id: data.id || data.participantId || data.toParticipantId || '',
      employeeId: data.employeeId || data.id || data.participantId || data.toParticipantId || '',
      name: data.name || data.toName || '',
      nick: data.nick || '',
      dept: data.dept || data.toDept || ''
    };
    const reason = data.reason || 'ありがとう';
    return sendThanks(toUser, reason);
  }

  function renderStats() {
    const s = stats();
    const sent = document.getElementById('v139SentThanksCount');
    const received = document.getElementById('v139ReceivedThanksCount');
    const total = document.getElementById('v139TotalThanksCount');
    if (sent) sent.textContent = Number(s.sentCount || 0).toLocaleString() + '件';
    if (received) received.textContent = Number(s.receivedCount || 0).toLocaleString() + '件';
    if (total) total.textContent = Number(s.totalCount || 0).toLocaleString() + '件';
  }

  function renderReceivedList() {
    const box = document.getElementById('receivedThanksList');
    if (!box) return;
    const rows = receivedThanks().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
    if (!rows.length) {
      box.innerHTML = '<p class="received-thanks-empty">まだ届いたありがとうはありません。</p>';
      return;
    }
    box.innerHTML = rows.map(item => {
      const date = formatDate(item.createdAt);
      const from = escapeHtml(item.fromName || '杜の仲間');
      const reason = escapeHtml(item.reason || 'ありがとう');
      return '<div class="received-thanks-row"><strong>' + reason + '</strong><p>' + from + 'さんから届きました。</p><small>' + date + '</small></div>';
    }).join('');
  }

  function renderTimelineSummary() {
    const box = document.getElementById('thanksFlowSummary');
    if (!box) return;
    const rows = timeline().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    if (!rows.length) {
      box.innerHTML = '<p class="empty-note news-empty">まだありがとうは届いていません。</p>';
      return;
    }
    const item = rows[0];
    box.innerHTML = '<div class="thanks-flow-main"><strong>' + escapeHtml(item.title || 'ありがとうが届けられました') + '</strong><p>' + escapeHtml(item.publicBody || item.body || '') + '</p><small>' + formatDate(item.createdAt) + '</small></div>';
  }

  function renderTimelineList() {
    const box = document.getElementById('thanksStoryList');
    if (!box) return;
    const rows = timeline().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
    if (!rows.length) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = rows.map(item => {
      const reason = item.reason ? '<span class="thanks-reason-pill">' + escapeHtml(item.reason) + '</span>' : '';
      return '<div class="thanks-story-row"><div><strong>' + escapeHtml(item.fromDept || '杜の仲間') + ' → ' + escapeHtml(item.toDept || item.targetDept || '杜の仲間') + '</strong><p>' + escapeHtml(item.publicBody || item.body || '') + '</p></div>' + reason + '</div>';
    }).join('');
  }

  function renderAll() {
    renderStats();
    renderReceivedList();
    renderTimelineSummary();
    renderTimelineList();
  }

  function formatDate(value) {
    const d = new Date(value || '');
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function install() {
    renderAll();
    window.v113LoadReceivedThanks = renderReceivedList;
    window.v100RenderThanksFlowSummary = renderTimelineSummary;
    window.v100RenderThanksStories = renderTimelineList;
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    sendThanks,
    sendThanksFromDataset,
    renderAll,
    renderStats,
    renderReceivedList,
    renderTimelineSummary,
    renderTimelineList,
    addLocalSent
  };
})();
