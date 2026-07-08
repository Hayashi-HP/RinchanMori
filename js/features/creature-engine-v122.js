const RinchanCreatureEngineV122 = (() => {
  const VERSION = 'v1.2.2';
  const WORDS = {
    butterfly: 'ちょうちょが遊びに来たよ♪',
    bird: '小鳥が気持ちよさそうに歌っているね♪',
    rabbit: 'うさぎが顔を出したよ♪',
    squirrel: 'りすが木のそばを走っているよ♪',
    firefly: '夜の杜にホタルが光っているよ✨'
  };

  function timeKey() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  function creatureHtml() {
    const night = timeKey() === 'night';
    return [
      '<button type="button" class="mori-creature mori-creature-butterfly" data-creature="butterfly" aria-label="ちょうちょ">🦋</button>',
      '<button type="button" class="mori-creature mori-creature-bird" data-creature="bird" aria-label="小鳥">🐦</button>',
      '<button type="button" class="mori-creature mori-creature-rabbit" data-creature="rabbit" aria-label="うさぎ">🐰</button>',
      '<button type="button" class="mori-creature mori-creature-squirrel" data-creature="squirrel" aria-label="りす">🐿️</button>',
      night ? '<button type="button" class="mori-creature mori-creature-firefly" data-creature="firefly" aria-label="ホタル">✨</button>' : ''
    ].join('');
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
        showMessage(map, WORDS[this.dataset.creature] || '杜の仲間を見つけたよ♪');
      });
    });
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
