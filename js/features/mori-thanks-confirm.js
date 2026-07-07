const RinchanMoriThanksConfirm = (() => {
  const VERSION = 'v1.1.34';
  const REASONS = ['ありがとう', '助けてもらった', '声をかけてもらった', '一緒にがんばった'];

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function normalizeMember(item) {
    return {
      id: String(item.employeeId || item.id || item.participantId || ''),
      employeeId: String(item.employeeId || item.id || item.participantId || ''),
      name: String(item.name || item.employeeName || item.fullName || item.displayName || ''),
      nick: String(item.nick || item.nickname || ''),
      dept: String(item.dept || item.department || item.section || 'その他')
    };
  }

  function members() {
    const list = readJson('rinchanMoriMembers', []);
    return Array.isArray(list) ? list.map(normalizeMember).filter(m => m.id) : [];
  }

  function findMember(id) {
    return members().find(m => String(m.id) === String(id) || String(m.employeeId) === String(id));
  }

  function displayName(member, fallback) {
    return (member && (member.nick || member.name)) || fallback || 'メンバー';
  }

  function realName(member, fallback) {
    return (member && member.name) || fallback || displayName(member, fallback);
  }

  function injectStyles() {
    if (document.getElementById('moriThanksConfirmStyle')) return;
    const style = document.createElement('style');
    style.id = 'moriThanksConfirmStyle';
    style.textContent = [
      '.thanks-target-card{margin:8px 0 14px;padding:14px 16px;border-radius:22px;background:#f7fbf5;border:1px solid rgba(93,130,105,.13);text-align:left}',
      '.thanks-target-card strong{display:block;color:#244038;font-size:20px;line-height:1.35;font-weight:950}',
      '.thanks-target-card small{display:block;margin-top:4px;color:#6d8174;font-size:13px;font-weight:900;line-height:1.5}',
      '.thanks-target-card .real-name{color:#40544a}',
      '.thanks-confirm-note{margin:10px 0 0;color:#61766e;font-size:13px;font-weight:900;line-height:1.6}',
      '.thanks-reason-choice .choice-sub{display:block;margin-top:3px;color:#6d8174;font-size:12px;font-weight:850}'
    ].join('');
    document.head.appendChild(style);
  }

  function close() {
    const box = document.getElementById('thanksReasonSheet');
    if (box && box.parentNode) box.parentNode.removeChild(box);
  }

  function open(toId, fallbackName) {
    injectStyles();
    close();
    const member = findMember(toId);
    const shown = displayName(member, fallbackName);
    const real = realName(member, fallbackName);
    const dept = (member && member.dept) || '所属未設定';
    const realLine = real && real !== shown ? '<small class="real-name">本名：' + escapeHtml(real) + '</small>' : '';
    const sheet = document.createElement('div');
    sheet.id = 'thanksReasonSheet';
    sheet.className = 'thanks-reason-sheet';
    sheet.innerHTML = [
      '<div class="thanks-reason-backdrop" onclick="RinchanMoriThanksConfirm.close()"></div>',
      '<div class="thanks-reason-panel">',
      '<button type="button" class="thanks-reason-close" onclick="RinchanMoriThanksConfirm.close()">×</button>',
      '<p class="label">💌 ありがとうを送る</p>',
      '<div class="thanks-target-card">',
      '<strong>' + escapeHtml(shown) + 'さん</strong>',
      realLine,
      '<small>' + escapeHtml(dept) + '</small>',
      '<p class="thanks-confirm-note">相手を確認してから、届けるありがとうを選んでください。</p>',
      '</div>',
      '<div class="thanks-reason-options">',
      REASONS.map((reason, index) => '<button type="button" class="thanks-reason-choice" onclick="RinchanMoriThanksConfirm.confirmSend(\'' + escapeAttr(toId) + '\',\'' + escapeAttr(shown) + '\',\'' + escapeAttr(real) + '\',\'' + escapeAttr(reason) + '\')"><span class="choice-number">' + (index + 1) + '</span><strong>' + escapeHtml(reason) + '</strong><span class="choice-sub">' + escapeHtml(real) + 'さんへ送る</span></button>').join(''),
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(sheet);
  }

  function confirmSend(toId, shown, real, reason) {
    const target = real || shown || '相手';
    const ok = window.confirm(target + 'さんに\n「' + reason + '」を送りますか？');
    if (!ok) return;
    close();
    if (window.RinchanMori && typeof window.RinchanMori.__originalSendThanks === 'function') {
      window.RinchanMori.__originalSendThanks(toId, shown || real, reason);
    }
  }

  function install() {
    if (!window.RinchanMori || window.RinchanMori.__thanksConfirmInstalled) return;
    window.RinchanMori.__thanksConfirmInstalled = true;
    window.RinchanMori.__originalOpenThanksPicker = window.RinchanMori.openThanksPicker;
    window.RinchanMori.__originalCloseThanksPicker = window.RinchanMori.closeThanksPicker;
    window.RinchanMori.__originalSendThanks = window.RinchanMori.sendThanks;
    window.RinchanMori.openThanksPicker = open;
    window.RinchanMori.closeThanksPicker = close;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 50); setTimeout(install, 600); });
  window.addEventListener('pageshow', function(){ setTimeout(install, 100); });

  return { VERSION, install, open, close, confirmSend };
})();
window.RinchanMoriThanksConfirm = RinchanMoriThanksConfirm;
