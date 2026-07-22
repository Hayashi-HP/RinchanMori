const RinchanPassportRender = (() => {
  const VERSION = 'v1.4.22';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function formatSteps(value) {
    return Number(value || 0).toLocaleString('ja-JP') + '歩';
  }

  function badgeCatalogCards() {
    if (!window.RinchanBadgeCatalogEngine || typeof RinchanBadgeCatalogEngine.build !== 'function') return '';
    const list = RinchanBadgeCatalogEngine.build();
    const unlocked = list.filter(b => b.unlocked).length;
    const cards = list.map(b => {
      const cls = b.unlocked ? 'is-unlocked' : 'is-locked';
      const icon = b.unlocked ? b.icon : '❔';
      const name = b.unlocked ? b.name : '未発見バッジ';
      const note = b.unlocked ? b.hint : b.hint;
      return '<div class="rinchan-passport-badge ' + cls + '"><div class="rinchan-passport-badge-icon">' + escapeHtml(icon) + '</div><div class="rinchan-passport-badge-name">' + escapeHtml(name) + '</div><div class="rinchan-passport-badge-note">' + escapeHtml(note) + '</div></div>';
    }).join('');
    return '<h3 class="rinchan-passport-section-title">📖 バッジ図鑑 ' + unlocked + '/' + list.length + '</h3><p class="rinchan-passport-section-note">これから集められるバッジの一覧です。</p><div class="rinchan-passport-badges">' + cards + '</div>';
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
    host.innerHTML = '<p class="label">りんちゃんパスポート</p><div class="rinchan-passport-head"><h2 class="rinchan-passport-title">' + escapeHtml(data.name) + 'さんの歩み</h2><p class="rinchan-passport-sub">' + escapeHtml(data.joinYm || '入職年月 未設定') + ' / ' + escapeHtml(data.tenureLabel || '勤続年数 未設定') + '</p></div><div class="rinchan-passport-stats"><div><strong>' + formatSteps(data.totalSteps) + '</strong><small>総歩数</small></div><div><strong>' + Number((data.thanks && data.thanks.received) || 0).toLocaleString('ja-JP') + '件</strong><small>もらったありがとう</small></div></div>' + badgeCatalogCards() + '<h3 class="rinchan-passport-section-title">🎪 イベント参加</h3><p class="rinchan-passport-section-note">季節イベントに参加すると、記念バッジとして残ります。</p>' + eventCards(data.events || []);
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
