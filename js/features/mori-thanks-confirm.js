const RinchanMoriThanksConfirm = (() => {
  const VERSION = 'v1.5.61';
  const REASONS = ['ありがとう', '助けてもらった', '声をかけてもらった', '一緒にがんばった'];
  let sending = false;

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
      '.thanks-reason-sheet{position:fixed!important;inset:0!important;z-index:10000!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:14px!important;box-sizing:border-box!important}',
      '.thanks-reason-backdrop{position:absolute!important;inset:0!important;background:rgba(20,45,38,.42)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}',
      '.thanks-reason-panel{position:relative!important;z-index:1!important;width:min(430px,100%)!important;max-height:calc(100dvh - 100px)!important;margin:0 auto calc(74px + env(safe-area-inset-bottom))!important;padding:22px!important;border-radius:30px!important;background:#fff!important;border:1px solid rgba(93,130,105,.16)!important;box-shadow:0 18px 45px rgba(24,50,40,.24)!important;text-align:left!important;overflow-y:auto!important;box-sizing:border-box!important}',
      '.thanks-reason-close{position:absolute!important;top:14px!important;right:14px!important;width:42px!important;height:42px!important;border:0!important;border-radius:50%!important;background:#eef8f9!important;color:#244038!important;font-size:22px!important;font-weight:900!important;line-height:1!important}',
      '.thanks-reason-panel>.label{margin:0 52px 12px 0!important;color:#2f8d60!important;font-size:13px!important;font-weight:900!important}',
      '.thanks-reason-options{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}',
      '.thanks-reason-choice{position:relative!important;min-height:64px!important;padding:10px 12px!important;border:0!important;border-radius:18px!important;background:linear-gradient(180deg,#f6fffb,#eef8f2)!important;color:#244038!important;box-shadow:0 8px 16px rgba(60,120,90,.06)!important;text-align:left!important;display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;grid-template-areas:"number label" "number sub"!important;align-items:center!important;column-gap:8px!important;row-gap:2px!important}',
      '.thanks-reason-choice.is-selected{background:linear-gradient(90deg,#20b8c8,#55bf72)!important;color:#fff!important;box-shadow:0 10px 20px rgba(42,160,120,.2)!important}',
      '.thanks-reason-choice .choice-number{grid-area:number!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:24px!important;height:24px!important;border-radius:50%!important;background:rgba(36,64,56,.1)!important;color:inherit!important;font-size:12px!important;font-weight:900!important}',
      '.thanks-reason-choice.is-selected .choice-number{background:rgba(255,255,255,.24)!important}',
      '.thanks-reason-choice strong{grid-area:label!important;font-size:15px!important;line-height:1.35!important;font-weight:900!important;color:inherit!important}',
      '.thanks-target-card{margin:8px 0 14px;padding:14px 16px;border-radius:22px;background:#f7fbf5;border:1px solid rgba(93,130,105,.13);text-align:left}',
      '.thanks-target-card strong{display:block;color:#244038;font-size:20px;line-height:1.35;font-weight:950}',
      '.thanks-target-card small{display:block;margin-top:4px;color:#6d8174;font-size:13px;font-weight:900;line-height:1.5}',
      '.thanks-target-card .real-name{color:#40544a}',
      '.thanks-confirm-note{margin:10px 0 0;color:#61766e;font-size:13px;font-weight:900;line-height:1.6}',
      '.thanks-reason-choice .choice-sub{grid-area:sub!important;display:block!important;margin:0!important;color:#6d8174;font-size:11.5px!important;font-weight:850!important;line-height:1.35!important}',
      '.thanks-reason-choice.is-selected .choice-sub{color:rgba(255,255,255,.88)!important}',
      '.thanks-reason-actions{display:flex!important;flex-direction:column!important;gap:8px!important;margin-top:14px!important}',
      '.thanks-reason-submit{width:100%!important;min-height:52px!important;border:0!important;border-radius:999px!important;background:linear-gradient(90deg,#20b8c8,#55bf72)!important;color:#fff!important;font-size:15px!important;font-weight:900!important;box-shadow:0 10px 22px rgba(42,160,120,.2)!important}',
      '.thanks-reason-submit:disabled,.thanks-reason-choice:disabled,.thanks-reason-close:disabled{cursor:wait!important;opacity:.72!important}',
      '.thanks-reason-submit.is-done{background:#2f9b69!important;opacity:1!important}',
      '.thanks-send-status{min-height:20px!important;margin:0!important;text-align:center!important;color:#61766e!important;font-size:12.5px!important;font-weight:850!important;line-height:1.5!important}',
      '.thanks-send-status.is-error{color:#b34d54!important}',
      '@media(max-width:480px){.thanks-reason-sheet{padding:10px!important}.thanks-reason-panel{margin-bottom:calc(78px + env(safe-area-inset-bottom))!important;padding:20px!important;border-radius:26px!important}.thanks-reason-options{grid-template-columns:1fr!important}.thanks-reason-choice{min-height:58px!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function close(force) {
    if (sending && force !== true) return;
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
    sheet.dataset.toId = String(toId || '');
    sheet.dataset.shown = shown;
    sheet.dataset.real = real;
    sheet.dataset.reason = REASONS[0];
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
      REASONS.map((reason, index) => '<button type="button" class="thanks-reason-choice' + (index === 0 ? ' is-selected' : '') + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '" onclick="RinchanMoriThanksConfirm.selectReason(\'' + escapeAttr(reason) + '\',this)"><span class="choice-number">' + (index + 1) + '</span><strong>' + escapeHtml(reason) + '</strong><span class="choice-sub">' + escapeHtml(real) + 'さんへ送る</span></button>').join(''),
      '</div>',
      '<div class="thanks-reason-actions">',
      '<button type="button" class="thanks-reason-submit" onclick="RinchanMoriThanksConfirm.confirmSend()">この内容で送る</button>',
      '<p class="thanks-send-status" aria-live="polite">選んだ内容を確認して送信してください。</p>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(sheet);
  }

  function selectReason(reason, button) {
    if (sending) return;
    const sheet = document.getElementById('thanksReasonSheet');
    if (!sheet || !REASONS.includes(reason)) return;
    sheet.dataset.reason = reason;
    sheet.querySelectorAll('.thanks-reason-choice').forEach(choice => {
      const selected = choice === button;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    const status = sheet.querySelector('.thanks-send-status');
    if (status) {
      status.classList.remove('is-error');
      status.textContent = '「' + reason + '」を選びました。';
    }
  }

  function setSendingState(active) {
    sending = !!active;
    const sheet = document.getElementById('thanksReasonSheet');
    if (!sheet) return;
    sheet.querySelectorAll('button').forEach(button => { button.disabled = sending; });
    const submit = sheet.querySelector('.thanks-reason-submit');
    const status = sheet.querySelector('.thanks-send-status');
    if (submit && sending) submit.textContent = '送信しています…';
    if (status && sending) {
      status.classList.remove('is-error');
      status.textContent = 'そのままお待ちください。送信は1回だけ行われます。';
    }
  }

  async function confirmSend() {
    if (sending) return;
    const sheet = document.getElementById('thanksReasonSheet');
    if (!sheet || !window.RinchanMori || typeof window.RinchanMori.__originalSendThanks !== 'function') return;
    const toId = sheet.dataset.toId || '';
    const shown = sheet.dataset.shown || '';
    const real = sheet.dataset.real || '';
    const reason = sheet.dataset.reason || REASONS[0];
    setSendingState(true);
    const result = await window.RinchanMori.__originalSendThanks(toId, shown || real, reason, { keepPickerOpen: true });
    const currentSheet = document.getElementById('thanksReasonSheet');
    if (!currentSheet) {
      sending = false;
      return;
    }
    const submit = currentSheet.querySelector('.thanks-reason-submit');
    const status = currentSheet.querySelector('.thanks-send-status');
    if (result && result.ok) {
      if (submit) {
        submit.disabled = true;
        submit.classList.add('is-done');
        submit.textContent = '送信しました ✓';
      }
      if (status) status.textContent = (real || shown || '相手') + 'さんへ、ありがとうを届けました。';
      setTimeout(() => {
        sending = false;
        close(true);
      }, 1500);
      return;
    }
    setSendingState(false);
    if (submit) submit.textContent = 'もう一度送る';
    if (status) {
      status.classList.add('is-error');
      status.textContent = '送信を確認できませんでした。通信状態を確認して、もう一度お試しください。';
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

  return { VERSION, install, open, close, selectReason, confirmSend };
})();
window.RinchanMoriThanksConfirm = RinchanMoriThanksConfirm;
