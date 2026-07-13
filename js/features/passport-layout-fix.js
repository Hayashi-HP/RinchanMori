const RinchanPassportLayoutFix = (() => {
  const VERSION = 'v1.5.4';

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
      setImportant(el, 'margin', index === 0 ? '14px 20px 14px' : '0 20px 14px');
      setImportant(el, 'padding', '20px');
      setImportant(el, 'box-sizing', 'border-box');
    });
  }

  function fixScrollAndNav() {
    const html = document.documentElement;
    const body = document.body;
    const app = document.getElementById('mypageV070') || document.querySelector('main.app');
    const nav = document.querySelector('.nav');

    if (nav && nav.parentNode !== body) body.appendChild(nav);

    setImportant(html, 'height', 'auto');
    setImportant(html, 'min-height', '100%');
    setImportant(html, 'overflow-x', 'hidden');
    setImportant(html, 'overflow-y', 'auto');
    setImportant(body, 'position', 'relative');
    setImportant(body, 'height', 'auto');
    setImportant(body, 'min-height', '100vh');
    setImportant(body, 'overflow-x', 'hidden');
    setImportant(body, 'overflow-y', 'visible');
    setImportant(body, 'touch-action', 'pan-y');
    setImportant(body, '-webkit-overflow-scrolling', 'touch');

    if (app) {
      setImportant(app, 'position', 'relative');
      setImportant(app, 'width', '100%');
      setImportant(app, 'height', 'auto');
      setImportant(app, 'min-height', '100vh');
      setImportant(app, 'overflow', 'visible');
      setImportant(app, 'padding-bottom', 'calc(90px + env(safe-area-inset-bottom, 0px))');
    }

    if (!nav) return;
    setImportant(nav, 'position', 'fixed');
    setImportant(nav, 'left', '50vw');
    setImportant(nav, 'right', 'auto');
    setImportant(nav, 'top', 'auto');
    setImportant(nav, 'bottom', 'env(safe-area-inset-bottom, 0px)');
    setImportant(nav, 'transform', 'translate3d(-50%, 0, 0)');
    setImportant(nav, 'margin', '0');
    setImportant(nav, 'width', 'min(calc(100vw - 16px), 430px)');
    setImportant(nav, 'max-width', 'none');
    setImportant(nav, 'height', '78px');
    setImportant(nav, 'padding', '0');
    setImportant(nav, 'box-sizing', 'border-box');
    setImportant(nav, 'border-radius', '28px');
    setImportant(nav, 'z-index', '1001');
  }

  function apply() {
    fixChallengeCards();
    fixScrollAndNav();
  }

  function install() {
    apply();
    setTimeout(apply, 100);
    setTimeout(apply, 500);
    setTimeout(apply, 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
  window.addEventListener('pageshow', () => setTimeout(install, 100));
  window.addEventListener('resize', () => setTimeout(apply, 100));

  return { VERSION, install, apply };
})();
window.RinchanPassportLayoutFix = RinchanPassportLayoutFix;