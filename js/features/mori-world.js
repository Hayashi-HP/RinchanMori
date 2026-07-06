const RinchanMoriWorld = (() => {
  const VERSION = 'v1.0.67';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function uniqueThanks() {
    const sources = [
      readJson('rinchanThanks', []),
      readJson('rinchanSentThanks', []),
      readJson('rinchanReceivedThanks', []),
      readJson('rinchanGoodTimeline', [])
    ];
    const map = {};
    sources.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        const id = String(item.thanksId || item.id || item.createdAt || JSON.stringify(item));
        if (!id) return;
        map[id] = item;
      });
    });
    return Object.values(map);
  }

  function stats() {
    const list = uniqueThanks();
    const flowers = list.length;
    return {
      flowers,
      butterflies: Math.floor(flowers / 5),
      birds: Math.floor(flowers / 10)
    };
  }

  function message(s) {
    if (s.flowers >= 50) return 'ありがとうの花がたくさん咲いて、杜がとてもにぎやかです🌸';
    if (s.flowers >= 20) return '花の香りに、ちょうちょや小鳥が集まってきました🦋';
    if (s.flowers >= 10) return 'ありがとうの花が増えて、杜がやさしい色になってきました🌸';
    if (s.flowers >= 1) return '最初のありがとうの花が咲きました。ここから杜がもっと広がります🌱';
    return 'ありがとうが届くと、ここに花が咲いていくよ🌸';
  }

  function ensureCard() {
    if (document.getElementById('moriThanksWorldCard')) return;
    const statusCard = document.getElementById('moriStatusCard');
    if (!statusCard) return;
    const card = document.createElement('section');
    card.className = 'card mori-thanks-world-card';
    card.id = 'moriThanksWorldCard';
    card.innerHTML = [
      '<p class="label">🌸 ありがとうの花</p>',
      '<h2>やさしさで育つ杜</h2>',
      '<div class="mori-flower-stats">',
      '<div class="mori-flower-stat"><strong id="moriFlowerCount">0</strong><small>咲いた花</small></div>',
      '<div class="mori-flower-stat"><strong id="moriButterflyCount">0</strong><small>ちょうちょ</small></div>',
      '<div class="mori-flower-stat"><strong id="moriBirdCount">0</strong><small>小鳥</small></div>',
      '</div>',
      '<p class="mori-thanks-note" id="moriThanksWorldNote">ありがとうが届くと、ここに花が咲いていくよ🌸</p>'
    ].join('');
    statusCard.insertAdjacentElement('afterend', card);
  }

  function renderCard() {
    ensureCard();
    const s = stats();
    const flowers = document.getElementById('moriFlowerCount');
    const butterflies = document.getElementById('moriButterflyCount');
    const birds = document.getElementById('moriBirdCount');
    const note = document.getElementById('moriThanksWorldNote');
    if (flowers) flowers.textContent = s.flowers.toLocaleString('ja-JP') + '輪';
    if (butterflies) butterflies.textContent = s.butterflies.toLocaleString('ja-JP') + '匹';
    if (birds) birds.textContent = s.birds.toLocaleString('ja-JP') + '羽';
    if (note) note.textContent = message(s);
  }

  function renderMapDecorations() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    map.querySelectorAll('.mori-world-flower,.mori-world-friend').forEach(el => el.remove());
    const s = stats();
    const flowerCount = Math.min(18, Math.max(0, s.flowers));
    const friendCount = Math.min(6, s.butterflies + s.birds);
    for (let i = 0; i < flowerCount; i += 1) {
      const el = document.createElement('span');
      el.className = 'mori-world-flower';
      el.textContent = i % 4 === 0 ? '🌼' : '🌸';
      el.style.left = (8 + ((i * 17) % 82)) + '%';
      el.style.top = (18 + ((i * 23) % 68)) + '%';
      el.style.animationDelay = ((i % 5) * .18) + 's';
      map.appendChild(el);
    }
    for (let j = 0; j < friendCount; j += 1) {
      const el = document.createElement('span');
      el.className = 'mori-world-friend';
      el.textContent = j < s.butterflies ? '🦋' : '🐦';
      el.style.left = (12 + ((j * 29) % 74)) + '%';
      el.style.top = (10 + ((j * 31) % 52)) + '%';
      el.style.animationDelay = ((j % 4) * .25) + 's';
      map.appendChild(el);
    }
  }

  function renderHighlight() {
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    const s = stats();
    if (title) title.textContent = s.flowers ? '花が咲く杜' : '今日の杜';
    if (text) text.textContent = message(s);
  }

  function installThanksClickMessage() {
    const card = document.getElementById('moriThanksWorldCard');
    if (!card || card.__rinchanMoriWorldInstalled) return;
    card.__rinchanMoriWorldInstalled = true;
    card.addEventListener('click', () => {
      const s = stats();
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({
          speech: 'ありがとうで\n杜に花が咲いたよ🌸',
          note: 'いま咲いている花は ' + s.flowers.toLocaleString('ja-JP') + '輪。やさしさが少しずつ広がっています。',
          primaryText: 'いいね♪',
          hideClose: true
        });
      }
    });
  }

  function renderAll() {
    renderCard();
    renderMapDecorations();
    renderHighlight();
    installThanksClickMessage();
  }

  function install() {
    renderAll();
    setTimeout(renderAll, 400);
    const refresh = document.getElementById('refreshMoriButton');
    if (refresh && !refresh.__rinchanMoriWorldInstalled) {
      refresh.__rinchanMoriWorldInstalled = true;
      refresh.addEventListener('click', () => setTimeout(renderAll, 900));
    }
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, renderAll, stats };
})();
window.RinchanMoriWorld = RinchanMoriWorld;
