const RinchanMonthlyChallengeRender = (() => {
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
    const host = document.getElementById('monthlyChallengeSection');
    if (!host) return;
    if (!window.RinchanMonthlyChallengeEngine || typeof RinchanMonthlyChallengeEngine.build !== 'function') return;
    const c = RinchanMonthlyChallengeEngine.build();
    if (c.enabled === false) { host.className = 'card monthly-challenge-card hidden'; host.innerHTML = ''; if (window.RinchanChallengeConfig) RinchanChallengeConfig.updateHeading(); return; }
    host.className = 'card monthly-challenge-card' + (c.achieved ? ' is-achieved' : '');
    applyCardLayout(host);
    host.innerHTML = '' +
      '<div class="monthly-challenge-head"><div><h3 class="monthly-challenge-title">' + esc(c.title) + '</h3><p class="monthly-challenge-scope">個人チャレンジ｜今月</p></div><span class="monthly-challenge-pill">' + c.rate + '%</span></div>' +
      '<div class="monthly-challenge-main"><div><strong>' + fmt(c.current) + '歩</strong><small>あなたの今月歩数</small></div><div><strong>' + fmt(c.target) + '歩</strong><small>個人目標</small></div></div>' +
      '<div class="monthly-challenge-bar"><span style="width:' + c.rate + '%"></span></div>' +
      '<p class="monthly-challenge-note">' + esc(c.message) + ' 残り' + c.daysLeft + '日。</p>';
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
window.RinchanMonthlyChallengeRender = RinchanMonthlyChallengeRender;
