const RinchanMoriWorldEngine = (() => {
  const VERSION = 'v1.2.0';

  function seasonKey(date) {
    const m = (date || new Date()).getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  function timeKey(date) {
    const h = (date || new Date()).getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  function ensureSky(map) {
    let sky = map.querySelector('.mori-world-sky');
    if (sky) return sky;
    sky = document.createElement('div');
    sky.className = 'mori-world-sky';
    sky.innerHTML = '<span class="mori-cloud c1"></span><span class="mori-cloud c2"></span><span class="mori-leaf l1">🍃</span><span class="mori-leaf l2">🍃</span><span class="mori-leaf l3">🍂</span><span class="mori-star s1">✨</span><span class="mori-star s2">✦</span><span class="mori-star s3">✨</span>';
    map.prepend(sky);
    return sky;
  }

  function apply() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const now = new Date();
    const t = timeKey(now);
    const s = seasonKey(now);
    map.classList.remove('rinchan-time-morning','rinchan-time-day','rinchan-time-evening','rinchan-time-night','rinchan-season-spring','rinchan-season-summer','rinchan-season-autumn','rinchan-season-winter');
    map.classList.add('rinchan-time-' + t, 'rinchan-season-' + s);
    const sky = ensureSky(map);
    if (sky) sky.style.display = '';
    const stars = map.querySelectorAll('.mori-star');
    stars.forEach(el => { el.style.display = t === 'night' ? 'block' : 'none'; });
    const autumnLeaf = map.querySelector('.mori-leaf.l3');
    if (autumnLeaf) autumnLeaf.textContent = s === 'autumn' ? '🍂' : (s === 'spring' ? '🌸' : (s === 'winter' ? '❄️' : '🍃'));
  }

  function install() {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1200);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, apply };
})();
window.RinchanMoriWorldEngine = RinchanMoriWorldEngine;
