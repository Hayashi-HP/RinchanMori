const RinchanCreatureEngineV122 = (() => {
  const VERSION = 'v1.2.3';
  const WORDS = {
    butterfly: ['ちょうちょが遊びに来たよ♪','花の近くをひらひら飛んでいるよ♪','今日はちょうちょ日和だね🦋'],
    bird: ['小鳥が気持ちよさそうに歌っているね♪','枝の上で小鳥が休んでいるよ♪','杜に小鳥の声が聞こえるよ🐦'],
    rabbit: ['うさぎが顔を出したよ♪','草むらからうさぎがのぞいているよ♪','うさぎがぴょんと遊びに来たよ🐰'],
    squirrel: ['りすが木のそばを走っているよ♪','りすが実を探しているみたい♪','木の根元でりすを見つけたよ🐿️'],
    firefly: ['夜の杜にホタルが光っているよ✨','ホタルが静かに光っているね✨','夜だけの小さな光を見つけたよ✨']
  };

  function timeKey() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  function seedValue() {
    const d = new Date();
    const base = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    let n = 0;
    for (let i = 0; i < base.length; i += 1) n = (n * 31 + base.charCodeAt(i)) % 9973;
    return n;
  }

  function pickDailyCreatures() {
    const t = timeKey();
    const seed = seedValue();
    const daytime = ['butterfly','bird','rabbit','squirrel'];
    const evening = ['butterfly','bird','squirrel'];
    const night = ['firefly','bird','rabbit'];
    const pool = t === 'night' ? night : (t === 'evening' ? evening : daytime);
    const count = t === 'night' ? 2 : 3;
    const result = [];
    for (let i = 0; i < pool.length && result.length < count; i += 1) {
      const index = (seed + i * 2) % pool.length;
      const key = pool[index];
      if (!result.includes(key)) result.push(key);
    }
    if (t === 'night' && !result.includes('firefly')) result.unshift('firefly');
    return result.slice(0, count);
  }

  function emoji(key) {
    return { butterfly:'🦋', bird:'🐦', rabbit:'🐰', squirrel:'🐿️', firefly:'✨' }[key] || '🌿';
  }

  function label(key) {
    return { butterfly:'ちょうちょ', bird:'小鳥', rabbit:'うさぎ', squirrel:'りす', firefly:'ホタル' }[key] || '杜の仲間';
  }

  function creatureHtml() {
    return pickDailyCreatures().map(key => '<button type="button" class="mori-creature mori-creature-' + key + '" data-creature="' + key + '" aria-label="' + label(key) + '">' + emoji(key) + '</button>').join('');
  }

  function ensureLayer(map) {
    let layer = map.querySelector('.mori-creature-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'mori-creature-layer';
      map.appendChild(layer);
    }
    layer.innerHTML = creatureHtml();
    layer.querySelectorAll('.mori-creature').forEach(btn => {
      btn.addEventListener('click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        showMessage(map, pickWord(this.dataset.creature));
      });
    });
  }

  function pickWord(key) {
    const list = WORDS[key] || ['杜の仲間を見つけたよ♪'];
    const index = (seedValue() + String(key || '').length) % list.length;
    return list[index];
  }

  function showMessage(map, text) {
    const old = map.querySelector('.mori-creature-message');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const msg = document.createElement('div');
    msg.className = 'mori-creature-message';
    msg.textContent = text;
    map.appendChild(msg);
    setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2300);
    try {
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({ speech: text, primaryText: '見つけた♪', hideClose: true });
      }
    } catch(e) {}
  }

  function apply() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    ensureLayer(map);
  }

  function install() {
    apply();
    setTimeout(apply, 400);
    setTimeout(apply, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, apply };
})();
window.RinchanCreatureEngineV122 = RinchanCreatureEngineV122;
