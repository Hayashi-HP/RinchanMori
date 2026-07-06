const RinchanHomeWorld = (() => {
  const VERSION = 'v1.0.64';
  const DEFAULT_DAILY_GOAL = 9000;

  const oneWords = [
    '一歩ずつで大丈夫♪', '今日も会えてうれしい♪', 'ありがとうは元気の種🌱', '無理しすぎないでね😊', '階段もいい運動だよ♪',
    '水分も忘れずにね。', '小さな一歩が杜になるよ。', '今日の木も待ってるよ🌱', 'できる範囲で大丈夫♪', '続ける力ってすごいね。',
    '深呼吸していこう♪', 'あなたの歩みが葉っぱになるよ。', '今日もやさしくいこう。', 'りんも応援してるよ♪', 'ゆっくりでもちゃんと前へ。',
    '昨日より少しだけで十分♪', '元気の実が育ってるよ。', 'ありがとうを届けてみる？', '杜に風が吹いてるよ。', '今日もいい日になりますように。',
    '歩いた分だけ木が喜ぶよ🌳', '休むことも大切だよ。', '仲間と一緒に育てよう♪', '今日の一歩、見てるよ。', 'やさしい気持ちが増えてるよ。',
    '木陰でひとやすみしよう。', '気づいた時が始めどき♪', '今日も杜は育ってるよ。', 'あなたのペースで大丈夫。', 'りんちゃんの杜へようこそ♪'
  ];

  const treeTalks = [
    '風が気持ちいいね♪', '今日も元気！', '水をありがとう🌱', 'もうすぐ大きくなるよ♪', 'みんなで育てよう♪',
    '葉っぱが増えてきたよ。', 'りんもここにいるよ♪', '木陰で休んでいってね。', '今日の一歩が届いたよ。', '小鳥が遊びに来そうだね🐦',
    '根っこが少し強くなったよ。', 'ありがとうの光を感じるよ。', 'やさしい杜になってきたね。', 'また会いに来てね♪', '一緒に大きくなろう。',
    '今日も見守ってるよ。', '雨の日も育ってるよ。', 'おひさまが気持ちいいね☀️', '小さな芽も大切だよ。', '実がなる日が楽しみだね。',
    '歩くたびに元気になるよ。', 'りんちゃんもにこにこ♪', '杜の仲間が増えてるよ。', 'やさしい風が吹いたよ。', '今日もありがとう。',
    '枝が少し伸びたかも。', '花が咲く準備中だよ。', 'ここは安心の杜だよ。', 'いつでも戻ってきてね。', '一歩の音が聞こえたよ♪'
  ];

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return readJson('rinchanParticipant', null);
    } catch (e) { return null; }
  }

  function activities() {
    const rows = readJson('rinchanActivities', []);
    return Array.isArray(rows) ? rows : [];
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return dateKey(parsed);
    return raw.slice(0, 10);
  }

  function todaySteps() {
    const key = dateKey(new Date());
    return activities().filter(row => normalizeDateKey(row.date || row.createdAt || row.savedAt) === key).reduce((sum, row) => sum + Number(row.steps || 0), 0);
  }

  function number(value) {
    return Number(value || 0).toLocaleString('ja-JP');
  }

  function dailyGoal() {
    const user = participant() || {};
    return Number(String(user.dailyStepGoal || user.stepGoal || '').replace(/,/g, '')) || DEFAULT_DAILY_GOAL;
  }

  function pick(list, salt) {
    const d = new Date();
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + (salt || 0);
    return list[Math.abs(seed) % list.length];
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return { hello: 'おはよう♪', message: '今日も一緒に杜を育てよう🌱' };
    if (h >= 11 && h < 17) return { hello: 'こんにちは♪', message: '今日もいい一日になりそうだね。' };
    if (h >= 17 && h < 21) return { hello: 'おつかれさま♪', message: '今日も木が大きくなってるよ🌳' };
    return { hello: '今日もありがとう♪', message: 'ゆっくり休んでね😊' };
  }

  function renderHero() {
    const user = participant() || {};
    const name = document.getElementById('name');
    const dailyGreeting = document.getElementById('dailyGreeting');
    const dailyMessage = document.getElementById('dailyMessage');
    const challenge = document.getElementById('todayChallenge');
    const g = greeting();
    if (name) name.textContent = user.nick || user.name || 'ゲスト';
    if (dailyGreeting) dailyGreeting.textContent = g.hello;
    if (dailyMessage) dailyMessage.textContent = g.message;
    if (challenge) challenge.textContent = pick(oneWords, 7);
  }

  function ensureWorldCards() {
    const hero = document.querySelector('.home-hero');
    if (!hero || document.getElementById('rinchanTodayCard')) return;

    const word = document.createElement('section');
    word.className = 'card rinchan-world-card rinchan-oneword-card';
    word.innerHTML = '<div class="rinchan-world-row"><img src="assets/rinchan-face.svg?v=1049" alt="りんちゃん"><div><p class="label">🐿️ 今日のひとこと</p><h2 id="rinchanOneWord">一歩ずつで大丈夫♪</h2></div></div>';
    hero.insertAdjacentElement('afterend', word);

    const card = document.createElement('section');
    card.className = 'card rinchan-world-card rinchan-today-card';
    card.id = 'rinchanTodayCard';
    card.innerHTML = [
      '<div class="rinchan-world-head"><div><p class="label">👟 今日の歩み</p><h2>今日はここまで♪</h2></div><span id="rinchanTodayPercent" class="rinchan-world-pill">0%</span></div>',
      '<div class="rinchan-today-progress"><div id="rinchanTodayBar"></div></div>',
      '<div class="rinchan-today-steps"><strong id="rinchanTodaySteps">0歩</strong><p id="rinchanTodayNote">今日の一歩を待ってるよ🌱</p></div>'
    ].join('');
    word.insertAdjacentElement('afterend', card);
  }

  function renderTodayCard() {
    ensureWorldCards();
    const steps = todaySteps();
    const goal = dailyGoal();
    const pct = goal ? Math.min(100, Math.round((steps / goal) * 100)) : 0;
    const remaining = Math.max(0, goal - steps);
    const oneWord = document.getElementById('rinchanOneWord');
    const percent = document.getElementById('rinchanTodayPercent');
    const bar = document.getElementById('rinchanTodayBar');
    const stepsEl = document.getElementById('rinchanTodaySteps');
    const note = document.getElementById('rinchanTodayNote');
    if (oneWord) oneWord.textContent = pick(oneWords, steps % 17);
    if (percent) percent.textContent = pct + '%';
    if (bar) bar.style.width = pct + '%';
    if (stepsEl) stepsEl.textContent = number(steps) + '歩';
    if (note) note.textContent = remaining > 0 ? 'あと' + number(remaining) + '歩で今日の目標♪' : 'やったー！今日の目標達成♪';
    showGoalModalOnce(steps, goal);
  }

  function showGoalModalOnce(steps, goal) {
    if (!goal || steps < goal || !window.RinchanModal) return;
    const key = 'rinchanGoalShown:' + dateKey(new Date());
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setTimeout(() => {
      RinchanModal.show({
        speech: 'やったー！\n今日の目標達成♪',
        note: '今日の歩みで、杜の木がまた元気になったよ🌳',
        primaryText: 'ありがとう♪',
        hideClose: true
      });
    }, 500);
  }

  function installTreeTalk() {
    const tree = document.getElementById('treeIcon');
    if (!tree || tree.__rinchanTalkInstalled) return;
    tree.__rinchanTalkInstalled = true;
    tree.setAttribute('role', 'button');
    tree.setAttribute('tabindex', '0');
    tree.setAttribute('title', '木に話しかける');
    const talk = () => {
      const msg = treeTalks[Math.floor(Math.random() * treeTalks.length)];
      if (window.RinchanModal && typeof RinchanModal.simple === 'function') RinchanModal.simple(msg, 'あなたの木より');
      else alert(msg);
    };
    tree.addEventListener('click', talk);
    tree.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); talk(); } });
  }

  function renderHome() {
    renderHero();
    renderTodayCard();
    installTreeTalk();
    document.body.classList.add('rinchan-world-home');
  }

  function install() { renderHome(); }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 60));

  return { VERSION, renderHome, renderHero, renderTodayCard, installTreeTalk };
})();
window.RinchanHomeWorld = RinchanHomeWorld;
