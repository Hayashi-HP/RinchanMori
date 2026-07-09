const RinchanMoriCollectionEngine = (() => {
  const VERSION = 'v1.3.5';
  const COLLECTIONS = {
    creatures: [
      { id:'butterfly', icon:'🦋', name:'ちょうちょ', hint:'杜で見つける' },
      { id:'bird', icon:'🐦', name:'小鳥', hint:'杜で見つける' },
      { id:'rabbit', icon:'🐰', name:'うさぎ', hint:'杜で見つける' },
      { id:'squirrel', icon:'🐿️', name:'りす', hint:'杜で見つける' },
      { id:'firefly', icon:'✨', name:'ホタル', hint:'夜の杜で見つける' }
    ],
    flowers: [
      { id:'sakura', icon:'🌸', name:'桜の花', hint:'ありがとうの花' },
      { id:'tulip', icon:'🌷', name:'チューリップ', hint:'花を受け取る' },
      { id:'sunflower', icon:'🌻', name:'ひまわり', hint:'夏の杜' },
      { id:'bouquet', icon:'💐', name:'花束', hint:'ありがとうを集める' }
    ],
    events: [
      { id:'tanabata', icon:'🎋', name:'七夕', hint:'七夕イベント' },
      { id:'summer', icon:'🎆', name:'夏祭り', hint:'夏祭りイベント' },
      { id:'halloween', icon:'🎃', name:'ハロウィン', hint:'ハロウィンイベント' },
      { id:'christmas', icon:'🎄', name:'クリスマス', hint:'クリスマスイベント' },
      { id:'newyear', icon:'🎍', name:'お正月', hint:'お正月イベント' }
    ],
    rare: [
      { id:'gold_rinchan', icon:'👑', name:'金のりんちゃん', hint:'ごくまれに現れる' },
      { id:'rainbow_rinchan', icon:'🌈', name:'虹のりんちゃん', hint:'特別な日に現れる' }
    ]
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  }

  function unlockedSet() {
    const ids = new Set();
    const foundCreatures = readJson('rinchanFoundCreatures', []);
    if (Array.isArray(foundCreatures)) foundCreatures.forEach(id => ids.add('creatures:' + id));
    try { if (localStorage.getItem('rinchanTanabataWishes')) ids.add('events:tanabata'); } catch(e) {}
    try { if (localStorage.getItem('rinchanBirthdayEventShownDate')) ids.add('events:birthday'); } catch(e) {}
    try { if (localStorage.getItem('rinchanThanksHistory')) ids.add('flowers:sakura'); } catch(e) {}
    const now = new Date();
    const m = now.getMonth() + 1;
    if (m === 8) ids.add('events:summer');
    if (m === 10 && now.getDate() >= 20) ids.add('events:halloween');
    if (m === 12 && now.getDate() >= 10 && now.getDate() <= 25) ids.add('events:christmas');
    if (m === 1 && now.getDate() <= 7) ids.add('events:newyear');
    return ids;
  }

  function group(key, title, icon) {
    const ids = unlockedSet();
    const items = (COLLECTIONS[key] || []).map(item => ({ ...item, unlocked: ids.has(key + ':' + item.id) }));
    return { key, title, icon, total: items.length, unlocked: items.filter(i => i.unlocked).length, items };
  }

  function build() {
    return [
      group('creatures', '生き物図鑑', '🦋'),
      group('flowers', '花図鑑', '🌸'),
      group('events', '季節イベント図鑑', '🎪'),
      group('rare', 'レアりんちゃん', '👑')
    ];
  }

  return { VERSION, COLLECTIONS, build };
})();
window.RinchanMoriCollectionEngine = RinchanMoriCollectionEngine;
