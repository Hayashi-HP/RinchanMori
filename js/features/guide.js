const RinchanGuide = (() => {
  const VERSION = 'v0.9.61';
  const GUIDE_KEY = 'rinchanGuideSeenV094';

  const steps = [
    { title: 'ようこそ、りんちゃんの杜へ', text: 'ここでは、一人ひとりの一歩が、みんなの杜を育てます。' },
    { title: '歩けば、木が育ちます', text: '活動を記録すると、あなたの木に葉っぱが増えて、少しずつ大きくなります。' },
    { title: 'ありがとうが届きます', text: 'ありがとうが増えると、杜に蝶が遊びに来ます。競争ではなく、みんなで育てる杜です。' },
    { title: '無理せず、いこうね', text: '歩ける日も、歩けない日もあります。自分のペースで、ゆっくり続けましょう。' }
  ];

  let guideIndex = 0;

  function hasSeen() {
    return localStorage.getItem(GUIDE_KEY) === '1';
  }

  function init() {
    if (hasSeen()) return;
    if (document.getElementById('rinchanGuideLayer')) return;

    const layer = document.createElement('div');
    layer.className = 'rinchan-guide-layer';
    layer.id = 'rinchanGuideLayer';
    layer.innerHTML = '<div class="rinchan-guide-card"><div class="guide-face">😊</div><p class="label">りんちゃんガイド</p><h1 id="guideTitle">ようこそ、りんちゃんの杜へ</h1><p id="guideText">ここでは、一人ひとりの一歩が、みんなの杜を育てます。</p><div class="guide-dots" id="guideDots"></div><div class="guide-actions"><button class="soft-button" type="button" onclick="RinchanGuide.skip()">あとで</button><button class="submit pill-button" type="button" onclick="RinchanGuide.next()" id="guideNext">次へ</button></div></div>';
    document.body.appendChild(layer);
    render();
  }

  function render() {
    const step = steps[guideIndex];
    const title = document.getElementById('guideTitle');
    const text = document.getElementById('guideText');
    const dots = document.getElementById('guideDots');
    const nextButton = document.getElementById('guideNext');
    if (title) title.textContent = step.title;
    if (text) text.textContent = step.text;
    if (dots) dots.innerHTML = steps.map((_, index) => '<span class="' + (index === guideIndex ? 'active' : '') + '"></span>').join('');
    if (nextButton) nextButton.textContent = guideIndex === steps.length - 1 ? 'はじめる' : '次へ';
  }

  function next() {
    if (guideIndex < steps.length - 1) {
      guideIndex += 1;
      render();
      return;
    }
    finish();
  }

  function skip() {
    finish();
  }

  function finish() {
    localStorage.setItem(GUIDE_KEY, '1');
    const layer = document.getElementById('rinchanGuideLayer');
    if (layer) layer.remove();
  }

  function reset() {
    localStorage.removeItem(GUIDE_KEY);
    guideIndex = 0;
    init();
  }

  function install() {
    init();
    window.initRinchanGuideV094 = init;
    window.nextRinchanGuideV094 = next;
    window.skipRinchanGuideV094 = skip;
    window.finishRinchanGuideV094 = finish;
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    init,
    next,
    skip,
    finish,
    reset
  };
})();
