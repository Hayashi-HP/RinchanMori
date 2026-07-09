const RinchanPassportRender = (() => {
  const VERSION = 'v1.3.2';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function formatSteps(value) {
    return Number(value || 0).toLocaleString('ja-JP') + '歩';
  }

  function render() {
    const host = document.getElementById('rinchanPassportSection');
    if (!host) return;
    if (!window.RinchanPassportEngine || typeof RinchanPassportEngine.build !== 'function') return;
    const data = RinchanPassportEngine.build();
    const badges = (data.badges || []).map(b => '<span class="rinchan-passport-badge">' + escapeHtml(b.icon) + ' ' + escapeHtml(b.label) + '</span>').join('');
    const events = (data.events || []).length ? (data.events || []).map(e => '<span class="rinchan-passport-event">' + escapeHtml(e.icon) + ' ' + escapeHtml(e.label) + '</span>').join('') : '<span class="rinchan-passport-event">🌳 これから参加</span>';
    host.innerHTML = '<p class="label">🌳 りんちゃんパスポート</p><div class="rinchan-passport-head"><div class="rinchan-passport-avatar">🌳</div><div><h2 class="rinchan-passport-title">' + escapeHtml(data.name) + 'さんの歩み</h2><p class="rinchan-passport-sub">' + escapeHtml(data.joinYm || '入職年月 未設定') + ' / ' + escapeHtml(data.tenureLabel || '勤続年数 未設定') + '</p></div></div><div class="rinchan-passport-stats"><div><strong>' + escapeHtml(data.tenureLabel || '-') + '</strong><small>勤続</small></div><div><strong>' + formatSteps(data.totalSteps) + '</strong><small>総歩数</small></div><div><strong>' + Number((data.thanks && data.thanks.received) || 0).toLocaleString('ja-JP') + '件</strong><small>もらったありがとう</small></div></div><div class="rinchan-passport-badges">' + badges + '</div><div class="rinchan-passport-events">' + events + '</div>';
  }

  function install() {
    render();
    setTimeout(render, 500);
    setTimeout(render, 1500);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render };
})();
window.RinchanPassportRender = RinchanPassportRender;
