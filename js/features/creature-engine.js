const RinchanCreatureEngine = (() => {
  const VERSION = 'v1.0.81';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function activities() {
    const all = readJson('rinchanAllActivities', []);
    const local = readJson('rinchanActivities', []);
    return Array.isArray(all) && all.length ? all : (Array.isArray(local) ? local : []);
  }

  function thanks() {
    const sources = [readJson('rinchanThanks', []), readJson('rinchanSentThanks', []), readJson('rinchanReceivedThanks', []), readJson('rinchanGoodTimeline', [])];
    const map = {};
    sources.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        const id = String(item.thanksId || item.id || item.createdAt || JSON.stringify(item));
        if (id) map[id] = item;
      });
    });
    return Object.values(map);
  }

  function totalSteps() {
    const summary = readJson('rinchanForestSummary', null);
    if (summary && Number(summary.totalSteps || 0) > 0) return Number(summary.totalSteps || 0);
    return activities().reduce((sum, item) => sum + Number(item.steps || 0), 0);
  }

  function forestLevel() {
    const steps = totalSteps();
    const flowers = thanks().length;
    const score = steps + flowers * 2500;
    if (score >= 500000) return 5;
    if (score >= 250000) return 4;
    if (score >= 100000) return 3;
    if (score >= 30000) return 2;
    return 1;
  }

  function availableCreatures() {
    const level = forestLevel();
    const list = [];
    if (level >= 2) list.push({ icon: '🦋', name: 'ちょうちょ', className: 'butterfly' });
    if (level >= 3) list.push({ icon: '🐦', name: '小鳥', className: 'bird' });
    if (level >= 4) list.push({ icon: '🐿️', name: 'リスの仲間', className: 'squirrel' });
    if (level >= 5) list.push({ icon: '🐇', name: 'うさぎ', className: 'rabbit' });
    return list;
  }

  function injectStyles() {
    if (document.getElementById('rinchanCreatureEngineStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanCreatureEngineStyles';
    style.textContent = [
      '@keyframes rinchanCreatureFloat{0%,100%{transform:translate(0,0) rotate(-5deg)}50%{transform:translate(14px,-14px) rotate(7deg)}}',
      '@keyframes rinchanCreatureHop{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.04)}70%{transform:translateY(2px) scale(.99)}}',
      '@keyframes rinchanCreatureWalk{0%,100%{transform:translateX(0)}50%{transform:translateX(22px)}}',
      '.rinchan-creature-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4}',
      '.rinchan-creature{position:absolute;font-size:24px;filter:drop-shadow(0 8px 10px rgba(70,100,75,.12));opacity:.92;pointer-events:auto;cursor:pointer}',
      '.rinchan-creature.butterfly{animation:rinchanCreatureFloat 5.8s ease-in-out infinite}',
      '.rinchan-creature.bird{animation:rinchanCreatureFloat 7.2s ease-in-out infinite}',
      '.rinchan-creature.squirrel{animation:rinchanCreatureWalk 4.8s ease-in-out infinite}',
      '.rinchan-creature.rabbit{animation:rinchanCreatureHop 3.8s ease-in-out infinite}',
      '@media (prefers-reduced-motion:reduce){.rinchan-creature{animation:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function targetWorlds() {
    return Array.from(document.querySelectorAll('.tree-world,.growth-world,.mori-game-map')).filter(Boolean);
  }

  function ensureLayer(world) {
    if (getComputedStyle(world).position === 'static') world.style.position = 'relative';
    let layer = world.querySelector('.rinchan-creature-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'rinchan-creature-layer';
      world.appendChild(layer);
    }
    return layer;
  }

  function creatureMessage(creature) {
    if (creature.className === 'butterfly') return 'ちょうちょが\n花の香りに誘われてきたよ🦋';
    if (creature.className === 'bird') return '小鳥が\n枝でひとやすみしているよ🐦';
    if (creature.className === 'squirrel') return 'リスの仲間が\n遊びに来たみたい🐿️';
    return 'うさぎが\n杜をおさんぽしているよ🐇';
  }

  function renderWorld(world, index) {
    const layer = ensureLayer(world);
    layer.innerHTML = '';
    const creatures = availableCreatures();
    creatures.forEach((creature, i) => {
      const el = document.createElement('span');
      el.className = 'rinchan-creature ' + creature.className;
      el.textContent = creature.icon;
      el.title = creature.name;
      el.style.left = (12 + ((i * 23 + index * 11) % 70)) + '%';
      el.style.top = (14 + ((i * 17 + index * 9) % 62)) + '%';
      el.style.animationDelay = ((i + index) * .22) + 's';
      el.addEventListener('click', event => {
        event.stopPropagation();
        if (window.RinchanModal && typeof RinchanModal.show === 'function') {
          RinchanModal.show({ speech: creatureMessage(creature), note: '杜レベル ' + forestLevel() + ' で出会える生き物です。', primaryText: 'かわいいね♪', hideClose: true });
        }
      });
      layer.appendChild(el);
    });
  }

  function renderAll() {
    injectStyles();
    targetWorlds().forEach(renderWorld);
  }

  function install() {
    renderAll();
    setTimeout(renderAll, 500);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, renderAll, forestLevel, availableCreatures };
})();
window.RinchanCreatureEngine = RinchanCreatureEngine;
