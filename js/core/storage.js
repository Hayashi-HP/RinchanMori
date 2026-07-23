const RinchanStorage = (() => {
  const VERSION = 'v1.0.64';

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function removeMany(keys) {
    (Array.isArray(keys) ? keys : []).forEach(key => localStorage.removeItem(key));
  }

  function getParticipant() {
    return readJson('rinchanParticipant', null);
  }

  function setParticipant(participant) {
    return writeJson('rinchanParticipant', participant || null);
  }

  function employeeId() {
    const participant = getParticipant();
    return participant && (participant.employeeId || participant.id) ? String(participant.employeeId || participant.id) : '';
  }

  function deviceId() {
    let id = localStorage.getItem('rinchanDeviceId');
    if (!id) {
      id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('rinchanDeviceId', id);
    }
    return id;
  }

  function clearUserData() {
    removeMany([
      'rinchanParticipant',
      'rinchanActivities',
      'rinchanThanks',
      'rinchanThanksDaily',
      'rinchanThanksReasons',
      'rinchanGoodTimeline',
      'rinchanDashboardCache',
      'rinchanMoriMembers',
      'rinchanReceivedThanks',
      'rinchanSentThanks',
      'rinchanReadNewsIds',
      'rinchanThanksStats',
      'rinchanAppSettings',
      'rinchanSyncStatus',
      'rinchanLastSyncedAt',
      'rinchanSyncToken',
      'rinchanKnownUsers',
      'rinchanPendingLoginCheck'
    ]);
  }

  return {
    VERSION,
    readJson,
    writeJson,
    removeMany,
    getParticipant,
    setParticipant,
    employeeId,
    deviceId,
    clearUserData
  };
})();
window.RinchanStorage = RinchanStorage;
