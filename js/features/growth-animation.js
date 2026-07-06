const RinchanGrowthAnimation = (() => {
  const VERSION = 'v1.0.80';

  function injectStyles() {
    if (document.getElementById('rinchanGrowthAnimationStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanGrowthAnimationStyles';
    style.textContent = [
      '@keyframes rinchanGrowPulse{0%{transform:scale(.92) rotate(-1deg)}55%{transform:scale(1.10) rotate(1deg)}78%{transform:scale(.98) rotate(-.5deg)}100%{transform:scale(1) rotate(0)}}',
      '@keyframes rinchanLeafPop{0%{opacity:0;transform:scale(.25) translateY(16px) rotate(-18deg)}60%{opacity:1;transform:scale(1.18) translateY(-8px) rotate(8deg)}100%{opacity:1;transform:scale(1) translateY(0) rotate(0)}}',
      '@keyframes rinchanFruitPop{0%{opacity:0;transform:scale(.2) translateY(10px)}65%{opacity:1;transform:scale(1.22) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
      '.rinchan-grow-now{animation:rinchanGrowPulse .72s cubic-bezier(.2,.9,.25,1.25) both}',
      '.rinchan-growth-stage{position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:5}',
      '.rinchan-growth-pop{position:absolute;font-size:22px;filter:drop-shadow(0 8px 10px rgba(80,120,70,.14));animation:rinchanLeafPop .78s cubic-bezier(.2,.9,.25,1.18) both}',
      '.rinchan-growth-pop.fruit{animation-name:rinchanFruitPop}',
      '@media (prefers-reduced-motion:reduce){.rinchan-grow-now,.rinchan-growth-pop{animation:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function stageForTree() {
    const treeWorld = document.querySelector('.tree-world') || document.querySelector('.growth-world') || document.querySelector('.tree-stage');
    if (!treeWorld) return null;
    if (getComputedStyle(treeWorld).position === 'static') treeWorld.style.position = 'relative';
    let stage = treeWorld.querySelector('.rinchan-growth-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'rinchan-growth-stage';
      treeWorld.appendChild(stage);
    }
    return stage;
  }

  function targetTree() {
    return document.getElementById('treeIcon') || document.querySelector('.tree-large') || document.querySelector('.forest-hero-icon');
  }

  function burst(type) {
    injectStyles();
    const tree = targetTree();
    const stage = stageForTree();
    if (!tree || !stage) return;
    tree.classList.remove('rinchan-grow-now');
    void tree.offsetWidth;
    tree.classList.add('rinchan-grow-now');
    setTimeout(() => tree.classList.remove('rinchan-grow-now'), 850);

    const icons = type === 'fruit' ? ['🍎','🍊','🍓'] : type === 'flower' ? ['🌸','🌼','🌷'] : ['🍃','🌿','🌱'];
    for (let i = 0; i < 7; i += 1) {
      const el = document.createElement('span');
      el.className = 'rinchan-growth-pop' + (type === 'fruit' ? ' fruit' : '');
      el.textContent = icons[i % icons.length];
      el.style.left = (24 + ((i * 13) % 54)) + '%';
      el.style.top = (16 + ((i * 17) % 52)) + '%';
      el.style.animationDelay = (i * .06) + 's';
      stage.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  function inferTypeFromSteps(steps) {
    const n = Number(steps || 0);
    if (n >= 12000) return 'fruit';
    if (n >= 8000) return 'flower';
    return 'leaf';
  }

  function celebrateSteps(steps) {
    burst(inferTypeFromSteps(steps));
  }

  function installActivityHook() {
    const form = document.getElementById('activityForm');
    if (!form || form.__rinchanGrowthAnimationHooked) return;
    form.__rinchanGrowthAnimationHooked = true;
    form.addEventListener('submit', () => {
      const input = document.getElementById('steps');
      const steps = input ? Number(input.value || 0) : 0;
      setTimeout(() => celebrateSteps(steps), 360);
    }, false);
  }

  function installTreeTap() {
    const tree = targetTree();
    if (!tree || tree.__rinchanGrowthAnimationTap) return;
    tree.__rinchanGrowthAnimationTap = true;
    tree.addEventListener('click', () => burst('leaf'));
  }

  function install() {
    injectStyles();
    installActivityHook();
    installTreeTap();
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 100));

  return { VERSION, install, burst, celebrateSteps };
})();
window.RinchanGrowthAnimation = RinchanGrowthAnimation;
