const RINCHAN_V113_MYPAGE = 'v0.9.39';

function v113ReadJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
function v113SaveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function v113Participant() { return v113ReadJson('rinchanParticipant', null) || {}; }
function v113EscapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function v113Num(n) { return Number(n || 0).toLocaleString('ja-JP'); }
function v113RelativeTime(dateString) { if (!dateString) return 'たった今'; const d = new Date(dateString); if (isNaN(d)) return 'たった今'; const diff = Date.now() - d.getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'たった今'; if (mins < 60) return mins + '分前'; const hours = Math.floor(mins / 60); if (hours < 24) return hours + '時間前'; return Math.floor(hours / 24) + '日前'; }
function v113FromLabel(item) { return item.fromName || item.fromNick || (item.fromParticipantId ? '社員番号 ' + item.fromParticipantId : 'どなたか'); }

async function v113LoadReceivedThanks() {
  const box = document.getElementById('receivedThanksList');
  if (!box) return;
  const p = v113Participant();
  if (!p || !p.id) { box.innerHTML = '<p class="received-thanks-empty">登録後に、もらったありがとうが表示されます。</p>'; return; }
  box.innerHTML = '<p class="received-thanks-empty">読み込み中...</p>';
  let received = [];
  let sent = v113ReadJson('rinchanSentThanks', []);
  let stats = v113ReadJson('rinchanThanksStats', null) || {};
  try {
    if (typeof v051Api === 'function') {
      const employeeId = p.employeeId || p.id;
      const result = await v051Api('myThanks', { employeeId });
      if (result && result.ok && Array.isArray(result.thanks)) received = result.thanks;
      const sentResult = await v051Api('mySentThanks', { employeeId });
      if (sentResult && sentResult.ok && Array.isArray(sentResult.thanks)) { sent = sentResult.thanks; v113SaveJson('rinchanSentThanks', sent); }
      const statResult = await v051Api('myThanksStats', { employeeId });
      if (statResult && statResult.ok && statResult.stats) { stats = statResult.stats; v113SaveJson('rinchanThanksStats', stats); }
    }
  } catch (e) {}
  if (!received.length) received = v113ReadJson('rinchanReceivedThanks', []);
  v113RenderThanksStats(stats, sent, received);
  v113RenderReceivedThanks(received);
  if (typeof renderV070Mypage === 'function') renderV070Mypage();
}

function v113RenderThanksStats(stats, sent, received) {
  const sentEl = document.getElementById('v139SentThanksCount');
  const receivedEl = document.getElementById('v139ReceivedThanksCount');
  const totalEl = document.getElementById('v139TotalThanksCount');
  const sentCount = Number((stats && stats.sentCount) || (sent || []).length || 0);
  const receivedCount = Number((stats && stats.receivedCount) || (received || []).length || 0);
  if (sentEl) sentEl.textContent = v113Num(sentCount) + '件';
  if (receivedEl) receivedEl.textContent = v113Num(receivedCount) + '件';
  if (totalEl) totalEl.textContent = v113Num(sentCount + receivedCount) + '件';
}

function v113RenderReceivedThanks(list) {
  const box = document.getElementById('receivedThanksList');
  if (!box) return;
  const items = (list || []).slice().sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
  if (!items.length) { box.innerHTML = '<p class="received-thanks-empty">まだ届いたありがとうはありません。</p>'; return; }
  box.innerHTML = items.map(item => {
    const from = v113FromLabel(item);
    const reason = item.reason || 'ありがとう';
    const message = item.message || item.comment || '';
    const body = message || reason;
    return '<article class="received-thanks-item">' +
      '<div class="received-thanks-line"><span class="received-thanks-heart" aria-hidden="true">❤️</span><strong>' + v113EscapeHtml(from) + '</strong><time>' + v113EscapeHtml(v113RelativeTime(item.createdAt)) + '</time></div>' +
      '<p>' + v113EscapeHtml(body) + '</p>' +
    '</article>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', v113LoadReceivedThanks);
