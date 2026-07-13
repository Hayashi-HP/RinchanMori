(function(){
  const ua = navigator.userAgent || '';
  const root = document.documentElement;
  if (/Android/i.test(ua)) root.classList.add('is-android');
  if (/iPhone|iPad|iPod/i.test(ua)) root.classList.add('is-ios');

  if (!document.querySelector('link[data-rinchan-mobile-foundation]')) {
    const script = document.currentScript;
    const isPage = script && /\/pages\//.test(script.src || '');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = (isPage ? '../' : '') + 'css/v150-mobile-foundation.css?v=155';
    link.dataset.rinchanMobileFoundation = 'v1.5.5';
    document.head.appendChild(link);
  }

  function normalizeLayout(){
    const body = document.body;
    const app = document.querySelector('main.app');
    const nav = document.querySelector('.nav');
    const header = app && app.querySelector(':scope > .top');
    if (!body || !app) return;

    root.style.setProperty('height','auto','important');
    root.style.setProperty('min-height','100%','important');
    root.style.setProperty('overflow-x','hidden','important');
    root.style.setProperty('overflow-y','auto','important');

    body.style.setProperty('position','relative','important');
    body.style.setProperty('height','auto','important');
    body.style.setProperty('min-height','100vh','important');
    body.style.setProperty('overflow-x','hidden','important');
    body.style.setProperty('overflow-y','auto','important');
    body.style.setProperty('touch-action','pan-y','important');
    body.style.setProperty('-webkit-overflow-scrolling','touch','important');

    app.style.setProperty('height','auto','important');
    app.style.setProperty('min-height','100vh','important');
    app.style.setProperty('overflow','visible','important');

    if (nav && header && nav.previousElementSibling !== header) {
      header.insertAdjacentElement('afterend', nav);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeLayout);
  else normalizeLayout();
  window.addEventListener('pageshow', normalizeLayout);
  window.addEventListener('load', normalizeLayout);
})();
