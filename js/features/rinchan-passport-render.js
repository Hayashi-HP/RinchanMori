const RinchanPassportRender = (() => {
  const VERSION = 'v1.4.23';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function eventCards(events) {
    const list = Array.isArray(events) ? events : [];
    if (list.length) {
      return '<div class="rinchan-passport-events">' + list.map(e => '<span class="rinchan-passport-event">' + escapeHtml(e.icon) + ' ' + escapeHtml(e.label) + '</span>').join('') + '</div>';
    }
    return '<div class="rinchan-passport-event-empty"><strong>まだ参加したイベントはありません</strong><small>七夕・夏祭りなどに参加すると、ここに参加バッジが表示されます。</small></div>';
  }

  function render() {
    const host = document.getElementById('rinchanPassportSection');
    if (!host) return;
    if (!window.RinchanPassportEngine || typeof RinchanPassportEngine.build !== 'function') return;
    const data = RinchanPassportEngine.build();
    host.innerHTML = '<p class="label">りんちゃんパスポート</p><div class="rinchan-passport-head"><h2 class="rinchan-passport-title">' + escapeHtml(data.name) + 'さんの歩み</h2><p class="rinchan-passport-sub">' + escapeHtml(data.joinYm || '入職年月 未設定') + ' / ' + escapeHtml(data.tenureLabel || '勤続年数 未設定') + '</p></div><h3 class="rinchan-passport-section-title">🎪 イベント参加</h3><p class="rinchan-passport-section-note">参加した季節イベントを記録します。</p>' + eventCards(data.events || []);
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
