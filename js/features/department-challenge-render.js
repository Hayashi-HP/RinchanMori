const RinchanDepartmentChallengeRender = (() => {
  const VERSION = 'v1.3.9';
  function fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }
  function render() {
    const host = document.getElementById('departmentChallengeSection');
    if (!host) return;
    if (!window.RinchanDepartmentChallengeEngine || typeof RinchanDepartmentChallengeEngine.build !== 'function') return;
    const c = RinchanDepartmentChallengeEngine.build();
    host.className = 'department-challenge-card' + (c.available ? '' : ' is-waiting');
    host.innerHTML = '<div class="department-challenge-head"><h3 class="department-challenge-title">🌳 ' + c.title + '</h3><span class="department-challenge-pill">' + c.rate + '%</span></div><div class="department-challenge-main"><div><strong>' + fmt(c.current) + '歩</strong><small>' + c.department + '</small></div><div><strong>' + fmt(c.target) + '歩</strong><small>部署目標</small></div></div><div class="department-challenge-bar"><span style="width:' + c.rate + '%"></span></div><p class="department-challenge-note">' + c.message + '</p>';
  }
  function install() { render(); setTimeout(render, 700); setTimeout(render, 1700); }
  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanDepartmentChallengeRender = RinchanDepartmentChallengeRender;
