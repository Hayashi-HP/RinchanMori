const RinchanModal = (() => {
  const VERSION = 'v1.1.5';
  const STYLE_ID = 'rinchanCommonModalStyles';
  const OVERLAY_ID = 'rinchanCommonModalOverlay';

  function rootPath() {
    return location.pathname.includes('/pages/') ? '../' : '';
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '@keyframes rinchanCommonFade{from{opacity:0}to{opacity:1}}',
      '@keyframes rinchanCommonPoyon{0%{opacity:0;transform:scale(.85) translateY(12px)}58%{opacity:1;transform:scale(1.05) translateY(-4px)}78%{transform:scale(.98) translateY(1px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
      '@keyframes rinchanCommonHop{0%{transform:translateY(0) scale(.96)}45%{transform:translateY(-8px) scale(1.04)}75%{transform:translateY(2px) scale(.99)}100%{transform:translateY(0) scale(1)}}',
      '@keyframes rinchanCommonSpeech{0%{opacity:0;transform:translateY(8px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}',
      '#'+OVERLAY_ID+'{position:fixed;inset:0;z-index:9999;background:rgba(30,46,38,.48);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;animation:rinchanCommonFade .18s ease-out both}',
      '.rinchan-common-modal-panel{width:min(430px,100%);background:#fff;border-radius:30px;padding:26px 22px 22px;box-shadow:0 22px 60px rgba(39,70,53,.24);text-align:center;color:#2f3f34;border:1px solid rgba(113,161,123,.22);animation:rinchanCommonPoyon .46s cubic-bezier(.2,.9,.25,1.25) both;transform-origin:center}',
      '.rinchan-common-modal-visual{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:16px}',
      '.rinchan-common-modal-face{width:84px;height:auto;object-fit:contain;background:transparent;border:0;box-shadow:none;animation:rinchanCommonHop .58s ease-out .08s both}',
      '.rinchan-common-modal-speech{max-width:320px;background:#f3fbef;border:1px solid #d8efd2;border-radius:20px;padding:13px 16px;color:#2f6b35;font-size:17px;font-weight:950;line-height:1.65;white-space:pre-line;opacity:0;animation:rinchanCommonSpeech .28s ease-out .16s both;letter-spacing:-.02em}',
      '.rinchan-common-modal-note{font-size:15px;line-height:1.7;margin:0 0 22px;color:#667568;font-weight:900}',
      '.rinchan-common-modal-actions{display:flex;gap:12px;justify-content:center;align-items:center;flex-direction:column;width:100%}',
      '.rinchan-common-modal-button{appearance:none;border:0;border-radius:999px;width:min(320px,100%);min-height:56px;padding:0 24px;font-size:18px;line-height:1.2;font-weight:950;letter-spacing:-.02em;cursor:pointer;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;text-align:center;box-shadow:none;transition:filter .12s ease,transform .12s ease,background .12s ease}',
      '.rinchan-common-modal-primary{background:linear-gradient(135deg,#1f7f3a 0%,#58bd72 100%);color:#fff;box-shadow:0 10px 22px rgba(31,127,58,.18)}',
      '.rinchan-common-modal-secondary{background:#eef8f2;color:#244038;border:1px solid rgba(93,130,105,.14)}',
      '.rinchan-common-modal-button:active{transform:scale(.98);filter:brightness(.96)}',
      '@media(max-width:430px){.rinchan-common-modal-panel{border-radius:28px;padding:24px 20px 20px}.rinchan-common-modal-button{width:min(300px,100%);min-height:54px;font-size:17px}.rinchan-common-modal-speech{font-size:16px}}',
      '@media (prefers-reduced-motion:reduce){#'+OVERLAY_ID+',.rinchan-common-modal-panel,.rinchan-common-modal-face,.rinchan-common-modal-speech{animation:none!important;opacity:1!important;transform:none!important}.rinchan-common-modal-button{transition:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function close() {
    const old = document.getElementById(OVERLAY_ID);
    if (old) old.remove();
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = 'rinchan-common-modal-button ' + className;
    button.addEventListener('click', onClick || close);
    return button;
  }

  function show(options) {
    const opts = options || {};
    close();
    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const panel = document.createElement('div');
    panel.className = 'rinchan-common-modal-panel';

    const visual = document.createElement('div');
    visual.className = 'rinchan-common-modal-visual';

    const img = document.createElement('img');
    img.className = 'rinchan-common-modal-face';
    img.src = opts.rinchanSrc || rootPath() + 'assets/rinchan-face.svg?v=1049';
    img.alt = 'りんちゃん';
    visual.appendChild(img);

    const speech = document.createElement('div');
    speech.className = 'rinchan-common-modal-speech';
    speech.textContent = opts.speech || 'できたよ♪';
    visual.appendChild(speech);
    panel.appendChild(visual);

    if (opts.note || opts.noteHtml) {
      const note = document.createElement('div');
      note.className = 'rinchan-common-modal-note';
      if (opts.noteHtml) note.innerHTML = opts.noteHtml;
      else note.textContent = opts.note;
      panel.appendChild(note);
    }

    const actions = document.createElement('div');
    actions.className = 'rinchan-common-modal-actions';

    if (opts.primaryText) {
      actions.appendChild(makeButton(opts.primaryText, 'rinchan-common-modal-primary', opts.onPrimary || close));
    }
    if (opts.hideClose !== true) {
      actions.appendChild(makeButton(opts.closeText || '閉じる', 'rinchan-common-modal-secondary', close));
    }

    panel.appendChild(actions);
    overlay.appendChild(panel);
    overlay.addEventListener('click', event => { if (event.target === overlay && opts.blockBackdropClose !== true) close(); });
    document.body.appendChild(overlay);
    setTimeout(() => { const first = actions.querySelector('button'); if (first) first.focus(); }, 0);
    return overlay;
  }

  function duplicateEmployee(onBack) {
    return show({
      speech: 'あれれ？\nこの社員番号は\nもう使われているみたい。\nもう一度確認してね♪',
      note: '社員番号を確認してみてね。',
      primaryText: '社員番号を確認する',
      onPrimary: () => {
        close();
        if (typeof onBack === 'function') setTimeout(onBack, 30);
      },
      hideClose: true
    });
  }

  function thanksSent() {
    return show({
      speech: 'ありがとうを\n届けたよ♪',
      note: 'りんちゃんの杜に、またひとつやさしい気持ちが増えました。',
      primaryText: '杜へ戻る',
      closeText: '閉じる'
    });
  }

  function simple(speech, note) {
    return show({ speech, note, closeText: 'OK' });
  }

  return { VERSION, show, close, duplicateEmployee, thanksSent, simple, escapeHtml };
})();
window.RinchanModal = RinchanModal;
