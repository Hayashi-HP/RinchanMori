const RinchanGuide = (() => {
  const VERSION = 'v0.9.73';
  const GUIDE_KEY = 'rinchanGuideSeenV094';

  const steps = [
    { title: 'ようこそ、りんちゃんの杜へ', text: '一人ひとりの一歩が、<br>みんなの杜を<span class="nowrap">育てます。</span>' },
    { title: '歩けば、木が育ちます', text: '活動を記録すると、<br>あなたの木に葉っぱが増え、<br>少しずつ大きくなります。' },
    { title: 'ありがとうが届きます', text: 'ありがとうが増えると、<br>杜に蝶が遊びに来ます。<br><br>競争ではなく、<br>みんなで育てる杜です。' },
    { title: '無理せず、いこうね', text: '歩ける日も、<br>歩けない日もあります。<br><br>自分のペースで、<br>ゆっくり続けましょう。' }
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
    layer.innerHTML = '<div class="rinchan-guide-card"><div class="guide-face">😊</div><p class="label">りんちゃんガイド</p><h1 id="guideTitle">ようこそ、りんちゃんの杜へ</h1><p id="guideText">一人ひとりの一歩が、<br>みんなの杜を<span class="nowrap">育てます。</span></p><div class="guide-dots" id="guideDots"></div><div class="guide-actions"><button class="soft-button" type="button" onclick="RinchanGuide.skip()">スキップ</button><button class="submit pill-button" type="button" onclick="RinchanGuide.next()" id="guideNext">次へ</button></div></div>';
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
    if (text) text.innerHTML = step.text;
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