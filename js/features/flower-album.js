const RinchanFlowerAlbum = (() => {
  const VERSION = 'v1.0.69';

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

  function employeeId() {
    const user = participant();
    return user && (user.employeeId || user.id) ? String(user.employeeId || user.id) : '';
  }

  function readOpenedFlowerIds() {
    const ids = readJson('rinchanReadThanksFlowerIds', []);
    return Array.isArray(ids) ? ids.map(String) : [];
  }

  function allThanks() {
    return [
      readJson('rinchanReceivedThanks', []),
      readJson('rinchanThanks', []),
      readJson('rinchanSentThanks', []),
      readJson('rinchanGoodTimeline', [])
    ].flat().filter(Boolean);
  }

  function normalize(item) {
    const id = String(item.thanksId || item.id || item.createdAt || JSON.stringify(item));
    return {
      id,
      fromName: item.fromName || item.senderName || item.from || '杜の仲間',
      toName: item.toName || item.receiverName || item.to || '',
      toId: String(item.toParticipantId || item.toEmployeeId || item.receiverId || ''),
      reason: item.reason || 'ありがとう',
      comment: item.comment || item.message || item.body || item.publicBody || '',
      createdAt: item.createdAt || item.savedAt || item.date || '',
      opened: readOpenedFlowerIds().includes(id)
    };
  }

  function receivedFlowers() {
    const me = employeeId();
    const map = {};
    allThanks().forEach(item => {
      const row = normalize(item);
      if (me && row.toId && row.toId !== me) return;
      if (!row.id) return;
      map[row.id] = row;
    });
    return Object.values(map).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function openedFlowers() {
    return receivedFlowers().filter(item => item.opened);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function formatDate(value) {
    const d = new Date(value || '');
    if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function injectStyles() {
    if (document.getElementById('rinchanFlowerAlbumStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanFlowerAlbumStyles';
    style.textContent = [
      '.rinchan-flower-tree-wrap{position:absolute;inset:0;pointer-events:none;overflow:visible}',
      '.rinchan-flower-on-tree{position:absolute;font-size:20px;filter:drop-shadow(0 6px 8px rgba(160,90,120,.15));animation:rinchanFlowerBloom .42s ease-out both}',
      '@keyframes rinchanFlowerBloom{0%{opacity:0;transform:scale(.4) translateY(8px)}70%{opacity:1;transform:scale(1.18) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
      '.flower-album-card{background:linear-gradient(180deg,#fff 0%,#fff7fb 100%);border:1px solid rgba(226,133,178,.20);box-shadow:0 16px 38px rgba(178,103,137,.10)}',
      '.flower-album-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}',
      '.flower-album-stat{border-radius:20px;background:#fff;padding:12px;text-align:center;border:1px solid rgba(226,133,178,.15)}',
      '.flower-album-stat strong{display:block;font-size:24px;color:#513149}.flower-album-stat small{display:block;margin-top:5px;color:#667568;font-weight:900}',
      '.flower-memory-list{display:grid;gap:10px;margin-top:14px}',
      '.flower-memory-item{width:100%;text-align:left;border:1px solid rgba(226,133,178,.18);background:#fff;border-radius:20px;padding:12px;display:flex;gap:10px;align-items:flex-start;cursor:pointer;box-shadow:0 10px 22px rgba(178,103,137,.08)}',
      '.flower-memory-icon{font-size:26px;line-height:1}.flower-memory-main strong{display:block;color:#513149;font-size:15px;line-height:1.45}.flower-memory-main p{margin:5px 0 0;color:#405146;font-weight:800;line-height:1.55}.flower-memory-main time{display:block;margin-top:7px;color:#7a8a7d;font-size:12px;font-weight:900}',
      '.flower-memory-empty{padding:16px;text-align:center;color:#667568;font-weight:900;line-height:1.7;background:#fff;border-radius:20px;border:1px dashed rgba(226,133,178,.26)}'
    ].join('');
    document.head.appendChild(style);
  }

  function renderHomeFlowers() {
    injectStyles();
    const treeWorld = document.querySelector('.tree-world') || document.querySelector('.growth-world');
    if (!treeWorld) return;
    if (getComputedStyle(treeWorld).position === 'static') treeWorld.style.position = 'relative';
    let wrap = treeWorld.querySelector('.rinchan-flower-tree-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'rinchan-flower-tree-wrap';
      treeWorld.appendChild(wrap);
    }
    wrap.innerHTML = '';
    const flowers = openedFlowers().slice(0, 12);
    flowers.forEach((item, i) => {
      const el = document.createElement('span');
      el.className = 'rinchan-flower-on-tree';
      el.textContent = '🌸';
      el.title = item.fromName + 'さんからのありがとう';
      el.style.left = (28 + ((i * 17) % 46)) + '%';
      el.style.top = (16 + ((i * 23) % 48)) + '%';
      el.style.animationDelay = ((i % 5) * .08) + 's';
      wrap.appendChild(el);
    });
    const title = document.getElementById('treeTitle');
    const text = document.getElementById('treeText');
    if (flowers.length && title) title.textContent = 'ありがとうの花が咲いています';
    if (flowers.length && text) text.textContent = 'あなたの木に、届いたありがとうの花が' + flowers.length + '輪咲いています🌸';
  }

  function renderMypageAlbum() {
    injectStyles();
    if (!document.getElementById('mypageV070')) return;
    let card = document.getElementById('flowerAlbumCard');
    if (!card) {
      card = document.createElement('section');
      card.id = 'flowerAlbumCard';
      card.className = 'card flower-album-card';
      const anchor = document.querySelector('.received-thanks-card') || document.querySelector('.v070-profile');
      if (anchor) anchor.insertAdjacentElement('afterend', card);
    }
    const all = receivedFlowers();
    const opened = all.filter(item => item.opened);
    card.innerHTML = [
      '<p class="label">🌸 ありがとうの花</p>',
      '<h2>花アルバム</h2>',
      '<div class="flower-album-grid">',
      '<div class="flower-album-stat"><strong>' + opened.length.toLocaleString('ja-JP') + '輪</strong><small>咲いた花</small></div>',
      '<div class="flower-album-stat"><strong>' + all.length.toLocaleString('ja-JP') + '通</strong><small>届いたありがとう</small></div>',
      '</div>',
      '<div class="flower-memory-list" id="flowerMemoryList">' + flowerListHtml(all.slice(0, 12)) + '</div>'
    ].join('');
  }

  function flowerListHtml(rows) {
    if (!rows.length) return '<p class="flower-memory-empty">まだ花は届いていません。<br>ありがとうが届くと、ここに思い出として残ります🌸</p>';
    return rows.map(row => {
      const body = row.comment || row.reason || 'ありがとう';
      return '<button type="button" class="flower-memory-item" onclick="RinchanFlowerAlbum.openFlower(\'' + escapeHtml(row.id).replace(/`/g, '&#96;') + '\')"><span class="flower-memory-icon">' + (row.opened ? '🌸' : '🌷') + '</span><span class="flower-memory-main"><strong>' + escapeHtml(row.fromName) + 'さんより</strong><p>' + escapeHtml(body) + '</p><time>' + formatDate(row.createdAt) + (row.opened ? '　開花済み' : '　未開花') + '</time></span></button>';
    }).join('');
  }

  function openFlower(id) {
    const row = receivedFlowers().find(item => String(item.id) === String(id));
    if (!row) return;
    const body = row.comment || row.reason || 'ありがとう';
    if (window.RinchanModal && typeof RinchanModal.show === 'function') {
      RinchanModal.show({
        speech: row.fromName + 'さんからの\nありがとうの花だよ🌸',
        note: '「' + body + '」\n\n' + formatDate(row.createdAt),
        primaryText: '受け取ったよ♪',
        hideClose: true
      });
    } else {
      alert(row.fromName + 'さんより\n「' + body + '」');
    }
  }

  function renderAll() {
    renderHomeFlowers();
    renderMypageAlbum();
  }

  function install() {
    renderAll();
    setTimeout(renderAll, 250);
    setTimeout(renderAll, 900);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 80));

  return { VERSION, renderAll, renderHomeFlowers, renderMypageAlbum, openFlower, receivedFlowers, openedFlowers };
})();
window.RinchanFlowerAlbum = RinchanFlowerAlbum;
