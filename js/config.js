const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzy-Qjf_UDzA17FaUuyRIFf5oiAr-8OgSukDrjWcuNgo39xAH1k7Z4Q4zrqjPnVlRYC/exec",
  UI_VERSION: "v1.0.53"
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
    addCss('rinchanUnifiedPageSystemCss', prefix + 'css/v1041-page-system.css?v=1053');
    addCss('rinchanSoftInnerPanelsCss', prefix + 'css/v1042-soft-inner-panels.css?v=1053');
    addCss('rinchanMypageTuneCss', prefix + 'css/v1043-mypage-tune.css?v=1053');
    addCss('rinchanMypageCompactCss', prefix + 'css/v1044-mypage-compact.css?v=1053');
    addCss('rinchanHeaderFlushCss', prefix + 'css/v1045-header-flush.css?v=1053');
    addCss('rinchanHomeButtonFooterCss', prefix + 'css/v1046-home-button-footer.css?v=1053');
    addCss('rinchanBalanceFixesCss', prefix + 'css/v1047-balance-fixes.css?v=1053');
    addCss('rinchanLayoutFinalizeCss', prefix + 'css/v1049-layout-finalize.css?v=1053');
    addCss('rinchanEmptyThanksCss', prefix + 'css/v1050-empty-thanks.css?v=1053');
    addCss('rinchanFormNewsCss', prefix + 'css/v1051-form-news.css?v=1053');
    addCss('rinchanMapFooterCss', prefix + 'css/v1051-map-footer.css?v=1053');
    addCss('rinchanCircleMapCss', prefix + 'css/v1052-circle-map.css?v=1053');
    addCss('rinchanMoriMapBalanceCss', prefix + 'css/v1053-mori-map-balance.css?v=1053');
  } catch (e) {}
})();
