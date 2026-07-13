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
    link.href = (isPage ? '../' : '') + 'css/v150-mobile-foundation.css?v=153';
    link.dataset.rinchanMobileFoundation = 'v1.5.3';
    document.head.appendChild(link);
  }

  function normalizeLayout(){
    const body = document.body;
    if (!body) return;
    const nav = document.querySelector('.nav');
    if (nav && nav.parentNode !== body) body.appendChild(nav);
    if (root.classList.contains('is-android')) {
      root.style.setProperty('height','100%','important');
      root.style.setProperty('overflow','hidden','important');
      body.style.setProperty('height','100dvh','important');
      body.style.setProperty('min-height','100dvh','important');
      body.style.setProperty('overflow-y','auto','important');
      body.style.setProperty('overflow-x','hidden','important');
      body.style.setProperty('touch-action','pan-y','important');
      body.style.setProperty('-webkit-overflow-scrolling','touch','important');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeLayout);
  else normalizeLayout();
  window.addEventListener('pageshow', normalizeLayout);
})();