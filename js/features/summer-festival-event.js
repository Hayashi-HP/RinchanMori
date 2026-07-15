const RinchanSummerFestivalEvent = (() => {
  const VERSION = 'v1.2.7';
  let observer = null;
  let rendering = false;

  function isSummerFestival() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        const event = RinchanEventCalendarEngine.currentEvent();
        return !!event && event.key === 'summer';
      }
    } catch(e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 8;
  }

  function applyEventState(map) {
    Array.from(map.classList)
      .filter(name => name.indexOf('rinchan-event-') === 0 && name !== 'rinchan-event-summer')
      .forEach(name => map.classList.remove(name));
    map.classList.add('rinchan-event-summer');
    map.dataset.eventKey = 'summer';
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map || rendering) return;

    let layer = map.querySelector(':scope > .summer-festival-layer');
    if (!isSummerFestival()) {
      if (layer) layer.remove();
      map.classList.remove('rinchan-event-summer');
      if (map.dataset.eventKey === 'summer') map.dataset.eventKey = 'normal';
      return;
    }

    rendering = true;
    try {
      applyEventState(map);
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'summer-festival-layer';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML = [
          '<div class="summer-festival-layer-content">',
          '<span class="summer-festival-item summer-sky">夏祭りの夜空</span>',
          '<span class="summer-festival-item summer-lantern l1">🏮</span>',
          '<span class="summer-festival-item summer-lantern l2">🏮</span>',
          '<span class="summer-festival-item summer-firework f1">✦</span>',
          '<span class="summer-festival-item summer-firework f2">✦</span>',
          '<span class="summer-festival-item summer-firework f3">✦</span>',
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
      if (!isSummerFestival() || rendering) return;
      const layer = map.querySelector(':scope > .summer-festival-layer');
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
  return { VERSION, install, render, isSummerFestival };
})();
window.RinchanSummerFestivalEvent = RinchanSummerFestivalEvent;
