const RinchanHospitalChallengeRender = (() => {
  const VERSION = 'v1.4.33';

  function fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }
  function esc(value) { return String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }

  function applyCardLayout(host) {
    if (!host || !host.style) return;
    host.style.setProperty('margin', '0', 'important');
    host.style.setProperty('padding', '20px', 'important');
    host.style.setProperty('box-sizing', 'border-box', 'important');
  }

  function render() {
    const host = document.getElementById('hospitalChallengeSection');
    if (!host) return;
    if (!window.RinchanHospitalChallengeEngine || typeof RinchanHospitalChallengeEngine.build !== 'function') return;
    const c = RinchanHospitalChallengeEngine.build();
    if (c.enabled === false) { host.className = 'card monthly-challenge-card hospital-challenge-card hidden'; host.innerHTML = ''; if (window.RinchanChallengeConfig) RinchanChallengeConfig.updateHeading(); return; }
    host.className = 'card monthly-challenge-card hospital-challenge-card' + (c.achieved ? ' is-achieved' : '') + (c.available ? '' : ' is-pending');
    applyCardLayout(host);
    const currentText = c.available ? fmt(c.current) + '歩' : '準備中';
    const targetText = fmt(c.target) + '歩';
    host.innerHTML = '' +
      '<div class="monthly-challenge-head"><div><h3 class="monthly-challenge-title">' + esc(c.icon || '🏥') + ' ' + esc(c.title) + '</h3><p class="monthly-challenge-scope">病院全体チャレンジ｜今月</p></div><span class="monthly-challenge-pill">' + (c.available ? c.rate + '%' : '準備中') + '</span></div>' +
      '<div class="monthly-challenge-main"><div><strong>' + currentText + '</strong><small>病院全体の今月歩数</small></div><div><strong>' + targetText + '</strong><small>病院全体目標</small></div></div>' +
      '<div class="monthly-challenge-bar"><span style="width:' + (c.available ? c.rate : 0) + '%"></span></div>' +
      '<p class="monthly-challenge-note">' + esc(c.message) + '</p>';
    if (window.RinchanChallengeConfig) RinchanChallengeConfig.updateHeading();
  }

  function install() {
    render();
    setTimeout(render, 300);
    setTimeout(render, 900);
    setTimeout(render, 1800);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanHospitalChallengeRender = RinchanHospitalChallengeRender;
