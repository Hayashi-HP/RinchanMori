const RinchanBadgeCatalogEngine = (() => {
  const VERSION = 'v1.3.4';

  const CATALOG = [
    { id:'tenure_1', group:'勤続', icon:'🌱', name:'若葉バッジ', hint:'勤続1年' },
    { id:'tenure_5', group:'勤続', icon:'🌳', name:'大樹バッジ', hint:'勤続5年' },
    { id:'tenure_10', group:'勤続', icon:'🌸', name:'桜バッジ', hint:'勤続10年' },
    { id:'tenure_20', group:'勤続', icon:'🌈', name:'杜の守り人', hint:'勤続20年' },
    { id:'steps_100k', group:'歩数', icon:'🥉', name:'ブロンズウォーカー', hint:'10万歩' },
    { id:'steps_500k', group:'歩数', icon:'🥈', name:'シルバーウォーカー', hint:'50万歩' },
    { id:'steps_1m', group:'歩数', icon:'🥇', name:'ゴールドウォーカー', hint:'100万歩' },
    { id:'steps_5m', group:'歩数', icon:'💎', name:'プラチナウォーカー', hint:'500万歩' },
    { id:'thanks_100', group:'ありがとう', icon:'🌸', name:'ありがとう百花', hint:'ありがとう100件' },
    { id:'thanks_300', group:'ありがとう', icon:'🌺', name:'ありがとう満開', hint:'ありがとう300件' },
    { id:'thanks_500', group:'ありがとう', icon:'🌹', name:'ありがとうの花束', hint:'ありがとう500件' },
    { id:'event_tanabata', group:'イベント', icon:'🎋', name:'七夕の願い', hint:'七夕に願いを書く' },
    { id:'event_birthday', group:'イベント', icon:'🎂', name:'誕生日の杜', hint:'誕生日を迎える' },
    { id:'secret_midnight', group:'シークレット', icon:'🌙', name:'夜の杜の訪問者', hint:'???' },
    { id:'secret_flower', group:'シークレット', icon:'💐', name:'花を受け取る人', hint:'???' }
  ];

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function active(value) {
    return value === true || value === 1 || String(value || '').toLowerCase() === 'true' || String(value || '') === '1';
  }

  function configuredCatalog() {
    const configs = readJson('rinchanBadgeConfigs', []);
    const byId = (Array.isArray(configs) ? configs : []).reduce((map, row) => {
      const id = String((row && row.badgeId) || '');
      if (id) map[id] = row;
      return map;
    }, {});
    return CATALOG.map(item => {
      const config = byId[item.id];
      if (!config) return { ...item, active:true };
      return {
        ...item,
        group: String(config.group || item.group),
        icon: String(config.icon || item.icon),
        name: String(config.name || item.name),
        hint: String(config.hint || item.hint),
        active: active(config.active)
      };
    });
  }

  function passport() {
    try {
      if (window.RinchanPassportEngine && typeof RinchanPassportEngine.build === 'function') return RinchanPassportEngine.build();
    } catch(e) {}
    return {};
  }

  function unlockedIds() {
    const p = passport();
    const ids = new Set();
    const years = Number(p.tenureYears || 0);
    const steps = Number(p.totalSteps || 0);
    const received = Number((p.thanks && p.thanks.received) || 0);
    if (years >= 1) ids.add('tenure_1');
    if (years >= 5) ids.add('tenure_5');
    if (years >= 10) ids.add('tenure_10');
    if (years >= 20) ids.add('tenure_20');
    if (steps >= 100000) ids.add('steps_100k');
    if (steps >= 500000) ids.add('steps_500k');
    if (steps >= 1000000) ids.add('steps_1m');
    if (steps >= 5000000) ids.add('steps_5m');
    if (received >= 100) ids.add('thanks_100');
    if (received >= 300) ids.add('thanks_300');
    if (received >= 500) ids.add('thanks_500');
    try { if (localStorage.getItem('rinchanTanabataWishes')) ids.add('event_tanabata'); } catch(e) {}
    try { if (localStorage.getItem('rinchanBirthdayEventShownDate')) ids.add('event_birthday'); } catch(e) {}
    const h = new Date().getHours();
    if (h === 0) ids.add('secret_midnight');
    return ids;
  }

  function build() {
    const ids = unlockedIds();
    return configuredCatalog().filter(item => item.active !== false).map(item => ({ ...item, unlocked: ids.has(item.id) }));
  }

  return { VERSION, CATALOG, build, unlockedIds, configuredCatalog };
})();
window.RinchanBadgeCatalogEngine = RinchanBadgeCatalogEngine;
