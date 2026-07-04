const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzy-Qjf_UDzA17FaUuyRIFf5oiAr-8OgSukDrjWcuNgo39xAH1k7Z4Q4zrqjPnVlRYC/exec",
  UI_VERSION: "v1.0.44"
};
window.RINCHAN_CONFIG = RINCHAN_CONFIG;

(function loadRinchanUnifiedPageSystem(){
  try {
    var path = location.pathname || '';
    var prefix = path.indexOf('/pages/') >= 0 ? '../' : '';
    function addCss(id, href) {
      if (document.getElementById(id)) return;
      var link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
    addCss('rinchanUnifiedPageSystemCss', prefix + 'css/v1041-page-system.css?v=1044');
    addCss('rinchanSoftInnerPanelsCss', prefix + 'css/v1042-soft-inner-panels.css?v=1044');
    addCss('rinchanMypageTuneCss', prefix + 'css/v1043-mypage-tune.css?v=1044');
    addCss('rinchanMypageCompactCss', prefix + 'css/v1044-mypage-compact.css?v=1044');
  } catch (e) {}
})();
