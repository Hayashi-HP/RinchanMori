const RinchanPassportLayoutFix = (() => {
  const VERSION = 'v1.5.5';

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

  function install() {
    fixChallengeCards();
    setTimeout(fixChallengeCards, 100);
    setTimeout(fixChallengeCards, 500);
    setTimeout(fixChallengeCards, 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
  window.addEventListener('pageshow', () => setTimeout(install, 100));

  return { VERSION, install, apply: fixChallengeCards };
})();
window.RinchanPassportLayoutFix = RinchanPassportLayoutFix;
