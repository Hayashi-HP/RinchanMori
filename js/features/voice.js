const RinchanVoice = (() => {
  const VERSION = 'v1.0.37';

  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function participant() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return readJson('rinchanParticipant', null);
    } catch (e) {
      return null;
    }
  }

  function activities() {
    const rows = readJson('rinchanActivities', []);
    return Array.isArray(rows) ? rows : [];
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(value) {
    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return iso[1] + '-' + String(iso[2]).padStart(2, '0') + '-' + String(iso[3]).padStart(2, '0');
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return dateKey(parsed);
    return raw.slice(0, 10);
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function thisWeekKeys() {
    const start = startOfWeek(new Date());
    const keys = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.push(dateKey(d));
    }
    return keys;
  }

  function latestActivityDate(rows) {
    const dates = rows.map(row => normalizeDateKey(row.date || row.createdAt || row.savedAt)).filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : '';
  }

  function daysSince(dateValue) {
    if (!dateValue) return null;
    const parts = normalizeDateKey(dateValue).split('-').map(Number);
    if (parts.length !== 3 || !parts[0]) return null;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.round((base - d) / 86400000));
  }

  function todaySteps(rows) {
    const key = todayKey();
    return rows.filter(row => normalizeDateKey(row.date || row.createdAt || row.savedAt) === key).reduce((sum, row) => sum + Number(row.steps || 0), 0);
  }

  function weekSteps(rows) {
    const keys = new Set(thisWeekKeys());
    return rows.filter(row => keys.has(normalizeDateKey(row.date || row.createdAt || row.savedAt))).reduce((sum, row) => sum + Number(row.steps || 0), 0);
  }

  function activityDays(rows) {
    return Array.from(new Set(rows.map(row => normalizeDateKey(row.date || row.createdAt || row.savedAt)).filter(Boolean))).sort();
  }

  function streakDays(rows) {
    const set = new Set(activityDays(rows));
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (set.has(dateKey(d))) count += 1;
      else if (i > 0) break;
    }
    return count;
  }

  function timeLabel() {
    const h = new Date().getHours();
    if (h < 5) return 'night';
    if (h < 11) return 'morning';
    if (h < 15) return 'noon';
    if (h < 18) return 'afternoon';
    if (h < 22) return 'evening';
    return 'night';
  }

  function baseGreeting() {
    const t = timeLabel();
    if (t === 'morning') return 'おはようございます。';
    if (t === 'noon') return '午前中おつかれさまです。';
    if (t === 'afternoon') return '午後もおつかれさまです。';
    if (t === 'evening') return '今日もおつかれさまです。';
    return '遅い時間までおつかれさまです。';
  }

  function chooseMessage(context) {
    const name = context.name ? context.name + 'さん、' : '';
    if (context.daysSinceLast === null) return name + 'まずは今日の一歩からで大丈夫です。記録すると、あなたの木が育ちはじめます🌱';
    if (context.daysSinceLast >= 7) return name + '久しぶりです。今日からまた小さく再開できれば大丈夫です。りんは待っていました🌱';
    if (context.daysSinceLast >= 3) return name + '少し間が空いても大丈夫です。無理せず、できる範囲でまた歩いてみましょう🌿';
    if (context.todaySteps >= 10000) return name + '今日はたくさん歩けています。ここからは休むことも大事です。水分も忘れずに🌳';
    if (context.todaySteps >= 6000) return name + 'いいペースです。今日の木にしっかり葉っぱが増えています🌿';
    if (context.todaySteps >= 3000) return name + '今日もちゃんと積み重なっています。少しずつで十分です🌱';
    if (context.streak >= 7) return name + context.streak + '日続いています。続けていること自体が、もう立派な健康づくりです🌳';
    if (context.weekGoal && context.remainingWeekSteps <= 0) return name + '今週の目標を達成しています。無理に増やさず、体調優先でいきましょう✨';
    if (context.weekGoal && context.remainingWeekSteps <= 3000) return name + '今週の目標まであと' + context.remainingWeekSteps.toLocaleString() + '歩です。あと少し、無理なくいきましょう🌿';
    const t = timeLabel();
    if (t === 'morning') return name + '朝のうちに少し動くと、今日の木が元気になります。まずは小さな一歩から🌱';
    if (t === 'noon') return name + '午前中おつかれさまです。座りっぱなしなら、少し立つだけでも十分です🌿';
    if (t === 'afternoon') return name + '午後は無理せず、できる範囲で体を動かしましょう。りんも応援しています🌱';
    if (t === 'evening') return name + '今日の分を記録するだけでも大丈夫です。歩数より続けることが大切です🌙';
    return name + '今日はゆっくり休む時間も大切です。記録できたら、それだけで十分です🌙';
  }

  function context() {
    const user = participant() || {};
    const rows = activities();
    const last = latestActivityDate(rows);
    const weekGoal = Number(String(user.weeklyStepGoal || '').replace(/,/g, '')) || 0;
    const week = weekSteps(rows);
    return {
      user,
      name: String(user.nick || user.name || '').trim(),
      todaySteps: todaySteps(rows),
      weekSteps: week,
      weekGoal,
      remainingWeekSteps: Math.max(0, weekGoal - week),
      streak: streakDays(rows),
      daysSinceLast: daysSince(last)
    };
  }

  function message() {
    return chooseMessage(context());
  }

  function render(targetId, mode) {
    const el = document.getElementById(targetId || 'rinchanVoiceMessage');
    if (!el) return;
    const ctx = context();
    const msg = mode === 'complete' ? completeMessage(ctx) : chooseMessage(ctx);
    el.textContent = msg;
  }

  function completeMessage(ctx) {
    if (ctx.todaySteps >= 10000) return 'すごいです。今日はしっかり歩けています。ここからは休むことも大切です🌳';
    if (ctx.weekGoal && ctx.remainingWeekSteps <= 0) return '今週の目標達成です。りん、とてもうれしいです✨';
    if (ctx.streak >= 7) return ctx.streak + '日連続です。続ける力が、あなたの木を育てています🌳';
    if (ctx.todaySteps >= 3000) return '今日の歩みが、あなたの木に新しい葉っぱを増やしました🌿';
    return '記録できました。小さな一歩でも、ちゃんと杜につながっています🌱';
  }

  function install() {
    render('rinchanVoiceMessage');
    render('rinchanCompleteVoiceMessage', 'complete');
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', install);

  return { VERSION, context, message, render, install };
})();
window.RinchanVoice = RinchanVoice;
