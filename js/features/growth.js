const RinchanGrowth = (() => {
  const VERSION = 'v1.0.13';

  function readJson(key, fallback) {
    if (window.RinchanStorage) return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function number(n) {
    return Number(n || 0).toLocaleString('ja-JP');
  }

  function season() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return { key: 'spring', label: '春の杜', icon: '🌸', visual: '🌸', objects: ['🌷', '🌸', '🐝'], message: '春の風が、あなたの木をやさしく育てています。' };
    if (m >= 6 && m <= 8) return { key: 'summer', label: '夏の杜', icon: '🌿', visual: '☀️', objects: ['🌻', '☀️', '🍉'], message: '夏の光を浴びて、木がぐんぐん伸びています。' };
    if (m >= 9 && m <= 11) return { key: 'autumn', label: '秋の杜', icon: '🍁', visual: '🍁', objects: ['🍁', '🍂', '🌰'], message: '秋の杜に、継続の実りが増えています。' };
    return { key: 'winter', label: '冬の杜', icon: '❄️', visual: '❄️', objects: ['❄️', '⛄', '✨'], message: '冬の静かな杜で、習慣の根が育っています。' };
  }

  function applySeason() {
    const s = season();
    document.body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
    document.body.classList.add('season-' + s.key);
    document.querySelectorAll('.petal').forEach(el => { el.textContent = s.visual; });
    const hero = document.querySelector('.home-hero');
    if (hero) hero.setAttribute('data-season', s.label);
  }

  function growth(count, totalSteps) {
    if (count >= 100 || totalSteps >= 500000) return { level: 7, icon: '🌳🌸🐿️', animal: '🐿️', title: '杜を支える大樹', text: 'あなたの継続が、りんちゃんの杜を支えています。', pct: 100, next: 'すばらしい継続です。' };
    if (count >= 60 || totalSteps >= 300000) return { level: 6, icon: '🌳🦋', animal: '🦋', title: '蝶が集まる木', text: 'あなたの木に、やさしい仲間が集まってきました。', pct: 86, next: '次は大樹を目指しましょう。' };
    if (count >= 40 || totalSteps >= 200000) return { level: 5, icon: '🌳🐦', animal: '🐦', title: '鳥が来る木', text: '習慣がしっかり根づき、杜に鳥が遊びに来ました。', pct: 72, next: '次は蝶が来る木へ。' };
    if (count >= 25 || totalSteps >= 100000) return { level: 4, icon: '🌸🌳', animal: '✨', title: '花が咲く木', text: '続ける力が花になって咲きました。', pct: 58, next: '次は鳥が来る木へ。' };
    if (count >= 10 || totalSteps >= 50000) return { level: 3, icon: '🌳', animal: '', title: '木が大きくなりました', text: '健康の習慣が、しっかり育っています。', pct: 42, next: '次は花が咲く木へ。' };
    if (count >= 3 || totalSteps >= 10000) return { level: 2, icon: '🌿', animal: '', title: '若葉が育っています', text: '小さな一歩が、若葉になりました。', pct: 25, next: '次は大きな木へ。' };
    return { level: 1, icon: '🌱', animal: '', title: '小さな芽が出ました', text: '活動を記録すると、あなたの木が少しずつ育ちます。', pct: 12, next: 'まずは3回記録してみましょう。' };
  }

  function stats() {
    const list = activities();
    const totalSteps = list.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    return { count: list.length, totalSteps };
  }

  function renderGrowth() {
    const icon = document.getElementById('treeIcon');
    const title = document.getElementById('treeTitle');
    const text = document.getElementById('treeText');
    const bar = document.getElementById('growthBar');
    const note = document.getElementById('growthNote');
    if (!icon && !title && !text && !bar && !note) return;
    const currentStats = stats();
    const currentSeason = season();
    const currentGrowth = growth(currentStats.count, currentStats.totalSteps);
    if (icon) icon.textContent = currentGrowth.icon;
    if (title) title.textContent = 'Lv.' + currentGrowth.level + ' ' + currentGrowth.title;
    if (text) text.textContent = currentGrowth.text + ' ' + currentSeason.message;
    if (bar) bar.style.width = currentGrowth.pct + '%';
    if (note) {
      note.innerHTML = '<span class="growth-note-season">' + escapeHtml(currentSeason.icon + ' ' + currentSeason.label) + '</span><span class="growth-note-next">' + escapeHtml(currentGrowth.next) + '</span><span class="growth-note-total">累計 ' + number(currentStats.totalSteps) + '歩</span>';
    }
  }

  function renderSeasonObjects() {
    const world = document.querySelector('.growth-world');
    if (!world) return;
    world.querySelectorAll('.season-object,.growth-animal').forEach(el => el.remove());
    const currentSeason = season();
    const currentStats = stats();
    const currentGrowth = growth(currentStats.count, currentStats.totalSteps);
    currentSeason.objects.forEach((obj, i) => {
      const el = document.createElement('span');
      el.className = 'season-object so' + (i + 1);
      el.textContent = obj;
      world.appendChild(el);
    });
    if (currentGrowth.animal) {
      const animal = document.createElement('span');
      animal.className = 'growth-animal';
      animal.textContent = currentGrowth.animal;
      world.appendChild(animal);
    }
  }

  function badges() {
    const currentStats = stats();
    const year = new Date().getFullYear();
    return [
      { id: 'year-' + year, icon: '🏅', name: String(year).slice(2) + '年度参加', on: true },
      { id: 'first-log', icon: '🌱', name: '初回記録', on: currentStats.count >= 1 },
      { id: 'three-logs', icon: '🌿', name: '3回記録', on: currentStats.count >= 3 },
      { id: 'ten-logs', icon: '🌳', name: '10回記録', on: currentStats.count >= 10 },
      { id: 'steps-10000', icon: '👟', name: '累計1万歩', on: currentStats.totalSteps >= 10000 },
      { id: 'steps-50000', icon: '✨', name: '累計5万歩', on: currentStats.totalSteps >= 50000 },
      { id: 'steps-100000', icon: '🌸', name: '累計10万歩', on: currentStats.totalSteps >= 100000 }
    ];
  }

  function renderBadges() {
    const box = document.getElementById('badgeList');
    if (!box) return;
    box.innerHTML = badges().map(badge => '<div class="badge-item ' + (badge.on ? 'earned' : 'locked') + '"><span>' + badge.icon + '</span><strong>' + badge.name + '</strong><small>' + (badge.on ? '獲得' : '未獲得') + '</small></div>').join('');
  }

  function renderAll() {
    applySeason();
    renderGrowth();
    renderBadges();
    renderSeasonObjects();
  }

  function install() {
    renderAll();
    window.renderV060Growth = renderGrowth;
    window.renderV060Badges = renderBadges;
    window.renderV062SeasonObjects = renderSeasonObjects;
    window.applySeasonV061 = applySeason;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    renderAll,
    renderGrowth,
    renderBadges,
    renderSeasonObjects,
    applySeason
  };
})();
