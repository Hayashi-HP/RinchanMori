const RinchanPassportRender = (() => {
  const VERSION = 'v1.4.24';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function badgeCatalogCards() {
    if (!window.RinchanBadgeCatalogEngine || typeof RinchanBadgeCatalogEngine.build !== 'function') return '<p class="rinchan-passport-section-note">バッジを読み込み中です。</p>';
    const list = RinchanBadgeCatalogEngine.build();
    const unlocked = list.filter(badge => badge.unlocked).length;
    const cards = list.map(badge => {
      const state = badge.unlocked ? 'is-unlocked' : 'is-locked';
      const icon = badge.unlocked ? badge.icon : '❔';
      const name = badge.unlocked ? badge.name : '未発見バッジ';
      return '<div class="rinchan-passport-badge ' + state + '"><div class="rinchan-passport-badge-icon">' + escapeHtml(icon) + '</div><div class="rinchan-passport-badge-name">' + escapeHtml(name) + '</div><div class="rinchan-passport-badge-note">' + escapeHtml(badge.hint) + '</div></div>';
    }).join('');
    return '<p class="rinchan-passport-section-note">獲得 ' + unlocked + '/' + list.length + '。未発見のバッジも、条件を達成すると開きます。</p><div class="rinchan-passport-badges">' + cards + '</div>';
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
    setText('v151ProfileJoinYm', data.joinYm || '未設定');
    setText('v151ProfileTenure', data.tenureLabel || '未設定');
    host.innerHTML = '<p class="label">思い出コレクション</p><h2 class="rinchan-passport-title">バッジ図鑑</h2>' + badgeCatalogCards() + '<h3 class="rinchan-passport-section-title">🎪 イベント参加</h3><p class="rinchan-passport-section-note">参加した季節イベントを記録します。</p>' + eventCards(data.events || []);
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
