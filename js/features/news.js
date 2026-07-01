const RinchanNews = (() => {
  const VERSION = 'v0.9.61';

  function readJson(key, fallback) {
    if (window.RinchanStorage) return RinchanStorage.readJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (window.RinchanStorage) return RinchanStorage.writeJson(key, value);
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function participant() {
    if (window.RinchanStorage) return RinchanStorage.getParticipant();
    return readJson('rinchanParticipant', null);
  }

  function employeeId() {
    if (window.RinchanStorage) return RinchanStorage.employeeId();
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  async function api(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    if (typeof rinchanApi === 'function') return rinchanApi(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyResult(result) {
    if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result);
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  function readIds() {
    return readJson('rinchanReadNewsIds', []);
  }

  function saveReadIds(ids) {
    return writeJson('rinchanReadNewsIds', Array.from(new Set((ids || []).filter(Boolean))));
  }

  function defaultNotices() {
    return [
      {
        id: 'notice-welcome',
        title: 'りんちゃんの杜へようこそ',
        body: '歩数を記録して、みんなの杜を育てましょう。',
        createdAt: '2026-07-01T00:00:00+09:00',
        type: 'notice'
      },
      {
        id: 'notice-thanks',
        title: 'ありがとうを届けましょう',
        body: '杜ページから仲間にありがとうを送れます。',
        createdAt: '2026-07-01T00:00:00+09:00',
        type: 'notice'
      }
    ];
  }

  function notices() {
    const custom = readJson('rinchanNotices', null);
    return Array.isArray(custom) && custom.length ? custom : defaultNotices();
  }

  function groupNews() {
    const custom = readJson('rinchanGroupNews', null);
    return Array.isArray(custom) && custom.length ? custom : [
      {
        id: 'group-news-001',
        title: 'みんなで続ける健康習慣',
        body: '無理なく、できる範囲で歩数記録を続けましょう。',
        createdAt: new Date().toISOString()
      }
    ];
  }

  function activities() {
    return readJson('rinchanActivities', []);
  }

  function thanksTimeline() {
    return readJson('rinchanGoodTimeline', []);
  }

  function renderSummary() {
    const dateEl = document.getElementById('newsSummaryDate');
    const statsEl = document.getElementById('forestSummaryStats');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = (now.getMonth() + 1) + '/' + now.getDate();
    }
    if (!statsEl) return;

    const today = todayKey();
    const acts = activities();
    const todayActivities = acts.filter(item => String(item.date || '').slice(0, 10) === today);
    const todaySteps = todayActivities.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const thanksCount = thanksTimeline().length;

    statsEl.innerHTML = [
      '<div><strong>' + todayActivities.length.toLocaleString() + '</strong><small>今日の記録</small></div>',
      '<div><strong>' + todaySteps.toLocaleString() + '</strong><small>今日の歩数</small></div>',
      '<div><strong>' + thanksCount.toLocaleString() + '</strong><small>ありがとう</small></div>'
    ].join('');
  }

  function renderNotices() {
    const box = document.getElementById('noticeList');
    if (!box) return;
    const read = readIds();
    const rows = notices().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    if (!rows.length) {
      box.innerHTML = '<p class="empty-note news-empty">お知らせはありません。</p>';
      return;
    }

    box.innerHTML = rows.map(item => {
      const isRead = read.includes(item.id);
      return '<div class="notice-row ' + (isRead ? 'is-read' : 'is-unread') + '" data-notice-id="' + escapeAttr(item.id) + '"><div><strong>' + escapeHtml(item.title || 'お知らせ') + '</strong><p>' + escapeHtml(item.body || '') + '</p><small>' + formatDate(item.createdAt) + '</small></div><button type="button" class="notice-confirm" onclick="RinchanNews.markRead(\'' + escapeAttr(item.id) + '\')">' + (isRead ? '既読' : '確認') + '</button></div>';
    }).join('');
  }

  function renderGroupNews() {
    const box = document.getElementById('groupNewsList');
    if (!box) return;
    const rows = groupNews().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
    if (!rows.length) {
      box.innerHTML = '<p class="empty-note news-empty">グループニュースはありません。</p>';
      return;
    }
    box.innerHTML = rows.map(item => '<div class="group-news-row"><strong>' + escapeHtml(item.title || 'グループニュース') + '</strong><p>' + escapeHtml(item.body || '') + '</p><small>' + formatDate(item.createdAt) + '</small></div>').join('');
  }

  function unreadCount() {
    const read = readIds();
    return notices().filter(item => !read.includes(item.id)).length;
  }

  function updateBadges() {
    const count = unreadCount();
    document.querySelectorAll('.notify-badge').forEach(badge => {
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count <= 0);
    });
  }

  async function markRead(newsId) {
    if (!newsId) return;
    const ids = readIds();
    if (!ids.includes(newsId)) ids.push(newsId);
    saveReadIds(ids);
    renderNotices();
    updateBadges();

    const id = employeeId();
    if (id) {
      const result = await api('markNewsRead', { employeeId: id, newsId });
      applyResult(result);
    }
  }

  function openNews(newsId) {
    markRead(newsId);
  }

  function renderAll() {
    renderSummary();
    renderNotices();
    renderGroupNews();
    updateBadges();
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(value) {
    const d = new Date(value || '');
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function install() {
    renderAll();
    window.v100RenderSummary = renderSummary;
    window.v100RenderNotices = renderNotices;
    window.v100RenderGroupNews = renderGroupNews;
    window.updateNewsBadgesV051 = updateBadges;
    window.updateNewsRowsV051 = renderNotices;
    window.openNews = openNews;
    window.markNoticeReadV113 = markRead;
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    renderAll,
    renderSummary,
    renderNotices,
    renderGroupNews,
    updateBadges,
    markRead,
    openNews,
    unreadCount
  };
})();
