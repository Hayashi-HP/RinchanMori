const RinchanPassportLayoutFix = (() => {
  const VERSION = 'v1.4.31';

  function setImportant(el, prop, value) {
    if (!el || !el.style) return;
    try { el.style.setProperty(prop, value, 'important'); } catch (e) { el.style[prop] = value; }
  }

  function fixChallengeCards() {
    const stack = document.getElementById('passportChallengeStack');
    if (stack) {
      setImportant(stack, 'display', 'block');
      setImportant(stack, 'width', '100%');
      setImportant(stack, 'max-width', 'none');
      setImportant(stack, 'margin', '0');
      setImportant(stack, 'padding', '0');
    }

    ['monthlyChallengeSection', 'departmentChallengeSection', 'hospitalChallengeSection'].forEach((id, index) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.classList.contains('card')) el.classList.add('card');
      setImportant(el, 'margin', index === 0 ? '14px 16px 14px' : '0 16px 14px');
      setImportant(el, 'padding', '20px');
      setImportant(el, 'box-sizing', 'border-box');
    });
  }

  function fixScrollAndNav() {
    const html = document.documentElement;
    const body = document.body;
    const app = document.getElementById('mypageV070') || document.querySelector('main.app');
    const nav = document.querySelector('.nav');

    [html, body].forEach(el => {
      setImportant(el, 'height', 'auto');
      setImportant(el, 'min-height', '100%');
      setImportant(el, 'overflow-y', 'auto');
      setImportant(el, 'overflow-x', 'hidden');
      setImportant(el, 'position', 'static');
      setImportant(el, 'touch-action', 'pan-y');
      setImportant(el, '-webkit-overflow-scrolling', 'touch');
    });

    if (app) {
      setImportant(app, 'height', 'auto');
      setImportant(app, 'min-height', '100vh');
      setImportant(app, 'overflow-y', 'visible');
      setImportant(app, 'padding-bottom', '24px');
    }

    if (nav) {
      setImportant(nav, 'position', 'static');
      setImportant(nav, 'left', 'auto');
      setImportant(nav, 'right', 'auto');
      setImportant(nav, 'bottom', 'auto');
      setImportant(nav, 'transform', 'none');
      setImportant(nav, 'width', 'calc(100% - 32px)');
      setImportant(nav, 'max-width', '398px');
      setImportant(nav, 'height', '78px');
      setImportant(nav, 'margin', '20px auto 20px');
      setImportant(nav, 'border-radius', '28px');
      setImportant(nav, 'box-shadow', '0 10px 24px rgba(60,120,90,.10)');
    }
  }

  function apply() {
    fixChallengeCards();
    fixScrollAndNav();
  }

  function install() {
    apply();
    setTimeout(apply, 0);
    setTimeout(apply, 100);
    setTimeout(apply, 300);
    setTimeout(apply, 700);
    setTimeout(apply, 1200);
    setTimeout(apply, 2500);
    setTimeout(apply, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }

  window.addEventListener('load', install);
  window.addEventListener('pageshow', () => setTimeout(install, 100));
  window.addEventListener('resize', () => setTimeout(apply, 100));

  return { VERSION, install, apply };
})();
window.RinchanPassportLayoutFix = RinchanPassportLayoutFix;
