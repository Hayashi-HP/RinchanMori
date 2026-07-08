const RinchanSummerFestivalEvent = (() => {
  const VERSION = 'v1.2.6';

  function isSummerFestival() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent().key === 'summer';
      }
    } catch(e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 8;
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const old = map.querySelector('.summer-festival-layer');
    if (!isSummerFestival()) {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    if (old) return;
    const layer = document.createElement('div');
    layer.className = 'summer-festival-layer';
    layer.innerHTML = '<span class="summer-festival-item summer-lantern l1">🏮</span><span class="summer-festival-item summer-lantern l2">🏮</span><span class="summer-festival-item summer-lantern l3">🏮</span><span class="summer-festival-item summer-firework f1">🎆</span><span class="summer-festival-item summer-firework f2">✨</span><span class="summer-festival-item summer-firework f3">🎇</span><span class="summer-festival-item summer-goldfish">🐟</span><span class="summer-festival-item summer-yoyo">🪀</span>';
    map.appendChild(layer);
  }

  function install() {
    render();
    setTimeout(render, 400);
    setTimeout(render, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render, isSummerFestival };
})();
window.RinchanSummerFestivalEvent = RinchanSummerFestivalEvent;
