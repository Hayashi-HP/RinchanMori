const RinchanEventCalendarEngine = (() => {
  const VERSION = 'v1.4.37';
  let observerInstalled = false;
  let applying = false;

  function currentEvent(date) {
    if (window.RinchanAnnualEventCatalog && typeof RinchanAnnualEventCatalog.eventForDate === 'function') {
      const event = RinchanAnnualEventCatalog.eventForDate(date || new Date());
      if (event) return event;
    }
    return { key:'normal', icon:'🌳', title:'今日の杜', text:'季節と時間に合わせて、杜の景色が少しずつ変わります。' };
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
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

      if (title) {
        title.dataset.eventLocked = event.key !== 'normal' ? '1' : '0';
        title.textContent = event.icon + ' ' + event.title;
      }
      if (text) {
        text.dataset.eventLocked = event.key !== 'normal' ? '1' : '0';
        text.textContent = event.text;
      }
      if (season && event.key !== 'normal') season.textContent = event.title + '。' + event.text;
    } finally {
      applying = false;
    }
  }

  function installObserver() {
    if (observerInstalled || typeof MutationObserver === 'undefined') return;
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    if (!title && !text) return;
    observerInstalled = true;
    const observer = new MutationObserver(() => {
      const event = currentEvent();
      if (!event || event.key === 'normal') return;
      const expectedTitle = event.icon + ' ' + event.title;
      const expectedText = event.text;
      const t = document.getElementById('moriHighlightTitle');
      const p = document.getElementById('moriHighlightText');
      if ((t && t.textContent !== expectedTitle) || (p && p.textContent !== expectedText)) {
        setTimeout(apply, 0);
      }
    });
    if (title) observer.observe(title, { childList:true, characterData:true, subtree:true });
    if (text) observer.observe(text, { childList:true, characterData:true, subtree:true });
  }

  function install() {
    apply();
    installObserver();
    setTimeout(apply, 300);
    setTimeout(apply, 1200);
    setTimeout(apply, 2600);
    setTimeout(apply, 5000);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, apply, currentEvent };
})();
window.RinchanEventCalendarEngine = RinchanEventCalendarEngine;
