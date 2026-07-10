const RinchanDepartmentChallengeRender = (() => {
  const VERSION = 'v1.4.31';

  function fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }

  function applyCardLayout(host) {
    if (!host || !host.style) return;
    host.style.setProperty('margin', '0 16px 14px', 'important');
    host.style.setProperty('padding', '20px', 'important');
    host.style.setProperty('box-sizing', 'border-box', 'important');
  }

  function render() {
    const host = document.getElementById('departmentChallengeSection');
    if (!host) return;
    if (!window.RinchanDepartmentChallengeEngine || typeof RinchanDepartmentChallengeEngine.build !== 'function') return;
    const c = RinchanDepartmentChallengeEngine.build();
    const dept = c.department || '所属部署';
    host.className = 'card department-challenge-card' + (c.available ? '' : ' is-waiting');
    applyCardLayout(host);
    host.innerHTML = '' +
      '<div class="department-challenge-head"><div><h3 class="department-challenge-title">🌳 ' + c.title + '</h3><p class="department-challenge-scope">部署チャレンジ｜今月</p></div><span class="department-challenge-pill">' + c.rate + '%</span></div>' +
      '<div class="department-challenge-main"><div><strong>' + fmt(c.current) + '歩</strong><small>' + dept + '全体の今月歩数</small></div><div><strong>' + fmt(c.target) + '歩</strong><small>部署目標</small></div></div>' +
      '<div class="department-challenge-bar"><span style="width:' + c.rate + '%"></span></div>' +
      '<p class="department-challenge-note">' + c.message + '</p>';
  }

  function install() { render(); setTimeout(render, 300); setTimeout(render, 900); setTimeout(render, 1800); }
  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanDepartmentChallengeRender = RinchanDepartmentChallengeRender;
