const RinchanMoonEvent = (() => {
  const VERSION = 'v1.5.16';
  let observer = null;
  let rendering = false;

  function isMoonEvent() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        const event = RinchanEventCalendarEngine.currentEvent();
        return !!event && event.key === 'moon';
      }
    } catch (e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 9;
  }

  function applyEventState(map) {
    Array.from(map.classList)
      .filter(name => name.indexOf('rinchan-event-') === 0 && name !== 'rinchan-event-moon')
      .forEach(name => map.classList.remove(name));
    map.classList.add('rinchan-event-moon');
    map.dataset.eventKey = 'moon';
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map || rendering) return;

    let layer = map.querySelector(':scope > .moon-event-layer');
    if (!isMoonEvent()) {
      if (layer) layer.remove();
      map.classList.remove('rinchan-event-moon');
      if (map.dataset.eventKey === 'moon') map.dataset.eventKey = 'normal';
      return;
    }

    rendering = true;
    try {
      applyEventState(map);
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'moon-event-layer';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML = [
          '<div class="moon-event-layer-content">',
          '<span class="moon-event-item moon-night-sky">お月見の夜空</span>',
          '<span class="moon-event-item moon-full">🌕</span>',
          '<span class="moon-event-item moon-rabbit">🐇</span>',
          '<span class="moon-event-item moon-grass g1">🌾</span>',
          '<span class="moon-event-item moon-grass g2">🌾</span>',
          '</div>'
        ].join('');
      }
      if (layer !== map.firstElementChild) map.prepend(layer);
    } finally {
      rendering = false;
    }
  }

  function watchMap() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      if (!isMoonEvent() || rendering) return;
      const layer = map.querySelector(':scope > .moon-event-layer');
      if (!layer || layer !== map.firstElementChild) requestAnimationFrame(render);
    });
    observer.observe(map, { childList: true, subtree: false });
  }

  function install() {
    render();
    watchMap();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, render, isMoonEvent };
})();
window.RinchanMoonEvent = RinchanMoonEvent;
