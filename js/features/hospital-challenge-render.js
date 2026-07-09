const RinchanHospitalChallengeRender = (() => {
  const VERSION = 'v1.4.1';

  function fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }

  function render() {
    const host = document.getElementById('hospitalChallengeSection');
    if (!host) return;
    if (!window.RinchanHospitalChallengeEngine || typeof RinchanHospitalChallengeEngine.build !== 'function') return;
    const c = RinchanHospitalChallengeEngine.build();
    host.className = 'monthly-challenge-card hospital-challenge-card' + (c.achieved ? ' is-achieved' : '') + (c.available ? '' : ' is-pending');
    const currentText = c.available ? fmt(c.current) + '歩' : '準備中';
    const targetText = fmt(c.target) + '歩';
    host.innerHTML = '<div class="monthly-challenge-head"><h3 class="monthly-challenge-title">' + c.title + '</h3><span class="monthly-challenge-pill">' + (c.available ? c.rate + '%' : '準備中') + '</span></div><div class="monthly-challenge-main"><div><strong>' + currentText + '</strong><small>病院全体の今月歩数</small></div><div><strong>' + targetText + '</strong><small>目標</small></div></div><div class="monthly-challenge-bar"><span style="width:' + (c.available ? c.rate : 0) + '%"></span></div><p class="monthly-challenge-note">' + c.message + '</p>';
  }

  function install() {
    render();
    setTimeout(render, 700);
    setTimeout(render, 1800);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanHospitalChallengeRender = RinchanHospitalChallengeRender;
