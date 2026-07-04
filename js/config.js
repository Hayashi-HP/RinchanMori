const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzy-Qjf_UDzA17FaUuyRIFf5oiAr-8OgSukDrjWcuNgo39xAH1k7Z4Q4zrqjPnVlRYC/exec",
  UI_VERSION: "v1.0.41"
};
window.RINCHAN_CONFIG = RINCHAN_CONFIG;

(function loadRinchanUnifiedPageSystem(){
  try {
    if (document.getElementById('rinchanUnifiedPageSystemCss')) return;
    var path = location.pathname || '';
    var prefix = path.indexOf('/pages/') >= 0 ? '../' : '';
    var link = document.createElement('link');
    link.id = 'rinchanUnifiedPageSystemCss';
    link.rel = 'stylesheet';
    link.href = prefix + 'css/v1041-page-system.css?v=1041';
    document.head.appendChild(link);
  } catch (e) {}
})();
