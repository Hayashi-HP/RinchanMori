/* Cache helpers */

const CACHE_TTL_SHORT = 60;
const CACHE_TTL_MEDIUM = 300;
const CACHE_TTL_LONG = 1800;

function cacheKey(name) {
  return 'rinchan:' + VERSION + ':' + name;
}

function getScriptCache() {
  return CacheService.getScriptCache();
}

function getCachedJson(name) {
  try {
    const raw = getScriptCache().get(cacheKey(name));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function putCachedJson(name, value, ttlSeconds) {
  try {
    getScriptCache().put(cacheKey(name), JSON.stringify(value), ttlSeconds || CACHE_TTL_SHORT);
  } catch (e) {
    // CacheService failure should not break the app.
  }
  return value;
}

function removeCached(name) {
  try {
    getScriptCache().remove(cacheKey(name));
  } catch (e) {
    // ignore
  }
}

function clearAppCache() {
  ['departments', 'dashboard', 'adminStats'].forEach(removeCached);
  return { cleared: true, at: new Date().toISOString() };
}

function invalidatePointCaches(employeeId) {
  removeCached('point:' + String(employeeId || ''));
  removeCached('dashboard');
  removeCached('adminStats');
}

function getAppCacheStatus() {
  const definitions = [
    { name: 'departments', label: '部署一覧', ttlSeconds: CACHE_TTL_LONG },
    { name: 'dashboard', label: 'ホーム・杜の集計', ttlSeconds: CACHE_TTL_SHORT },
    { name: 'adminStats', label: '管理画面集計', ttlSeconds: CACHE_TTL_SHORT }
  ];
  const cache = getScriptCache();
  const entries = definitions.map(item => {
    let raw = '';
    try { raw = cache.get(cacheKey(item.name)) || ''; } catch (e) { raw = ''; }
    return {
      name: item.name,
      label: item.label,
      active: !!raw,
      ttlSeconds: item.ttlSeconds,
      approximateBytes: raw ? raw.length : 0
    };
  });
  return {
    checkedAt: new Date().toISOString(),
    version: VERSION,
    activeCount: entries.filter(item => item.active).length,
    entries
  };
}

function getCachedDepartments(ss) {
  const cached = getCachedJson('departments');
  if (cached) return cached;
  return putCachedJson('departments', getDepartments(ss), CACHE_TTL_LONG);
}

function getCachedDashboard(ss) {
  const cached = getCachedJson('dashboard');
  if (cached) return cached;
  return putCachedJson('dashboard', getDashboard(ss), CACHE_TTL_SHORT);
}

function getCachedAdminStats(ss) {
  const cached = getCachedJson('adminStats');
  if (cached) return cached;
  return putCachedJson('adminStats', getAdminStats(ss), CACHE_TTL_SHORT);
}

function invalidateActivityCaches() {
  removeCached('dashboard');
  removeCached('adminStats');
}

function invalidateUserCaches() {
  removeCached('dashboard');
  removeCached('adminStats');
}

function invalidateDepartmentCaches() {
  removeCached('departments');
  removeCached('dashboard');
  removeCached('adminStats');
}

function invalidateThanksCaches() {
  removeCached('dashboard');
  removeCached('adminStats');
}
