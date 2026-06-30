const RINCHAN_V113_MYPAGE = 'v0.9.24';

function v113ReadJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
function v113Participant() { return v113ReadJson('rinchanParticipant', null) || {}; }
function v113EscapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function v113RelativeTime(dateString) { if (!dateString) return 'たった今'; const d = new Date(dateString); if (isNaN(d)) return 'たった今'; const diff = Date.now() - d.getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'たった今'; if (mins < 60) return mins + '分前'; const hours = Math.floor(mins / 60); if (hours < 24) return hours + '時間前'; return Math.floor(hours / 24) + '日前'; }
function v113FromLabel(item) { return item.fromName || (item.fromParticipantId ? '社員番号 ' + item.fromParticipantId : 'どなたか'); }

async function v113LoadReceivedThanks() {
  const box = document.getElementById('receivedThanksList');
  if (!box) return;
  const p = v113Participant();
  if (!p || !p.id) { box.innerHTML = '<p class="received-thanks-empty">登録後に、もらったありがとうが表示されます。</p>'; return; }
  box.innerHTML = '<p class="received-thanks-empty">読み込み中...</p>';
  let list = [];
  try {
    if (typeof v051Api === 'function') {
      const result = await v051Api('myThanks', { employeeId: p.employeeId || p.id });
      if (result && result.ok && Array.isArray(result.thanks)) list = result.thanks;
    }
  } catch (e) {}
  if (!list.length) list = v113ReadJson('rinchanReceivedThanks', []);
  v113RenderReceivedThanks(list);
}

function v113RenderReceivedThanks(list) {
  const box = document.getElementById('receivedThanksList');
  if (!box) return;
  const items = (list || []).slice().sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 20);
  if (!items.length) { box.innerHTML = '<p class="received-thanks-empty">まだ届いたありがとうはありません。届いたらここに表示されます。</p>'; return; }
  box.innerHTML = items.map(item => {
    const from = v113FromLabel(item);
    const reason = item.reason || 'ありがとう';
    const body = reason === 'ありがとう' ? '応援の気持ちが届きました。' : 'ありがとうが届きました。';
    return '<article class="received-thanks-item">' +
      '<div class="received-thanks-top"><span class="received-thanks-badge">❤️ ありがとう</span><time class="received-thanks-time">' + v113EscapeHtml(v113RelativeTime(item.createdAt)) + '</time></div>' +
      '<h3><span class="received-thanks-from">' + v113EscapeHtml(from) + 'さんから</span><span class="received-thanks-reason">' + v113EscapeHtml(reason) + '</span></h3>' +
      '<p>' + v113EscapeHtml(body) + '</p>' +
    '</article>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', v113LoadReceivedThanks);
