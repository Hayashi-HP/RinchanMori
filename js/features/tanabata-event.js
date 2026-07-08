const RinchanTanabataEvent = (() => {
  const VERSION = 'v1.2.9';
  const STORAGE_KEY = 'rinchanTanabataWishes';

  function isTanabata() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent().key === 'tanabata';
      }
    } catch(e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 7 && d.getDate() <= 7;
  }

  function loadWishes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.slice(0, 3) : [];
    } catch(e) { return []; }
  }

  function saveWish(text) {
    const clean = String(text || '').trim().slice(0, 28);
    if (!clean) return;
    const list = loadWishes();
    list.unshift({ text: clean, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 3)));
  }

  function wishHtml() {
    const wishes = loadWishes();
    if (!wishes.length) {
      return '<button type="button" class="tanabata-wish-button">願いを書く</button>';
    }
    return wishes.map((w, i) => '<button type="button" class="tanabata-wish-card w' + (i + 1) + '" title="願いを書く">' + escapeHtml(w.text) + '</button>').join('') + '<button type="button" class="tanabata-wish-button small">＋</button>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const old = map.querySelector('.tanabata-layer');
    if (!isTanabata()) {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    let layer = old;
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'tanabata-layer';
      map.appendChild(layer);
    }
    layer.innerHTML = '<span class="tanabata-item tanabata-bamboo">🎋</span><span class="tanabata-item tanabata-strip s1"></span><span class="tanabata-item tanabata-strip s2"></span><span class="tanabata-item tanabata-strip s3"></span><span class="tanabata-item tanabata-star st1">✨</span><span class="tanabata-item tanabata-star st2">✦</span><span class="tanabata-item tanabata-star st3">✨</span><div class="tanabata-wish-area">' + wishHtml() + '</div>';
    layer.querySelectorAll('.tanabata-wish-button,.tanabata-wish-card').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        openWishPrompt();
      });
    });
  }

  function openWishPrompt() {
    const value = window.prompt('短冊に願いを書いてね（匿名・28文字まで）', 'みんな健康でありますように');
    if (value === null) return;
    saveWish(value);
    render();
    try {
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({ speech: '願いごとの短冊を飾ったよ🎋', primaryText: 'ありがとう', hideClose: true });
      }
    } catch(e) {}
  }

  function install() {
    render();
    setTimeout(render, 400);
    setTimeout(render, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render, isTanabata, loadWishes };
})();
window.RinchanTanabataEvent = RinchanTanabataEvent;
