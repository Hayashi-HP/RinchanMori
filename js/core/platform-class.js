(function(){
  try {
    var ua = navigator.userAgent || '';
    var root = document.documentElement;
    if (/Android/i.test(ua)) root.classList.add('is-android');
    if (/iPhone|iPad|iPod/i.test(ua)) root.classList.add('is-ios');
  } catch (e) {}
})();
