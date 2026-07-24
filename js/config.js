const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbxvL3R5rSqg2a56ao60w5hA4_CjY77unYKPptCjhEjyLXkmQB8-PjVKxkeKAoPizjVE/exec",
  UI_VERSION: "v1.6.1"
};
window.RINCHAN_CONFIG = RINCHAN_CONFIG;

(function loadRinchanStateStability(){
  try {
    var path = location.pathname || '';
    var prefix = path.indexOf('/pages/') >= 0 ? '../' : '';
    function addScript(id, src) {
      if (document.getElementById(id)) return;
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.defer = true;
      document.head.appendChild(script);
    }
    var needsStateStability = path.indexOf('/pages/') < 0 ||
      /(?:^|\/)pages\/(?:activity|mori|news|mypage|register|thanks)\.html$/.test(path);
    if (needsStateStability) {
      addScript('rinchanStateStabilityJs', prefix + 'js/v1054-state-stability.js?v=1057');
    }
  } catch (e) {}
})();
