const RinchanBadgeUnlockEffect = (() => {
  const VERSION = 'v1.3.6';
  const STORAGE_KEY = 'rinchanUnlockedBadgeIds';

  function readSeen() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch(e) { return new Set(); }
  }

  function writeSeen(set) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set))); } catch(e) {}
  }

  function currentUnlockedBadges() {
    try {
      if (!window.RinchanBadgeCatalogEngine || typeof RinchanBadgeCatalogEngine.build !== 'function') return [];
      return RinchanBadgeCatalogEngine.build().filter(b => b && b.unlocked && b.id);
    } catch(e) { return []; }
  }

  function showToast(badge) {
    if (!badge) return;
    const old = document.querySelector('.badge-unlock-toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    const toast = document.createElement('div');
    toast.className = 'badge-unlock-toast';
    toast.innerHTML = '<div class="badge-unlock-title">バッジ獲得！</div><div class="badge-unlock-icon">' + escapeHtml(badge.icon || '🏅') + '</div><div class="badge-unlock-name">' + escapeHtml(badge.name || '新しいバッジ') + '</div><div class="badge-unlock-note">' + escapeHtml(badge.hint || 'りんちゃんパスポートに追加されました') + '</div>';
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4300);
    try {
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({ speech: '新しいバッジを獲得しました！ ' + (badge.name || ''), primaryText: 'やった！', hideClose: true });
      }
    } catch(e) {}
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function check() {
    const seen = readSeen();
    const unlocked = currentUnlockedBadges();
    const newly = unlocked.filter(b => !seen.has(b.id));
    unlocked.forEach(b => seen.add(b.id));
    writeSeen(seen);
    if (newly.length) showToast(newly[0]);
  }

  function install() {
    setTimeout(check, 900);
    setTimeout(check, 2200);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 200));
  return { VERSION, install, check, showToast };
})();
window.RinchanBadgeUnlockEffect = RinchanBadgeUnlockEffect;
