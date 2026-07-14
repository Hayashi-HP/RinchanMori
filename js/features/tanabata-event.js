const RinchanTanabataEvent = (() => {
  const VERSION = 'v1.5.13';
  let observer = null;
  let rendering = false;

  function isTanabata() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        const event = RinchanEventCalendarEngine.currentEvent();
        return !!event && event.key === 'tanabata';
      }
    } catch (e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 7;
  }

  function applyEventState(map) {
    Array.from(map.classList)
      .filter(name => name.indexOf('rinchan-event-') === 0 && name !== 'rinchan-event-tanabata')
      .forEach(name => map.classList.remove(name));
    map.classList.add('rinchan-event-tanabata');
    map.dataset.eventKey = 'tanabata';
  }

  function hideBaseDecorations(map) {
    map.querySelectorAll('.mori-world-flower, .mori-world-friend, .mori-world-bird').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('animation', 'none', 'important');
    });
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map || rendering) return;

    let layer = map.querySelector(':scope > .tanabata-layer');
    if (!isTanabata()) {
      if (layer) layer.remove();
      map.classList.remove('rinchan-event-tanabata');
      if (map.dataset.eventKey === 'tanabata') map.dataset.eventKey = 'normal';
      return;
    }

    rendering = true;
    try {
      applyEventState(map);
      hideBaseDecorations(map);
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'tanabata-layer';
        map.prepend(layer);
      }
      if (!layer.querySelector('.tanabata-layer-content')) {
        layer.innerHTML = [
          '<div class="tanabata-layer-content" aria-hidden="true">',
          '<span class="tanabata-milkyway"></span>',
          '<span class="tanabata-item tanabata-star st1">✦</span>',
          '<span class="tanabata-item tanabata-star st2">✦</span>',
          '<span class="tanabata-item tanabata-star st3">✦</span>',
          '<span class="tanabata-item tanabata-bamboo">🎋</span>',
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
      if (!isTanabata() || rendering) return;
      const layer = map.querySelector(':scope > .tanabata-layer');
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

  return { VERSION, install, render, isTanabata };
})();
window.RinchanTanabataEvent = RinchanTanabataEvent;
