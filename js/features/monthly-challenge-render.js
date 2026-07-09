const RinchanMonthlyChallengeRender = (() => {
  const VERSION = 'v1.3.7';

  function fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }

  function render() {
    const host = document.getElementById('monthlyChallengeSection');
    if (!host) return;
    if (!window.RinchanMonthlyChallengeEngine || typeof RinchanMonthlyChallengeEngine.build !== 'function') return;
    const c = RinchanMonthlyChallengeEngine.build();
    host.className = 'monthly-challenge-card' + (c.achieved ? ' is-achieved' : '');
    host.innerHTML = '<div class="monthly-challenge-head"><h3 class="monthly-challenge-title">👟 ' + c.title + '</h3><span class="monthly-challenge-pill">' + c.rate + '%</span></div><div class="monthly-challenge-main"><div><strong>' + fmt(c.current) + '歩</strong><small>今月の歩数</small></div><div><strong>' + fmt(c.target) + '歩</strong><small>目標</small></div></div><div class="monthly-challenge-bar"><span style="width:' + c.rate + '%"></span></div><p class="monthly-challenge-note">' + c.message + ' 残り' + c.daysLeft + '日。</p>';
  }

  function install() {
    render();
    setTimeout(render, 600);
    setTimeout(render, 1600);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanMonthlyChallengeRender = RinchanMonthlyChallengeRender;
