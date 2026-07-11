const RinchanDailyHunt = (() => {
  const VERSION = 'v1.4.34';
  const STORAGE_KEY = 'rinchanDailyHunt';
  const REWARD_KEY = 'rinchanDailyHuntRewards';

  const MESSAGES = [
    '見つけてくれてありがとう♪\n今日も小さな一歩を大切にしよう。',
    'ここでひと休みしていたよ♪\n無理せず、自分のペースでね。',
    '今日の杜もいい風だね♪\nあなたの一歩で、もっと育つよ。',
    'しーっ、かくれんぼ中でした♪\n見つけたあなたに小さな贈りもの。',
    '会いに来てくれてうれしいな♪\n今日も笑顔でいこう。',
    '木陰でのんびりしていたよ♪\n水分補給も忘れずにね。',
    '今日も杜へようこそ♪\nあなたに会えてよかった。'
  ];

  const POSITIONS = [
    { left: 12, top: 18 }, { left: 72, top: 16 }, { left: 21, top: 58 },
    { left: 66, top: 54 }, { left: 42, top: 34 }, { left: 78, top: 72 },
    { left: 10, top: 74 }, { left: 48, top: 68 }
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function tokyoDateKey(date) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(date || new Date());
    } catch (e) {
      return (date || new Date()).toISOString().slice(0, 10);
    }
  }

  function participantId() {
    const p = readJson('rinchanParticipant', {}) || {};
    return String(p.employeeId || p.id || p.participantId || 'guest');
  }

  function hash(value) {
    let h = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function dailyState() {
    const date = tokyoDateKey(new Date());
    const seed = hash(date + ':' + participantId());
    const pos = POSITIONS[seed % POSITIONS.length];
    return {
      date,
      seed,
      position: pos,
      message: MESSAGES[seed % MESSAGES.length],
      reward: seed % 3 === 0 ? '🌸 花のかけら' : (seed % 3 === 1 ? '⭐ 星のかけら' : '🍀 しあわせの葉')
    };
  }

  function claimedToday() {
    const saved = readJson(STORAGE_KEY, {});
    return saved && saved.date === tokyoDateKey(new Date()) && saved.employeeId === participantId();
  }

  function claim(state) {
    if (claimedToday()) return false;
    writeJson(STORAGE_KEY, {
      date: state.date,
      employeeId: participantId(),
      reward: state.reward,
      claimedAt: new Date().toISOString()
    });
    const rewards = readJson(REWARD_KEY, []);
    rewards.unshift({
      date: state.date,
      employeeId: participantId(),
      reward: state.reward,
      claimedAt: new Date().toISOString()
    });
    writeJson(REWARD_KEY, rewards.slice(0, 100));
    return true;
  }

  function showFound(state, alreadyClaimed) {
    const note = alreadyClaimed
      ? '今日はもう受け取り済みです。また明日、りんちゃんを探してね。'
      : state.reward + ' を受け取りました。';
    if (window.RinchanModal && typeof RinchanModal.show === 'function') {
      RinchanModal.show({
        speech: state.message,
        note,
        primaryText: 'やった♪',
        hideClose: true,
        onPrimary: () => {
          RinchanModal.close();
          renderStatus();
        }
      });
    }
  }

  function renderStatus() {
    const el = document.getElementById('dailyRinchanStatus');
    if (!el) return;
    el.textContent = claimedToday()
      ? '今日はりんちゃんを見つけました。明日また探してね♪'
      : '杜のどこかに、りんちゃんが隠れています。';
  }

  function render() {
    const map = document.getElementById('moriMap');
    if (!map) return;
    let button = document.getElementById('dailyRinchanFind');
    if (button) button.remove();

    const state = dailyState();
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'dailyRinchanFind';
    button.className = 'daily-rinchan-find' + (claimedToday() ? ' is-found' : '');
    button.style.left = state.position.left + '%';
    button.style.top = state.position.top + '%';
    button.setAttribute('aria-label', '今日のりんちゃんを見つける');
    button.innerHTML = '<img src="../assets/rinchan-face.svg?v=1049" alt="りんちゃん"><span>みつけて♪</span>';
    button.addEventListener('click', () => {
      const already = claimedToday();
      if (!already) claim(state);
      button.classList.add('is-found');
      showFound(state, already);
    });
    map.appendChild(button);
    renderStatus();
  }

  function install() {
    render();
    setTimeout(render, 500);
    setTimeout(render, 1400);
    const refresh = document.getElementById('refreshMoriButton');
    if (refresh && !refresh.__dailyRinchanInstalled) {
      refresh.__dailyRinchanInstalled = true;
      refresh.addEventListener('click', () => setTimeout(render, 1000));
    }
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));

  return { VERSION, install, render, dailyState, claimedToday };
})();
window.RinchanDailyHunt = RinchanDailyHunt;
