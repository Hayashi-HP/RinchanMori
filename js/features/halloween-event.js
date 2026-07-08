const RinchanHalloweenEvent = (() => {
  const VERSION = 'v1.2.7';

  function isHalloween() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent().key === 'halloween';
      }
    } catch(e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 10 && d.getDate() >= 20;
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const old = map.querySelector('.halloween-layer');
    if (!isHalloween()) {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    if (old) return;
    const layer = document.createElement('div');
    layer.className = 'halloween-layer';
    layer.innerHTML = '<span class="halloween-item halloween-pumpkin">🎃</span><span class="halloween-item halloween-ghost">👻</span><span class="halloween-item halloween-bat b1">🦇</span><span class="halloween-item halloween-bat b2">🦇</span><span class="halloween-item halloween-light l1">✨</span><span class="halloween-item halloween-light l2">✦</span>';
    map.appendChild(layer);
  }

  function install() {
    render();
    setTimeout(render, 400);
    setTimeout(render, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render, isHalloween };
})();
window.RinchanHalloweenEvent = RinchanHalloweenEvent;
