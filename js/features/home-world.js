const RinchanHomeWorld = (() => {
  const VERSION = 'v1.1.1';

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

  function pick(list, salt) {
    const d = new Date();
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + (salt || 0);
    return list[Math.abs(seed) % list.length];
  }

  function greeting() {
    const h = new Date().getHours();
    const steps = todaySteps();
    if (steps > 0) return { hello: 'おかえり♪', message: '今日は ' + number(steps) + '歩、杜に届いているよ🌱' };
    if (h >= 5 && h < 11) return { hello: 'おはよう♪', message: '今日も一緒に杜を育てよう🌱' };
    if (h >= 11 && h < 17) return { hello: 'こんにちは♪', message: '今日の杜を少し見ていこう🌳' };
    if (h >= 17 && h < 21) return { hello: 'おつかれさま♪', message: '今日も無理せず、できる範囲で大丈夫😊' };
    return { hello: '今日もありがとう♪', message: 'ゆっくり休んでね😊' };
  }

  function renderHero() {
    const user = participant() || {};
    const loggedIn = !!(user.employeeId || user.id);
    const name = document.getElementById('name');
    const dailyGreeting = document.getElementById('dailyGreeting');
    const dailyMessage = document.getElementById('dailyMessage');
    const challenge = document.getElementById('todayChallenge');
    const g = greeting();
    if (name) name.textContent = user.nick || user.name || user.displayName || 'ゲスト';
    if (dailyGreeting) dailyGreeting.textContent = loggedIn ? g.hello : 'こんにちは';
    if (dailyMessage) dailyMessage.textContent = loggedIn ? g.message : 'りんちゃんの杜へようこそ。';
    if (challenge) challenge.textContent = loggedIn ? pick(oneWords, todaySteps() % 17) : 'まずは杜に参加してみよう🌱';
  }

  function removeLegacyTodayCard() {
    const oldToday = document.getElementById('rinchanTodayCard');
    if (oldToday) oldToday.remove();
    const oldOneWord = document.querySelector('.rinchan-oneword-card');
    if (oldOneWord) oldOneWord.remove();
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
    removeLegacyTodayCard();
    renderHero();
    installTreeTalk();
    document.body.classList.add('rinchan-world-home');
  }

  function install() { renderHome(); }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 60));

  return { VERSION, renderHome, renderHero, installTreeTalk, todaySteps };
})();
window.RinchanHomeWorld = RinchanHomeWorld;
