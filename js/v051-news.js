const RINCHAN_NEWS_KEY = 'rinchanReadNewsIds';
const RINCHAN_NEWS_IDS = ['news1', 'news2'];
const RINCHAN_V100 = 'v0.9.10';

function readJsonV051(key, fallback) {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : fallback;
  } catch (e) {
    return fallback;
  }
}

function readNewsIdsV051() {
  return readJsonV051(RINCHAN_NEWS_KEY, []);
}

function saveNewsIdsV051(ids) {
  localStorage.setItem(RINCHAN_NEWS_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function unreadCountV051() {
  const read = readNewsIdsV051();
  return RINCHAN_NEWS_IDS.filter(id => !read.includes(id)).length;
}

function initNewsV051() {
  updateNewsBadgesV051();
  updateNewsRowsV051();
  initNewsPageV100();
}

document.addEventListener('DOMContentLoaded', initNewsV051);

function updateNewsBadgesV051() {
  const count = unreadCountV051();
  document.querySelectorAll('.notify-badge').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

function updateNewsRowsV051() {
  document.querySelectorAll('.news-row').forEach(row => {
    const id = row.getAttribute('data-news-id');
    if (!id) return;
    const read = readNewsIdsV051().includes(id);
    row.classList.toggle('unread', !read);
    row.classList.toggle('read', read);
    const em = row.querySelector('em');
    if (em) em.textContent = read ? '既読' : '未読';
  });
}

function openNews(id) {
  const read = readNewsIdsV051();
  read.push(id);
  saveNewsIdsV051(read);
  updateNewsBadgesV051();
  updateNewsRowsV051();
  const list = document.querySelector('.news-list');
  if (list) list.classList.add('hidden');
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove('hidden');
}

function closeNews() {
  document.querySelectorAll('.letter').forEach(el => el.classList.add('hidden'));
  const list = document.querySelector('.news-list');
  if (list) list.classList.remove('hidden');
  updateNewsBadgesV051();
  updateNewsRowsV051();
}

function v100ReadJson(key, fallback) {
  return readJsonV051(key, fallback);
}

function v100Num(n) {
  return Number(n || 0).toLocaleString('ja-JP');
}

function v100EscapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

function v100TodayLabel() {
  const d = new Date();
  return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function v100TodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function v100RelativeTime(dateString) {
  if (!dateString) return 'たった今';
  const d = new Date(dateString);
  if (isNaN(d)) return 'たった今';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return mins + '分前';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + '時間前';
  const days = Math.floor(hours / 24);
  return days + '日前';
}

function v100Activities() {
  return v100ReadJson('rinchanActivities', []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function v100Timeline() {
  return v100ReadJson('rinchanGoodTimeline', []).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function v100DashboardCache() {
  const cache = v100ReadJson('rinchanDashboardCache', null);
  return cache && cache.data ? cache.data : null;
}

function v100ForestLevelFromSteps(totalSteps) {
  if (totalSteps >= 300000) return 7;
  if (totalSteps >= 200000) return 6;
  if (totalSteps >= 120000) return 5;
  if (totalSteps >= 70000) return 4;
  if (totalSteps >= 30000) return 3;
  if (totalSteps >= 10000) return 2;
  return 1;
}

function v100ForestIcon(level) {
  return ['', '🌱', '🌿', '🌳', '🌳🦋', '🌳🌸', '🌳🐦', '🌳✨'][level] || '🌱';
}

function v100ForestTarget(level) {
  return [0, 10000, 30000, 70000, 120000, 200000, 300000, 450000][level] || 450000;
}

function v100RenderSummary() {
  const cache = v100DashboardCache();
  const activities = v100Activities();
  const thanks = v100Timeline();
  const todayKey = v100TodayKey();

  const totalSteps = cache && cache.totalSteps ? Number(cache.totalSteps || 0) : activities.reduce((sum, item) => sum + Number(item.steps || 0), 0);
  const totalActivities = cache && cache.totalActivities ? Number(cache.totalActivities || 0) : activities.length;
  const todayActivities = activities.filter(item => String(item.date || '').slice(0, 10) === todayKey).length;
  const todaySteps = activities
    .filter(item => String(item.date || '').slice(0, 10) === todayKey)
    .reduce((sum, item) => sum + Number(item.steps || 0), 0);
  const thanksCount = thanks.length;
  const level = v100ForestLevelFromSteps(totalSteps);
  const currentTarget = v100ForestTarget(level);
  const nextLevel = Math.min(7, level + 1);
  const nextTarget = v100ForestTarget(nextLevel);
  const achievedInLevel = Math.max(0, totalSteps - currentTarget);
  const span = Math.max(1, nextTarget - currentTarget);
  const progressPct = Math.max(8, Math.min(100, Math.round((achievedInLevel / span) * 100)));
  const remain = Math.max(0, nextTarget - totalSteps);
  const leafCount = Math.min(99, Math.max(1, Math.floor(totalActivities / 2) + 1));

  const icon = document.getElementById('forestHeroIcon');
  if (icon) icon.textContent = v100ForestIcon(level);
  const title = document.getElementById('forestLevelTitle');
  if (title) title.textContent = '杜レベル ' + level;
  const text = document.getElementById('forestLevelText');
  if (text) text.textContent = '全員の歩数で、杜全体が育ちます。';
  const date = document.getElementById('newsSummaryDate');
  if (date) date.textContent = v100TodayLabel() + 'の様子';
  const progress = document.getElementById('forestProgressBar');
  if (progress) progress.style.width = progressPct + '%';
  const note = document.getElementById('forestProgressNote');
  if (note) note.textContent = remain > 0 ? 'あと' + v100Num(remain) + '歩でレベル ' + nextLevel : '次の成長条件を達成しました';

  const stats = document.getElementById('forestSummaryStats');
  if (!stats) return;
  stats.innerHTML = [
    { icon: '🍀', text: '葉っぱ ' + v100Num(leafCount) + '枚' },
    { icon: '👟', text: '累計 ' + v100Num(totalSteps) + '歩' },
    { icon: '🌱', text: '今日 ' + v100Num(todayActivities) + '件の活動が記録されました' },
    { icon: '🩵', text: '今日の歩数は ' + v100Num(todaySteps) + '歩です' },
    { icon: '❤️', text: 'ありがとうが合計 ' + v100Num(thanksCount) + '件届いています' },
    { icon: '🌳', text: '活動回数は合計 ' + v100Num(totalActivities) + '回です' }
  ].map(item =>
    '<div class="forest-summary-stat">' +
      '<span class="forest-summary-stat-icon">' + item.icon + '</span>' +
      '<strong>' + v100EscapeHtml(item.text) + '</strong>' +
    '</div>'
  ).join('');
}

function v100RenderThanksStories() {
  const box = document.getElementById('thanksStoryList');
  if (!box) return;

  const list = v100Timeline().slice(0, 12);
  if (!list.length) {
    box.innerHTML = '<p class="empty-note news-empty">まだありがとうの出来事はありません。</p>';
    return;
  }

  box.innerHTML = list.map(item => {
    const body = String(item.body || 'ありがとうが届きました。').replace(/^❤️\s*/g, '').trim();
    return '<article class="thanks-story-item">' +
      '<div class="thanks-story-top">' +
        '<span class="thanks-story-badge">❤️ ありがとう</span>' +
        '<time>' + v100EscapeHtml(v100RelativeTime(item.createdAt)) + '</time>' +
      '</div>' +
      '<h3>' + v100EscapeHtml(item.title || 'ありがとうが届きました') + '</h3>' +
      '<p>' + v100EscapeHtml(body) + '</p>' +
    '</article>';
  }).join('');
}

function v100BuildGroupNews() {
  const participant = v100ReadJson('rinchanParticipant', {}) || {};
  const activities = v100Activities();
  const thanks = v100Timeline();
  const todayKey = v100TodayKey();

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const thisWeekCount = activities.filter(item => {
    const d = new Date(String(item.date || '') + 'T00:00:00');
    return !isNaN(d) && d >= start;
  }).length;
  const todayCount = activities.filter(item => String(item.date || '').slice(0, 10) === todayKey).length;

  const items = [
    {
      icon: '📣',
      tag: 'グループ',
      title: 'りんちゃん通信へようこそ',
      body: '病院だけでなく、グループ全体の出来事や応援をここにまとめて表示します。'
    },
    {
      icon: '👟',
      tag: '歩数記録',
      title: '今日の歩数記録',
      body: '本日は ' + v100Num(todayCount) + '件の歩数記録があります。'
    },
    {
      icon: '🎯',
      tag: '目標',
      title: '今週の活動状況',
      body: '今週は ' + v100Num(thisWeekCount) + '回の活動が記録されています。目標に向けてコツコツいきましょう。'
    },
    {
      icon: '❤️',
      tag: 'ありがとう',
      title: '応援の広がり',
      body: 'ありがとうの出来事は現在 ' + v100Num(thanks.length) + '件あります。お互いの頑張りを届け合えます。'
    }
  ];

  if (participant && (participant.declaration || participant.weeklyGoal)) {
    items.push({
      icon: '🙌',
      tag: 'マイページ',
      title: 'あなたの宣言も反映中',
      body: '健康宣言や今週の目標はマイページからいつでも編集できます。'
    });
  }

  return items;
}

function v100RenderGroupNews() {
  const box = document.getElementById('groupNewsList');
  if (!box) return;
  const items = v100BuildGroupNews();
  box.innerHTML = items.map(item =>
    '<article class="group-news-item">' +
      '<div class="group-news-icon" aria-hidden="true">' + v100EscapeHtml(item.icon) + '</div>' +
      '<div class="group-news-body">' +
        '<div class="group-news-meta"><span class="group-news-tag">' + v100EscapeHtml(item.tag) + '</span></div>' +
        '<h3>' + v100EscapeHtml(item.title) + '</h3>' +
        '<p>' + v100EscapeHtml(item.body) + '</p>' +
      '</div>' +
    '</article>'
  ).join('');
}

function initNewsPageV100() {
  if (!document.getElementById('rinchanNewsPage')) return;
  v100RenderSummary();
  v100RenderThanksStories();
  v100RenderGroupNews();
}
