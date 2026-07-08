const RinchanBirthdayEvent = (() => {
  const VERSION = 'v1.3.0';
  const SHOWN_KEY = 'rinchanBirthdayEventShownDate';

  function currentParticipant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null'); } catch(e) { return null; }
  }

  function birthdayValue(p) {
    if (!p) return '';
    return p.birthdate || p.birthday || p.birthDate || p.dateOfBirth || p.dob || '';
  }

  function parseMonthDay(value) {
    const s = String(value || '').trim();
    if (!s) return null;
    const m = s.match(/(?:\d{4}[\/-])?(\d{1,2})[\/-月](\d{1,2})/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
  }

  function isBirthdayToday() {
    const md = parseMonthDay(birthdayValue(currentParticipant()));
    if (!md) return false;
    const d = new Date();
    return md.month === d.getMonth() + 1 && md.day === d.getDate();
  }

  function displayName() {
    const p = currentParticipant() || {};
    return p.nickname || p.nickName || p.displayName || 'あなた';
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const old = map.querySelector('.birthday-layer');
    if (!isBirthdayToday()) {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    if (old) return;
    const layer = document.createElement('div');
    layer.className = 'birthday-layer';
    layer.innerHTML = '<span class="birthday-item birthday-balloon b1">🎈</span><span class="birthday-item birthday-balloon b2">🎈</span><span class="birthday-item birthday-balloon b3">🎈</span><span class="birthday-item birthday-cake">🎂</span><span class="birthday-item birthday-gift">🎁</span><span class="birthday-item birthday-sparkle s1">✨</span><span class="birthday-item birthday-sparkle s2">✦</span><span class="birthday-item birthday-sparkle s3">✨</span><div class="birthday-message">' + escapeHtml(displayName()) + 'さん、お誕生日おめでとう🎉<br>今日の杜はお祝いの日です。</div>';
    map.appendChild(layer);
    showOnce();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
  }

  function showOnce() {
    try {
      const key = todayKey();
      if (localStorage.getItem(SHOWN_KEY) === key) return;
      localStorage.setItem(SHOWN_KEY, key);
      if (window.RinchanModal && typeof RinchanModal.show === 'function') {
        RinchanModal.show({ speech: displayName() + 'さん、お誕生日おめでとう🎂 今日の杜がお祝いしています♪', primaryText: 'ありがとう', hideClose: true });
      }
    } catch(e) {}
  }

  function install() {
    render();
    setTimeout(render, 400);
    setTimeout(render, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render, isBirthdayToday };
})();
window.RinchanBirthdayEvent = RinchanBirthdayEvent;
