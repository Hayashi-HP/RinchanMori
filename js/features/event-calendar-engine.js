const RinchanEventCalendarEngine = (() => {
  const VERSION = 'v1.4.35';

  function currentEvent(date) {
    if (window.RinchanAnnualEventCatalog && typeof RinchanAnnualEventCatalog.eventForDate === 'function') {
      const event = RinchanAnnualEventCatalog.eventForDate(date || new Date());
      if (event) return event;
    }
    return { key:'normal', icon:'🌳', title:'今日の杜', text:'季節と時間に合わせて、杜の景色が少しずつ変わります。' };
  }

  function apply() {
    const event = currentEvent();
    const map = document.getElementById('moriMap');
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    const season = document.getElementById('moriSeasonMessage');
    if (map) {
      Array.from(map.classList).filter(name => name.indexOf('rinchan-event-') === 0).forEach(name => map.classList.remove(name));
      map.classList.add('rinchan-event-' + event.key);
      map.dataset.eventKey = event.key;
    }
    if (title) title.textContent = event.icon + ' ' + event.title;
    if (text) text.textContent = event.text;
    if (season && event.key !== 'normal') season.textContent = event.title + '。' + event.text;
  }

  function install() {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1200);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, apply, currentEvent };
})();
window.RinchanEventCalendarEngine = RinchanEventCalendarEngine;
