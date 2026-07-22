(function(){
  const ua = navigator.userAgent || '';
  const root = document.documentElement;
  const pathName = (window.location && window.location.pathname) || '';
  const isHome = !pathName.includes('/pages/') && (/(?:^|\/)index\.html$/.test(pathName) || /\/$/.test(pathName));
  const isActivity = /(?:^|\/)pages\/activity\.html$/.test(pathName);
  const isMori = /(?:^|\/)pages\/mori\.html$/.test(pathName);
  const isModernPage = isHome || isActivity || isMori;
  if (/Android/i.test(ua)) root.classList.add('is-android');
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) root.classList.add('is-ios');
  if (/Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) || Math.min(screen.width || 9999, screen.height || 9999) <= 899) root.classList.add('is-mobile-device');

  if (!isModernPage && !document.querySelector('link[data-rinchan-mobile-foundation]')) {
    const isPage = pathName.includes('/pages/');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = (isPage ? '../' : '') + 'css/v150-mobile-foundation.css?v=191';
    link.dataset.rinchanMobileFoundation = 'v1.5.12';
    document.head.appendChild(link);
  }

  function normalizeLayout(){
    if (isModernPage) return;
    const body = document.body;
    const app = document.querySelector('main.app');
    const nav = document.querySelector('.nav');
    const header = app && app.querySelector(':scope > .top');
    if (!body || !app) return;

    root.style.setProperty('height','100%','important');
    root.style.setProperty('min-height','100%','important');
    root.style.setProperty('overflow-x','hidden','important');
    root.style.setProperty('overflow-y','hidden','important');

    body.style.setProperty('position','relative','important');
    body.style.setProperty('height','100%','important');
    body.style.setProperty('min-height','100%','important');
    body.style.setProperty('overflow-x','hidden','important');
    body.style.setProperty('overflow-y','hidden','important');
    body.style.setProperty('touch-action','pan-y','important');
    body.style.setProperty('-webkit-overflow-scrolling','touch','important');

    app.style.setProperty('height','100%','important');
    app.style.setProperty('min-height','100%','important');
    app.style.setProperty('overflow-x','hidden','important');
    app.style.setProperty('overflow-y','auto','important');
    app.style.setProperty('overscroll-behavior-y','contain','important');
    app.style.setProperty('-webkit-overflow-scrolling','touch','important');
    app.style.setProperty('padding-bottom','calc(112px + env(safe-area-inset-bottom, 0px))','important');

    if (nav) {
      nav.style.setProperty('position','fixed','important');
      nav.style.setProperty('left','50%','important');
      nav.style.setProperty('bottom','calc(12px + env(safe-area-inset-bottom, 0px))','important');
      nav.style.setProperty('transform','translateX(-50%)','important');
      nav.style.setProperty('width','min(430px, calc(100% - 24px))','important');
      nav.style.setProperty('max-width','430px','important');
      nav.style.setProperty('height','84px','important');
      nav.style.setProperty('z-index','1000','important');
      nav.style.setProperty('box-sizing','border-box','important');
    }

    if (header) {
      header.style.setProperty('position','sticky','important');
      header.style.setProperty('top','0','important');
      header.style.setProperty('z-index','40','important');
    }

    if (nav && header && nav.previousElementSibling !== header) {
      header.insertAdjacentElement('afterend', nav);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeLayout);
  else normalizeLayout();
  window.addEventListener('pageshow', normalizeLayout);
  window.addEventListener('load', normalizeLayout);
})();
