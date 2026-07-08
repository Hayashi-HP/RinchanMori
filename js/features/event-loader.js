const RinchanEventLoader = (() => {
  const VERSION = 'v1.2.8';
  const LOADED = { css: new Set(), js: new Set() };
  const EVENTS = {
    tanabata: {
      css: '../css/v125-tanabata.css?v=128',
      js: '../js/features/tanabata-event.js?v=128',
      global: 'RinchanTanabataEvent'
    },
    summer: {
      css: '../css/v126-summer-festival.css?v=128',
      js: '../js/features/summer-festival-event.js?v=128',
      global: 'RinchanSummerFestivalEvent'
    },
    halloween: {
      css: '../css/v127-halloween.css?v=128',
      js: '../js/features/halloween-event.js?v=128',
      global: 'RinchanHalloweenEvent'
    }
  };

  function eventKey() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent().key || 'normal';
      }
    } catch(e) {}
    return 'normal';
  }

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
    const key = eventKey();
    const config = EVENTS[key];
    if (!config) return key;
    await loadCss(config.css);
    await loadJs(config.js);
    installEvent(config);
    setTimeout(() => installEvent(config), 300);
    setTimeout(() => installEvent(config), 1200);
    return key;
  }

  function install() {
    apply();
    setTimeout(apply, 500);
    setTimeout(apply, 1500);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, EVENTS, install, apply, eventKey };
})();
window.RinchanEventLoader = RinchanEventLoader;
