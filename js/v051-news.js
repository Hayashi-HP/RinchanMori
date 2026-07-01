const RINCHAN_NEWS_KEY = 'rinchanReadNewsIds';
const RINCHAN_NEWS_IDS = ['news1', 'news2'];
const RINCHAN_V100 = 'v0.9.47';

function readJsonV051(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; } }
function readNewsIdsV051() { return readJsonV051(RINCHAN_NEWS_KEY, []); }
function saveNewsIdsV051(ids) { localStorage.setItem(RINCHAN_NEWS_KEY, JSON.stringify(Array.from(new Set(ids)))); }
function unreadCountV051() { const read = readNewsIdsV051(); return RINCHAN_NEWS_IDS.filter(id => !read.includes(id)).length; }
function initNewsV051() { updateNewsBadgesV051(); updateNewsRowsV051(); initNewsPageV100(); }
document.addEventListener('DOMContentLoaded', initNewsV051);
function updateNewsBadgesV051() { const count = unreadCountV051(); document.querySelectorAll('.notify-badge').forEach(el => { el.textContent = count; el.classList.toggle('hidden', count === 0); }); }
function updateNewsRowsV051() { document.querySelectorAll('.news-row').forEach(row => { const id = row.getAttribute('data-news-id'); if (!id) return; const read = readNewsIdsV051().includes(id); row.classList.toggle('unread', !read); row.classList.toggle('read', read); const em = row.querySelector('em'); if (em) em.textContent = read ? '既読' : '未読'; }); }
function openNews(id) { const read = readNewsIdsV051(); read.push(id); saveNewsIdsV051(read); updateNewsBadgesV051(); updateNewsRowsV051(); const list = document.querySelector('.news-list'); if (list) list.classList.add('hidden'); const sec = document.getElementById(id); if (sec) sec.classList.remove('hidden'); }
function closeNews() { document.querySelectorAll('.letter').forEach(el => el.classList.add('hidden')); const list = document.querySelector('.news-list'); if (list) list.classList.remove('hidden'); updateNewsBadgesV051(); updateNewsRowsV051(); }
function markNoticeReadV113(id) { const read = readNewsIdsV051(); read.push(id); saveNewsIdsV051(read); updateNewsBadgesV051(); v100RenderNotices(); }

function v100ReadJson(key, fallback) { return readJsonV051(key, fallback); }
function v100Num(n) { return Number(n || 0).toLocaleString('ja-JP'); }
function v100EscapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function v100TodayLabel() { const d = new Date(); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
function v100TodayKey() { return new Date().toISOString().slice(0, 10); }
function v100RelativeTime(dateString) { if (!dateString) return 'たった今'; const d = new Date(dateString); if (isNaN(d)) return 'たった今'; const diff = Date.now() - d.getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'たった今'; if (mins < 60) return mins + '分前'; const hours = Math.floor(mins / 60); if (hours < 24) return hours + '時間前'; return Math.floor(hours / 24) + '日前'; }
function v100Activities() { return v100ReadJson('rinchanActivities', []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))); }
function v100Timeline() { return v100ReadJson('rinchanGoodTimeline', []).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))); }
function v100DashboardCache() { const cache = v100ReadJson('rinchanDashboardCache', null); return cache && cache.data ? cache.data : null; }

function v100RenderSummary() {
  const cache = v100DashboardCache();
  const activities = v100Activities();
  const thanks = v100Timeline();
  const todayKey = v100TodayKey();
  const totalSteps = cache && cache.totalSteps ? Number(cache.totalSteps || 0) : activities.reduce((sum, item) => sum + Number(item.steps || 0), 0);
  const totalActivities = cache && cache.totalActivities ? Number(cache.totalActivities || 0) : activities.length;
  const todayActivities = activities.filter(item => String(item.date || '').slice(0, 10) === todayKey).length;
  const todaySteps = activities.filter(item => String(item.date || '').slice(0, 10) === todayKey).reduce((sum, item) => sum + Number(item.steps || 0), 0);
  const thanksCount = thanks.length;
  const date = document.getElementById('newsSummaryDate'); if (date) date.textContent = v100TodayLabel() + 'の様子';
  const stats = document.getElementById('forestSummaryStats'); if (!stats) return;
  stats.innerHTML = [
    { icon: '👟', text: '累計 ' + v100Num(totalSteps) + '歩' },
    { icon: '🌱', text: '今日 ' + v100Num(todayActivities) + '件の活動が記録されました' },
    { icon: '🩵', text: '今日の歩数は ' + v100Num(todaySteps) + '歩です' },
    { icon: '❤️', text: 'ありがとうが合計 ' + v100Num(thanksCount) + '件届いています' },
    { icon: '🌳', text: '活動回数は合計 ' + v100Num(totalActivities) + '回です' }
  ].map(item => '<div class="forest-summary-stat"><span class="forest-summary-stat-icon">' + item.icon + '</span><strong>' + v100EscapeHtml(item.text) + '</strong></div>').join('');
}

function v100RenderNotices() {
  const box = document.getElementById('noticeList'); if (!box) return;
  const read = readNewsIdsV051();
  const notices = [
    { id: 'news1', icon: '📬', title: 'りんちゃん通信を更新しました', body: '今日の杜、ありがとう、グループニュースを見やすく整理しました。' },
    { id: 'news2', icon: '📝', title: '歩数記録の修正・削除ができます', body: '間違って記録した時は、歩数記録画面の「最近の記録」から修正できます。' }
  ];
  box.innerHTML = notices.map(item => {
    const isRead = read.includes(item.id);
    return '<article class="notice-item ' + (isRead ? 'read' : 'unread') + '"><span class="notice-dot">' + item.icon + '</span><div class="notice-title"><strong>' + v100EscapeHtml(item.title) + '</strong><small>' + v100EscapeHtml(item.body) + '</small></div><div class="notice-action-wrap"><span class="notice-state">' + (isRead ? '既読' : '未読') + '</span>' + (isRead ? '' : '<button type="button" class="notice-confirm" data-notice-id="' + v100EscapeHtml(item.id) + '">確認した</button>') + '</div></article>';
  }).join('');
  box.querySelectorAll('.notice-confirm').forEach(btn => btn.addEventListener('click', () => markNoticeReadV113(btn.dataset.noticeId)));
}

function v100ThanksBody(item) {
  const from = item.fromDept || item.fromDepartment || '';
  const to = item.toDept || item.targetDept || '';
  const reason = item.reason || '';
  if (from && to) return from + 'の仲間が、' + to + 'の仲間に' + (reason && reason !== 'ありがとう' ? '「' + reason + '」のありがとうを届けました。' : 'ありがとうを届けました。');
  return String(item.publicBody || item.body || 'ありがとうが届きました。').replace(/^❤️\s*/g, '').trim();
}
function v100RenderThanksFlowSummary() {
  const box = document.getElementById('thanksFlowSummary'); if (!box) return;
  const list = v100Timeline();
  const todayKey = v100TodayKey();
  const today = list.filter(item => String(item.createdAt || '').slice(0, 10) === todayKey).length;
  const recent = list.slice(0, 7).length;
  if (!list.length) { box.innerHTML = '<p class="empty-note news-empty">まだありがとうの記録はありません。最初のありがとうを届けてみましょう。</p>'; return; }
  const latest = list[0];
  box.innerHTML = '<div class="thanks-flow-metrics">' +
    '<div><strong>' + v100Num(today) + '件</strong><small>今日</small></div>' +
    '<div><strong>' + v100Num(recent) + '件</strong><small>最近</small></div>' +
    '<div><strong>' + v100Num(list.length) + '件</strong><small>累計</small></div>' +
  '</div><article class="thanks-flow-latest"><span>🕊️</span><div><small>いちばん最近</small><p>' + v100EscapeHtml(v100ThanksBody(latest)) + '</p></div></article>';
}
function v100RenderThanksStories() {
  const box = document.getElementById('thanksStoryList'); if (!box) return;
  const list = v100Timeline().slice(0, 12);
  if (!list.length) { box.innerHTML = '<p class="empty-note news-empty">まだありがとうの出来事はありません。</p>'; return; }
  box.innerHTML = list.map(item => {
    const body = v100ThanksBody(item);
    return '<article class="thanks-story-item"><div class="thanks-story-top"><span class="thanks-story-badge">❤️ ありがとう</span><time>' + v100EscapeHtml(v100RelativeTime(item.createdAt)) + '</time></div><h3>' + v100EscapeHtml(item.title || 'ありがとうが届けられました') + '</h3><p>' + v100EscapeHtml(body) + '</p></article>';
  }).join('');
}

function v100BuildGroupNews() {
  const participant = v100ReadJson('rinchanParticipant', {}) || {};
  const activities = v100Activities();
  const thanks = v100Timeline();
  const todayKey = v100TodayKey();
  const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
  const thisWeekCount = activities.filter(item => { const d = new Date(String(item.date || '') + 'T00:00:00'); return !isNaN(d) && d >= start; }).length;
  const todayCount = activities.filter(item => String(item.date || '').slice(0, 10) === todayKey).length;
  const items = [
    { icon: '📣', tag: 'グループ', title: 'りんちゃん通信へようこそ', body: '病院だけでなく、グループ全体の出来事や応援をここにまとめて表示します。' },
    { icon: '👟', tag: '歩数記録', title: '今日の歩数記録', body: '本日は ' + v100Num(todayCount) + '件の歩数記録があります。' },
    { icon: '🎯', tag: '目標', title: '今週の活動状況', body: '今週は ' + v100Num(thisWeekCount) + '回の活動が記録されています。目標に向けてコツコツいきましょう。' },
    { icon: '❤️', tag: 'ありがとう', title: '応援の広がり', body: 'ありがとうの出来事は現在 ' + v100Num(thanks.length) + '件あります。お互いの頑張りを届け合えます。' }
  ];
  if (participant && (participant.declaration || participant.weeklyGoal)) items.push({ icon: '🙌', tag: 'マイページ', title: 'あなたの宣言も反映中', body: '健康宣言や今週の目標はマイページからいつでも編集できます。' });
  return items;
}
function v100RenderGroupNews() { const box = document.getElementById('groupNewsList'); if (!box) return; box.innerHTML = v100BuildGroupNews().map(item => '<article class="group-news-item"><div class="group-news-icon" aria-hidden="true">' + v100EscapeHtml(item.icon) + '</div><div class="group-news-body"><div class="group-news-meta"><span class="group-news-tag">' + v100EscapeHtml(item.tag) + '</span></div><h3>' + v100EscapeHtml(item.title) + '</h3><p>' + v100EscapeHtml(item.body) + '</p></div></article>').join(''); }
function initNewsPageV100() { if (!document.getElementById('rinchanNewsPage')) return; v100RenderSummary(); v100RenderThanksFlowSummary(); v100RenderNotices(); v100RenderThanksStories(); v100RenderGroupNews(); }
