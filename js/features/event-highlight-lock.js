const RinchanEventHighlightLock = (() => {
  const VERSION = 'v1.4.37';

  function currentEvent() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        const event = RinchanEventCalendarEngine.currentEvent();
        if (event && event.key && event.key !== 'normal') return event;
      }
    } catch (e) {}
    try {
      if (window.RinchanAnnualEventCatalog && typeof RinchanAnnualEventCatalog.eventForDate === 'function') {
        const event = RinchanAnnualEventCatalog.eventForDate(new Date());
        if (event && event.key && event.key !== 'normal') return event;
      }
    } catch (e) {}
    return null;
  }

  function apply() {
    const event = currentEvent();
    if (!event) return;
    const map = document.getElementById('moriMap');
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    const season = document.getElementById('moriSeasonMessage');
    if (map) {
      Array.from(map.classList).filter(name => name.indexOf('rinchan-event-') === 0).forEach(name => map.classList.remove(name));
      map.classList.add('rinchan-event-' + event.key);
      map.dataset.eventKey = event.key;
    }
    if (title) title.textContent = (event.icon || '🌳') + ' ' + (event.title || '今日のイベント');
    if (text) text.textContent = event.text || '今日の杜のイベントを表示しています。';
    if (season) season.textContent = (event.title || '今日のイベント') + '。' + (event.text || '');
  }

  function install() {
    apply();
    setTimeout(apply, 0);
    setTimeout(apply, 200);
    setTimeout(apply, 700);
    setTimeout(apply, 1500);
    setTimeout(apply, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, apply };
})();
window.RinchanEventHighlightLock = RinchanEventHighlightLock;
