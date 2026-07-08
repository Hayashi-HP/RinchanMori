const RinchanTanabataEvent = (() => {
  const VERSION = 'v1.2.5';

  function isTanabata() {
    try {
      if (window.RinchanEventCalendarEngine && typeof RinchanEventCalendarEngine.currentEvent === 'function') {
        return RinchanEventCalendarEngine.currentEvent().key === 'tanabata';
      }
    } catch(e) {}
    const d = new Date();
    return (d.getMonth() + 1) === 7 && d.getDate() <= 7;
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    const old = map.querySelector('.tanabata-layer');
    if (!isTanabata()) {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      return;
    }
    if (old) return;
    const layer = document.createElement('div');
    layer.className = 'tanabata-layer';
    layer.innerHTML = '<span class="tanabata-item tanabata-bamboo">🎋</span><span class="tanabata-item tanabata-strip s1"></span><span class="tanabata-item tanabata-strip s2"></span><span class="tanabata-item tanabata-strip s3"></span><span class="tanabata-item tanabata-star st1">✨</span><span class="tanabata-item tanabata-star st2">✦</span><span class="tanabata-item tanabata-star st3">✨</span>';
    map.appendChild(layer);
  }

  function install() {
    render();
    setTimeout(render, 400);
    setTimeout(render, 1300);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, render, isTanabata };
})();
window.RinchanTanabataEvent = RinchanTanabataEvent;
