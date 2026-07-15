const RinchanEventLoader = (() => {
  const VERSION = 'v1.5.14';
  const LOADED = { css: new Set(), js: new Set() };

  const FALLBACK_EVENTS = {
    tanabata: {
      css: '../css/v125-tanabata.css?v=192',
      js: '../js/features/tanabata-event.js?v=192',
      global: 'RinchanTanabataEvent'
    },
    summer: {
      css: '../css/v126-summer-festival.css?v=193',
      js: '../js/features/summer-festival-event.js?v=193',
      global: 'RinchanSummerFestivalEvent'
    },
    halloween: {
      css: '../css/v127-halloween.css?v=135',
      js: '../js/features/halloween-event.js?v=135',
      global: 'RinchanHalloweenEvent'
    },
    birthday: {
      css: '../css/v130-birthday.css?v=135',
      js: '../js/features/birthday-event.js?v=135',
      global: 'RinchanBirthdayEvent'
    }
  };

  function currentParticipant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null'); } catch(e) { return null; }
  }

  function birthdayValue(p) {
    if (!p) return '';
    return p.birthdate || p.birthday || p.birthDate || p.dateOfBirth || p.dob || '';
  }

  function parseMonthDay(value) {
    const s = String(value || '').trim();
    if (!s) return null;
    const m = s.match(/(?:\d{4}[\/-])?(\d{1,2})[\/-月](\d{1,2})/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
  }

  function isBirthdayToday() {
    const md = parseMonthDay(birthdayValue(currentParticipant()));
    if (!md) return false;
    const d = new Date();
    return md.month === d.getMonth() + 1 && md.day === d.getDate();
  }

  function currentEvent() {
    if (isBirthdayToday()) return { key: 'birthday', module: FALLBACK_EVENTS.birthday };
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent() || { key: 'normal' };
      }
    } catch(e) {}
    return { key: 'normal' };
  }

  function eventKey() { return currentEvent().key || 'normal'; }
  function moduleConfig(event) { return event && event.module ? event.module : (FALLBACK_EVENTS[event && event.key ? event.key : 'normal'] || null); }

  function loadCss(href) {
    if (!href || LOADED.css.has(href)) return Promise.resolve();
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.getAttribute('href') === href)) {
      LOADED.css.add(href);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => { LOADED.css.add(href); resolve(); };
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }

  function loadJs(src) {
    if (!src || LOADED.js.has(src)) return Promise.resolve();
    if ([...document.querySelectorAll('script[src]')].some(script => script.getAttribute('src') === src)) {
      LOADED.js.add(src);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => { LOADED.js.add(src); resolve(); };
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  }

  function installEvent(config) {
    const mod = config && config.global ? window[config.global] : null;
    if (mod && typeof mod.install === 'function') mod.install();
  }

  async function apply() {
    const event = currentEvent();
    const config = moduleConfig(event);
    if (!config) return event.key || 'normal';
    await loadCss(config.css);
    await loadJs(config.js);
    installEvent(config);
    setTimeout(() => installEvent(config), 300);
    setTimeout(() => installEvent(config), 1200);
    return event.key || 'normal';
  }

  function install() {
    apply();
    setTimeout(apply, 500);
    setTimeout(apply, 1500);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, FALLBACK_EVENTS, install, apply, eventKey, currentEvent, isBirthdayToday };
})();
window.RinchanEventLoader = RinchanEventLoader;