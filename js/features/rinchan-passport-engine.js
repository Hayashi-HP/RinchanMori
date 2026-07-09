const RinchanPassportEngine = (() => {
  const VERSION = 'v1.3.2';

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null'); } catch(e) { return null; }
  }

  function displayName() {
    const p = participant() || {};
    return p.nickname || p.nickName || p.displayName || p.name || 'あなた';
  }

  function employeeMilestone() {
    try {
      if (window.RinchanEmployeeMilestoneEngine && typeof RinchanEmployeeMilestoneEngine.current === 'function') {
        return RinchanEmployeeMilestoneEngine.current();
      }
    } catch(e) {}
    return null;
  }

  function stepTotal() {
    try {
      const records = window.RinchanStorage && typeof RinchanStorage.getSteps === 'function' ? RinchanStorage.getSteps() : [];
      return Array.isArray(records) ? records.reduce((sum, row) => sum + Number(row.steps || row.step || 0), 0) : 0;
    } catch(e) { return 0; }
  }

  function stepBadge(total) {
    const n = Number(total || 0);
    if (n >= 10000000) return { icon:'👑', label:'レジェンドウォーカー', level:'legend' };
    if (n >= 5000000) return { icon:'💎', label:'プラチナウォーカー', level:'platinum' };
    if (n >= 1000000) return { icon:'🥇', label:'ゴールドウォーカー', level:'gold' };
    if (n >= 500000) return { icon:'🥈', label:'シルバーウォーカー', level:'silver' };
    if (n >= 100000) return { icon:'🥉', label:'ブロンズウォーカー', level:'bronze' };
    return { icon:'👟', label:'これからの一歩', level:'start' };
  }

  function tenureBadge(milestone) {
    const years = milestone && milestone.tenureYears;
    if (years >= 30) return { icon:'👑', label:'杜のレジェンド', level:'legend' };
    if (years >= 20) return { icon:'🌈', label:'杜の守り人', level:'rainbow' };
    if (years >= 10) return { icon:'🌸', label:'桜バッジ', level:'sakura' };
    if (years >= 5) return { icon:'🌳', label:'大樹バッジ', level:'tree' };
    if (years >= 3) return { icon:'🌿', label:'青葉バッジ', level:'leaf' };
    if (years >= 1) return { icon:'🌱', label:'若葉バッジ', level:'sprout' };
    return { icon:'🌱', label:'新しい仲間', level:'new' };
  }

  function thanksStats() {
    try {
      const list = JSON.parse(localStorage.getItem('rinchanThanksHistory') || '[]');
      if (!Array.isArray(list)) return { sent:0, received:0 };
      const p = participant() || {};
      const id = p.participantId || p.employeeId || p.id || '';
      return list.reduce((acc, row) => {
        if (String(row.fromParticipantId || row.fromId || '') === String(id)) acc.sent += 1;
        if (String(row.toParticipantId || row.toId || '') === String(id)) acc.received += 1;
        return acc;
      }, { sent:0, received:0 });
    } catch(e) { return { sent:0, received:0 }; }
  }

  function thanksBadge(count) {
    const n = Number(count || 0);
    if (n >= 1000) return { icon:'🌈', label:'ありがとうの虹' };
    if (n >= 500) return { icon:'🌹', label:'ありがとうの花束' };
    if (n >= 300) return { icon:'🌺', label:'ありがとう満開' };
    if (n >= 100) return { icon:'🌸', label:'ありがとう百花' };
    return { icon:'💐', label:'ありがとうの芽' };
  }

  function eventHistory() {
    const events = [];
    try { if (localStorage.getItem('rinchanTanabataWishes')) events.push({ icon:'🎋', label:'七夕の願い' }); } catch(e) {}
    try { if (localStorage.getItem('rinchanBirthdayEventShownDate')) events.push({ icon:'🎂', label:'誕生日の杜' }); } catch(e) {}
    return events;
  }

  function build() {
    const milestone = employeeMilestone();
    const totalSteps = stepTotal();
    const thanks = thanksStats();
    return {
      version: VERSION,
      name: displayName(),
      joinYm: milestone ? milestone.joinYm : '',
      tenureLabel: milestone ? milestone.tenureLabel : '',
      tenureYears: milestone ? milestone.tenureYears : null,
      totalSteps,
      badges: [
        tenureBadge(milestone || {}),
        stepBadge(totalSteps),
        thanksBadge(thanks.received)
      ],
      thanks,
      events: eventHistory()
    };
  }

  return { VERSION, build, stepBadge, tenureBadge, thanksBadge };
})();
window.RinchanPassportEngine = RinchanPassportEngine;
