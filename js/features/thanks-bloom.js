const RinchanThanksBloom = (() => {
  const VERSION = 'v1.0.70';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.writeJson === 'function') return RinchanStorage.writeJson(key, value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
    return value;
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return readJson('rinchanParticipant', null);
    } catch (e) { return null; }
  }

  function employeeId() {
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  function readFlowerIds() {
    const ids = readJson('rinchanReadThanksFlowerIds', []);
    return Array.isArray(ids) ? ids.map(String) : [];
  }

  function saveFlowerIds(ids) {
    return writeJson('rinchanReadThanksFlowerIds', Array.from(new Set((ids || []).filter(Boolean).map(String))));
  }

  function allReceivedThanks() {
    const me = employeeId();
    const sources = [readJson('rinchanReceivedThanks', []), readJson('rinchanThanks', []), readJson('rinchanSentThanks', [])];
    const map = {};
    sources.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        const toId = String(item.toParticipantId || item.toEmployeeId || item.receiverId || '').trim();
        if (me && toId && toId !== me) return;
        const id = String(item.thanksId || item.id || item.createdAt || JSON.stringify(item));
        if (!id) return;
        map[id] = {
          id,
          fromName: item.fromName || item.senderName || '杜の仲間',
          reason: item.reason || 'ありがとう',
          comment: item.comment || item.message || '',
          createdAt: item.createdAt || item.savedAt || item.date || ''
        };
      });
    });
    return Object.values(map).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function formatDate(value) {
    const d = new Date(value || '');
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function injectStyles() {
    if (document.getElementById('rinchanThanksBloomStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanThanksBloomStyles';
    style.textContent = [
      '@keyframes rinchanBudBloom{0%{opacity:0;transform:scale(.4) translateY(10px)}35%{opacity:1;transform:scale(1.35) translateY(-6px)}70%{transform:scale(.95) translateY(1px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
      '@keyframes rinchanPetalRise{0%{opacity:0;transform:translate3d(0,20px,0) scale(.55) rotate(0deg)}20%{opacity:1}100%{opacity:0;transform:translate3d(var(--x),-150px,0) scale(1.15) rotate(95deg)}}',
      '.rinchan-bloom-stage{position:fixed;inset:0;z-index:10000;pointer-events:none;display:flex;align-items:center;justify-content:center}',
      '.rinchan-bloom-flower{font-size:72px;animation:rinchanBudBloom .72s cubic-bezier(.2,.9,.25,1.25) both;filter:drop-shadow(0 16px 24px rgba(190,90,130,.20))}',
      '.rinchan-bloom-petal{position:fixed;left:50%;top:52%;font-size:22px;animation:rinchanPetalRise 1.25s ease-out forwards;filter:drop-shadow(0 8px 10px rgba(190,90,130,.12))}'
    ].join('');
    document.head.appendChild(style);
  }

  function bloomBurst() {
    injectStyles();
    const stage = document.createElement('div');
    stage.className = 'rinchan-bloom-stage';
    const flower = document.createElement('div');
    flower.className = 'rinchan-bloom-flower';
    flower.textContent = '🌸';
    stage.appendChild(flower);
    document.body.appendChild(stage);
    for (let i = 0; i < 18; i += 1) {
      const petal = document.createElement('div');
      petal.className = 'rinchan-bloom-petal';
      petal.textContent = i % 3 === 0 ? '🌼' : '🌸';
      petal.style.setProperty('--x', (Math.random() * 220 - 110) + 'px');
      petal.style.animationDelay = (Math.random() * .28) + 's';
      petal.style.left = (50 + Math.random() * 16 - 8) + '%';
      petal.style.top = (54 + Math.random() * 10 - 5) + '%';
      document.body.appendChild(petal);
      setTimeout(() => petal.remove(), 1600);
    }
    setTimeout(() => stage.remove(), 980);
  }

  function openReceivedThanks(id) {
    const item = allReceivedThanks().find(row => String(row.id) === String(id));
    if (!item) return;
    const ids = readFlowerIds();
    const wasUnread = !ids.includes(String(item.id));
    if (wasUnread) {
      ids.push(String(item.id));
      saveFlowerIds(ids);
      bloomBurst();
    }
    if (window.RinchanNews) {
      if (typeof RinchanNews.renderReceivedThanks === 'function') RinchanNews.renderReceivedThanks();
      if (typeof RinchanNews.updateBadges === 'function') RinchanNews.updateBadges();
    }
    if (window.RinchanFlowerAlbum && typeof RinchanFlowerAlbum.renderAll === 'function') {
      setTimeout(() => RinchanFlowerAlbum.renderAll(), 120);
    }
    const quote = item.comment || item.reason || 'ありがとう';
    const showModal = () => {
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({
          speech: item.fromName + 'さんから\n花が届いたよ🌸',
          note: '「' + quote + '」\n\n' + formatDate(item.createdAt),
          primaryText: wasUnread ? '受け取ったよ♪' : 'また読めてうれしい♪',
          hideClose: true
        });
      } else {
        alert(item.fromName + 'さんから\n「' + quote + '」');
      }
    };
    setTimeout(showModal, wasUnread ? 760 : 0);
  }

  function install() {
    injectStyles();
    if (window.RinchanNews) window.RinchanNews.openReceivedThanks = openReceivedThanks;
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 60));

  return { VERSION, install, openReceivedThanks, bloomBurst };
})();
window.RinchanThanksBloom = RinchanThanksBloom;
