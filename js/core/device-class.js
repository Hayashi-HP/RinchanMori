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
    link.href = (isPage ? '../' : '') + 'css/v150-mobile-foundation.css?v=150';
    link.dataset.rinchanMobileFoundation = 'v1.5.0';
    document.head.appendChild(link);
  }
})();