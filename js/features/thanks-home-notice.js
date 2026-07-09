const RinchanThanksHomeNotice = (() => {
  const VERSION = 'v1.4.11';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return readJson('rinchanParticipant', null);
    } catch (e) { return null; }
  }

  function employeeId() {
    const user = participant();
    return user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
  }

  function arrayUnique(list) { return Array.from(new Set((list || []).map(String).filter(Boolean))); }

  function readFlowerIds() {
    const userReads = readJson('rinchanUserReads', {});
    const local = readJson('rinchanReadThanksFlowerIds', []);
    const server = userReads && Array.isArray(userReads.readThanksFlowerIds) ? userReads.readThanksFlowerIds : [];
    return arrayUnique([].concat(local, server));
  }

  function itemToId(item) {
    return String(item.toParticipantId || item.toEmployeeId || item.receiverId || item.receiverEmployeeId || item.toId || item.targetId || item.targetEmployeeId || item.to || '').trim();
  }

  function itemFromId(item) {
    return String(item.fromParticipantId || item.fromEmployeeId || item.senderId || item.senderEmployeeId || item.fromId || item.from || '').trim();
  }

  function itemFromName(item) {
    return item.fromName || item.senderName || item.fromEmployeeName || item.sender || item.from || '杜の仲間';
  }

  function receivedThanks() {
    const me = employeeId();
    if (!me) return [];
    const sources = [readJson('rinchanReceivedThanks', []), readJson('rinchanThanks', [])];
    const map = {};
    sources.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        if (!item) return;
        const toId = itemToId(item);
        const fromId = itemFromId(item);
        if (toId && toId !== me) return;
        if (!toId && fromId && fromId === me) return;
        const id = String(item.thanksId || item.id || item.createdAt || item.savedAt || JSON.stringify(item));
        if (!id) return;
        map[id] = { id, fromName: itemFromName(item), reason: item.reason || 'ありがとう', comment: item.comment || item.message || item.publicBody || item.body || '', createdAt: item.createdAt || item.savedAt || item.date || '' };
      });
    });
    return Object.values(map).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function unreadFlowers() {
    const opened = readFlowerIds();
    return receivedThanks().filter(item => !opened.includes(String(item.id)));
  }

  function injectStyles() {
    if (document.getElementById('rinchanThanksHomeNoticeStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanThanksHomeNoticeStyles';
    style.textContent = [
      '.thanks-home-notice{background:linear-gradient(180deg,#fff 0%,#fff7fb 100%);border:1px solid rgba(226,133,178,.22);box-shadow:0 16px 38px rgba(178,103,137,.10);cursor:pointer;overflow:hidden}',
      '.thanks-home-notice-row{display:flex;gap:14px;align-items:center;min-width:0}',
      '.thanks-home-notice-row>div:last-child{min-width:0;overflow:hidden}',
      '.thanks-home-notice-flower{width:54px;height:54px;border-radius:20px;background:#fff0f7;display:flex;align-items:center;justify-content:center;font-size:30px;flex:0 0 auto;animation:thanksHomeFlowerPulse 2.8s ease-in-out infinite}',
      '.thanks-home-notice h2{margin:2px 0 4px;color:#513149;font-size:clamp(20px,4.8vw,24px);line-height:1.34;letter-spacing:-.055em;overflow-wrap:normal;word-break:keep-all}',
      '.thanks-home-notice p{margin:0;color:#667568;font-weight:900;line-height:1.55}',
      '@keyframes thanksHomeFlowerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
      '@media (prefers-reduced-motion:reduce){.thanks-home-notice-flower{animation:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureCard() {
    if (document.getElementById('thanksHomeNotice')) return document.getElementById('thanksHomeNotice');
    const anchor = document.querySelector('.home-hero');
    if (!anchor) return null;
    const card = document.createElement('section');
    card.id = 'thanksHomeNotice';
    card.className = 'card thanks-home-notice hidden';
    card.innerHTML = '<div class="thanks-home-notice-row"><div class="thanks-home-notice-flower">🌷</div><div><p class="label">🌸 花が届いているよ</p><h2 id="thanksHomeNoticeTitle">花が届いています🌸</h2><p id="thanksHomeNoticeText">パスポートで受け取れます。</p></div></div>';
    anchor.insertAdjacentElement('afterend', card);
    card.addEventListener('click', () => { location.href = 'pages/mypage.html#thanks'; });
    return card;
  }

  function render() {
    injectStyles();
    const card = ensureCard();
    if (!card) return;
    const unread = unreadFlowers();
    if (!unread.length) { card.classList.add('hidden'); return; }
    const title = document.getElementById('thanksHomeNoticeTitle');
    const text = document.getElementById('thanksHomeNoticeText');
    if (title) title.textContent = '花が届いています🌸';
    if (text) text.textContent = unread.length > 1 ? 'パスポートで ' + unread.length + '輪の花を受け取れます。' : 'パスポートで花を受け取ってね。';
    card.classList.remove('hidden');
  }

  function install() { render(); setTimeout(render, 300); setTimeout(render, 1200); }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, render, unreadFlowers, receivedThanks };
})();
window.RinchanThanksHomeNotice = RinchanThanksHomeNotice;