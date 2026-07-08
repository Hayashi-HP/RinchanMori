const RinchanEmployeeMilestoneEngine = (() => {
  const VERSION = 'v1.3.1';

  function normalizeEmployeeId(value) {
    return String(value || '').replace(/[^0-9]/g, '');
  }

  function parseEmployeeId(value) {
    const id = normalizeEmployeeId(value);
    if (id.length < 7) return null;

    const category = id.slice(0, 1);
    const yy = Number(id.slice(1, 3));
    const month = Number(id.slice(3, 5));
    const serial = id.slice(5, 7);

    if (!yy && yy !== 0) return null;
    if (!month || month < 1 || month > 12) return null;

    let year;
    if (category === '1') {
      year = 1900 + yy;
    } else if (category === '2') {
      year = 2000 + yy;
    } else {
      year = 2000 + yy;
    }

    return {
      employeeId: id,
      category,
      joinYear: year,
      joinMonth: month,
      serial,
      joinYm: year + '-' + String(month).padStart(2, '0')
    };
  }

  function tenureYears(parsed, date) {
    if (!parsed) return null;
    const d = date || new Date();
    let years = d.getFullYear() - parsed.joinYear;
    if ((d.getMonth() + 1) < parsed.joinMonth) years -= 1;
    return Math.max(0, years);
  }

  function tenureLabel(parsed, date) {
    const years = tenureYears(parsed, date);
    if (years === null) return '';
    if (years <= 0) return '入職1年目';
    return '勤続' + years + '年';
  }

  function milestone(parsed, date) {
    const years = tenureYears(parsed, date);
    if (years === null) return null;
    const milestones = [1, 3, 5, 10, 15, 20, 25, 30, 35, 40];
    if (milestones.includes(years)) {
      return { type: 'tenure', years, label: '勤続' + years + '年' };
    }
    return null;
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null'); } catch(e) { return null; }
  }

  function current() {
    const p = participant() || {};
    const employeeId = p.employeeId || p.staffId || p.id || p.code || '';
    const parsed = parseEmployeeId(employeeId);
    if (!parsed) return null;
    return { ...parsed, tenureYears: tenureYears(parsed), tenureLabel: tenureLabel(parsed), milestone: milestone(parsed) };
  }

  return { VERSION, normalizeEmployeeId, parseEmployeeId, tenureYears, tenureLabel, milestone, current };
})();
window.RinchanEmployeeMilestoneEngine = RinchanEmployeeMilestoneEngine;
