const RinchanNews = (() => {
  const VERSION = 'v1.0.09';

  function readJson(key, fallback) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.writeJson === 'function') return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function employeeId() {
    if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.employeeId === 'function') return RinchanStorage.employeeId();
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  async function api(action, payload) {
    if (typeof RinchanApi !== 'undefined' && RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyResult(result) {
    if (typeof RinchanSync !== 'undefined' && RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result);
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  function readIds() { return readJson('rinchanReadNewsIds', []); }
  function saveReadIds(ids) { return writeJson('rinchanReadNewsIds', Array.from(new Set((ids || []).filter(Boolean)))); }

  function dateKeyFromDate(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return dateKeyFromDate(parsed);
    return raw.slice(0, 10);
  }

  function activities() { return readJson('rinchanActivities', []); }
  function thanksTimeline() { return readJson('rinchanGoodTimeline', []); }
  function sentThanks() { return readJson('rinchanSentThanks', []); }
  function receivedThanks() { return readJson('rinchanReceivedThanks', []); }

  function defaultNotices() {
    return [
      { id: 'notice-welcome', title: 'りんちゃんの杜へようこそ', body: '歩数を記録して、みんなの杜を育てましょう。', createdAt: '2026-07-01T00:00:00+09:00', type: 'notice', icon: '🌱' },
      { id: 'notice-thanks', title: 'ありがとうを届けましょう', body: '杜ページから仲間にありがとうを送れます。', createdAt: '2026-07-01T00:00:00+09:00', type: 'notice', icon: '💌' }
    ];
  }

  function notices() {
    const custom = readJson('rinchanNotices', null);
    return Array.isArray(custom) && custom.length ? custom : defaultNotices();
  }

  function groupNews() {
    const custom = readJson('rinchanGroupNews', null);
    return Array.isArray(custom) && custom.length ? custom : [
      { id: 'group-news-001', title: 'みんなで続ける健康習慣', body: '無理なく、できる範囲で歩数記録を続けましょう。', createdAt: new Date().toISOString(), icon: '🌳', tag: '健康' }
    ];
  }

  function todayKey() { return dateKeyFromDate(new Date()); }

  function renderSummary() {
    const dateEl = document.getElementById('newsSummaryDate');
    const statsEl = document.getElementById('forestSummaryStats');
    if (dateEl) dateEl.textContent = formatMonthDay(new Date());
    if (!statsEl) return;
    const today = todayKey();
    const acts = activities();
    const todayRows = acts.filter(item => normalizeDateKey(item.date || item.createdAt || item.savedAt) === today);
    const todaySteps = todayRows.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const totalSteps = acts.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const thanksCount = thanksTimeline().length + sentThanks().length + receivedThanks().length;
    statsEl.innerHTML = [
      summaryStat('📝', todayRows.length.toLocaleString(), '今日の記録'),
      summaryStat('👟', todaySteps.toLocaleString(), '今日の歩数'),
      summaryStat('🌳', totalSteps.toLocaleString(), '累計歩数'),
      summaryStat('💌', thanksCount.toLocaleString(), 'ありがとう')
    ].join('');
  }

  function summaryStat(icon, value, label) {
    return '<div class="forest-summary-stat"><span class="forest-summary-stat-icon">' + icon + '</span><div><strong>' + value + '</strong><small>' + label + '</small></div></div>';
  }

  function renderThanksFlowSummary() {
    const box = document.getElementById('thanksFlowSummary');
    const list = document.getElementById('thanksStoryList');
    if (!box) return;
    const rows = thanksTimeline().concat(sentThanks()).concat(receivedThanks()).filter(Boolean).slice().sort((a, b) => String(b.createdAt || b.savedAt || '').localeCompare(String(a.createdAt || a.savedAt || '')));
    const latest = rows[0];
    if (!latest) {
      box.innerHTML = '<div class="thanks-flow-empty"><span>💌</span><p>まだありがとうはありません。</p><small>杜ページから、仲間にありがとうを届けられます。</small></div>';
      if (list) list.innerHTML = '';
      return;
    }
    const from = latest.fromName || latest.senderName || 'だれか';
    const to = latest.toName || latest.receiverName || 'だれか';
    const reason = latest.reason || latest.message || 'ありがとう';
    box.innerHTML = '<div class="thanks-flow-latest"><span>💌</span><div><small>最新のありがとう</small><p><strong>' + escapeHtml(from) + '</strong> から <strong>' + escapeHtml(to) + '</strong> へ</p><em>' + escapeHtml(reason) + '</em></div></div>';
    if (list) {
      const compact = rows.slice(1, 4);
      list.innerHTML = compact.length ? '<p class="thanks-inline-heading">最近のありがとう</p>' + compact.map(item => '<div class="thanks-compact-item thanks-story-item"><div class="thanks-story-top"><strong>' + escapeHtml(item.fromName || item.senderName || 'だれか') + ' → ' + escapeHtml(item.toName || item.receiverName || 'だれか') + '</strong><time>' + formatDate(item.createdAt || item.savedAt) + '</time></div><span class="thanks-reason-badge">' + escapeHtml(item.reason || item.message || 'ありがとう') + '</span></div>').join('') : '';
    }
  }

  function renderNotices() {
    const box = document.getElementById('noticeList');
    if (!box) return;
    const read = readIds();
    const rows = notices().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    if (!rows.length) { box.innerHTML = '<p class="empty-note news-empty">お知らせはありません。</p>'; return; }
    box.innerHTML = rows.map(item => {
      const isRead = read.includes(item.id);
      const action = isRead ? '' : '<button type="button" class="notice-confirm" onclick="RinchanNews.markRead(\'' + escapeAttr(item.id) + '\')">確認</button>';
      return '<article class="notice-item ' + (isRead ? 'is-read' : 'unread') + '"><span class="notice-dot">' + escapeHtml(item.icon || (isRead ? '✓' : '🔔')) + '</span><div class="notice-title"><strong>' + escapeHtml(item.title || 'お知らせ') + '</strong><p>' + escapeHtml(item.body || '') + '</p></div><div class="notice-meta-row"><time>' + formatDate(item.createdAt) + '</time><span class="notice-state">' + (isRead ? '既読' : '未読') + '</span>' + action + '</div></article>';
    }).join('');
  }

  function renderGroupNews() {
    const box = document.getElementById('groupNewsList');
    if (!box) return;
    const rows = groupNews().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
    if (!rows.length) { box.innerHTML = '<p class="empty-note news-empty">グループニュースはありません。</p>'; return; }
    box.innerHTML = rows.map(item => '<article class="group-news-item"><div class="group-news-icon">' + escapeHtml(item.icon || '📣') + '</div><div class="group-news-body"><div class="group-news-meta"><span class="group-news-tag">' + escapeHtml(item.tag || 'お知らせ') + '</span><time>' + formatDate(item.createdAt) + '</time></div><h3>' + escapeHtml(item.title || 'グループニュース') + '</h3><p>' + escapeHtml(item.body || '') + '</p></div></article>').join('');
  }

  function unreadCount() { const read = readIds(); return notices().filter(item => !read.includes(item.id)).length; }
  function updateBadges() {
    const count = unreadCount();
    document.querySelectorAll('.notify-badge').forEach(badge => { badge.textContent = String(count); badge.classList.toggle('hidden', count <= 0); });
  }

  async function markRead(newsId) {
    if (!newsId) return;
    const ids = readIds();
    if (!ids.includes(newsId)) ids.push(newsId);
    saveReadIds(ids);
    renderNotices(); updateBadges();
    const id = employeeId();
    if (id) applyResult(await api('markNewsRead', { employeeId: id, newsId }));
  }

  function openNews(newsId) { markRead(newsId); }
  function renderAll() { renderSummary(); renderThanksFlowSummary(); renderNotices(); renderGroupNews(); updateBadges(); }

  function formatMonthDay(value) {
    const d = value instanceof Date ? value : new Date(value || '');
    if (isNaN(d)) return '';
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + days[d.getDay()];
  }

  function formatDate(value) {
    const d = new Date(value || '');
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }

  function install() {
    renderAll();
    window.v100RenderSummary = renderSummary;
    window.v100RenderThanksFlowSummary = renderThanksFlowSummary;
    window.v100RenderThanksStories = renderThanksFlowSummary;
    window.v100RenderNotices = renderNotices;
    window.v100RenderGroupNews = renderGroupNews;
    window.updateNewsBadgesV051 = updateBadges;
    window.updateNewsRowsV051 = renderNotices;
    window.openNews = openNews;
    window.markNoticeReadV113 = markRead;
  }

  document.addEventListener('DOMContentLoaded', install);
  return { VERSION, install, renderAll, renderSummary, renderThanksFlowSummary, renderNotices, renderGroupNews, updateBadges, markRead, openNews, unreadCount };
})();