const RinchanFlowerReceiveEffect = (() => {
  const VERSION = 'v1.1.35';

  function injectStyles() {
    if (document.getElementById('rinchanFlowerReceiveEffectStyle')) return;
    const style = document.createElement('style');
    style.id = 'rinchanFlowerReceiveEffectStyle';
    style.textContent = [
      '.flower-receive-layer{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden}',
      '.flower-receive-petal{position:absolute;left:50%;top:52%;font-size:24px;opacity:0;animation:flowerPetalFly 1200ms ease-out forwards;transform:translate(-50%,-50%)}',
      '.flower-receive-message{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(.92);min-width:250px;max-width:86vw;padding:22px 20px;border-radius:30px;background:rgba(255,255,255,.96);box-shadow:0 24px 60px rgba(178,103,137,.24);border:1px solid rgba(226,133,178,.22);text-align:center;animation:flowerMessagePop 1200ms ease-out forwards}',
      '.flower-receive-message .flower-big{display:block;font-size:50px;line-height:1;margin-bottom:8px}',
      '.flower-receive-message strong{display:block;color:#513149;font-size:22px;line-height:1.35;font-weight:950;letter-spacing:-.04em}',
      '.flower-receive-message small{display:block;margin-top:8px;color:#667568;font-size:13px;font-weight:900;line-height:1.5}',
      '@keyframes flowerMessagePop{0%{opacity:0;transform:translate(-50%,-50%) scale(.86)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.04)}35%{transform:translate(-50%,-50%) scale(1)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-58%) scale(.98)}}',
      '@keyframes flowerPetalFly{0%{opacity:0;transform:translate(-50%,-50%) scale(.6) rotate(0deg)}12%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.15) rotate(var(--r))}}',
      '@media (prefers-reduced-motion:reduce){.flower-receive-petal,.flower-receive-message{animation:none!important;opacity:1}.flower-receive-layer{display:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function play(options) {
    injectStyles();
    const opt = options || {};
    const layer = document.createElement('div');
    layer.className = 'flower-receive-layer';
    const message = document.createElement('div');
    message.className = 'flower-receive-message';
    message.innerHTML = '<span class="flower-big">🌸</span><strong>' + escapeHtml(opt.title || 'ありがとうの花が咲きました') + '</strong><small>' + escapeHtml(opt.note || 'あなたの木に、やさしい気持ちが届きました。') + '</small>';
    layer.appendChild(message);
    const petals = ['🌸','🌷','🌼','💮','🌺'];
    for (let i = 0; i < 18; i += 1) {
      const p = document.createElement('span');
      p.className = 'flower-receive-petal';
      p.textContent = petals[i % petals.length];
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 90 + (i % 5) * 22;
      const x = Math.round(Math.cos(angle) * dist);
      const y = Math.round(Math.sin(angle) * dist - 20 - (i % 3) * 18);
      p.style.setProperty('--x', x + 'px');
      p.style.setProperty('--y', y + 'px');
      p.style.setProperty('--r', ((i % 2 ? 1 : -1) * (120 + i * 17)) + 'deg');
      p.style.animationDelay = (i * 28) + 'ms';
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 1550);
  }

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function findThanks(id) {
    const sources = [readJson('rinchanReceivedThanks', []), readJson('rinchanThanks', []), readJson('rinchanGoodTimeline', [])];
    for (const list of sources) {
      if (!Array.isArray(list)) continue;
      const item = list.find(row => String(row && (row.thanksId || row.id || row.createdAt || row.savedAt)) === String(id));
      if (item) return item;
    }
    return null;
  }

  function senderText(item) {
    if (!item) return 'あなたの木に、やさしい気持ちが届きました。';
    const dept = String(item.fromDept || item.senderDept || item.fromDepartment || '').trim();
    const name = String(item.fromName || item.senderName || item.fromEmployeeName || item.sender || item.from || '').trim();
    if (dept && name) return dept + '　' + name + 'さんより';
    if (name) return name + 'さんより';
    if (dept) return dept + 'より';
    return '杜の仲間より';
  }

  function wrapThanksReceive() {
    if (!window.RinchanThanks || typeof window.RinchanThanks.receiveFlower !== 'function') return false;
    if (window.RinchanThanks.__flowerEffectWrapped) return true;
    const original = window.RinchanThanks.receiveFlower;
    window.RinchanThanks.receiveFlower = function(id) {
      const opened = readJson('rinchanReadThanksFlowerIds', []).map(String);
      const wasUnread = !opened.includes(String(id));
      const item = findThanks(id);
      if (wasUnread) play({ title: 'ありがとうの花が咲きました', note: senderText(item) });
      return original.apply(window.RinchanThanks, arguments);
    };
    window.RinchanThanks.__flowerEffectWrapped = true;
    return true;
  }

  function install() {
    injectStyles();
    wrapThanksReceive();
    setTimeout(wrapThanksReceive, 300);
    setTimeout(wrapThanksReceive, 1200);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 100));
  return { VERSION, install, play };
})();
window.RinchanFlowerReceiveEffect = RinchanFlowerReceiveEffect;
