const RinchanMonthlyChallengeEngine = (() => {
  const VERSION = 'v1.3.8';

  const MONTHLY = {
    1: { icon:'🎍', name:'お正月ウォーク', target:160000, copy:'新しい一年を、無理のない一歩から始めよう。' },
    2: { icon:'💝', name:'ぽかぽかウォーク', target:170000, copy:'寒い日も、少しずつ体をあたためよう。' },
    3: { icon:'🌸', name:'桜チャレンジ', target:200000, copy:'春の杜に向けて、歩みの花を咲かせよう。' },
    4: { icon:'🌱', name:'新緑チャレンジ', target:200000, copy:'新しい季節、若葉のように少しずつ。' },
    5: { icon:'🎏', name:'さわやかウォーク', target:210000, copy:'気持ちのよい季節に、歩く習慣を育てよう。' },
    6: { icon:'☔', name:'雨の日こつこつチャレンジ', target:180000, copy:'雨の日も、できる範囲でこつこつ歩こう。' },
    7: { icon:'🎋', name:'七夕ウォーク', target:200000, copy:'願いをこめて、今月も一歩ずつ。' },
    8: { icon:'🎆', name:'夏祭りチャレンジ', target:220000, copy:'歩いた分だけ、夏の杜がにぎやかになります。' },
    9: { icon:'🌕', name:'月見ウォーク', target:200000, copy:'夜風を感じながら、ゆっくり続けよう。' },
    10:{ icon:'🍁', name:'紅葉ウォーク', target:210000, copy:'秋の杜を楽しみながら歩こう。' },
    11:{ icon:'🍂', name:'落ち葉チャレンジ', target:190000, copy:'少し肌寒い季節も、歩みをつなげよう。' },
    12:{ icon:'🎄', name:'クリスマスチャレンジ', target:180000, copy:'一年の締めくくりに、あたたかい一歩を。' }
  };

  function challenge(date) {
    const d = date || new Date();
    return MONTHLY[d.getMonth() + 1] || { icon:'👟', name:'月間チャレンジ', target:200000, copy:'今月も無理なく歩こう。' };
  }

  function ym(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function getSteps() {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getSteps === 'function') return RinchanStorage.getSteps();
    } catch(e) {}
    try { return JSON.parse(localStorage.getItem('rinchanSteps') || '[]'); } catch(e) { return []; }
  }

  function rowDate(row) {
    return String(row.date || row.activityDate || row.createdAt || row.datetime || '').slice(0, 10);
  }

  function monthlySteps(date) {
    const key = ym(date);
    const rows = getSteps();
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((sum, row) => {
      const d = rowDate(row);
      if (!d || !d.startsWith(key)) return sum;
      return sum + Number(row.steps || row.step || row.count || 0);
    }, 0);
  }

  function daysLeft(date) {
    const d = date || new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.max(0, last - d.getDate() + 1);
  }

  function build(date) {
    const c = challenge(date);
    const current = monthlySteps(date);
    const target = c.target;
    const rate = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const remain = Math.max(0, target - current);
    return {
      version: VERSION,
      ym: ym(date),
      icon: c.icon,
      title: c.icon + ' ' + c.name,
      copy: c.copy,
      target,
      current,
      remain,
      rate,
      achieved: current >= target,
      daysLeft: daysLeft(date),
      message: current >= target ? '今月のチャレンジ達成！すばらしい歩みです。' : c.copy + ' あと' + remain.toLocaleString('ja-JP') + '歩。'
    };
  }

  return { VERSION, build, monthlySteps, challenge };
})();
window.RinchanMonthlyChallengeEngine = RinchanMonthlyChallengeEngine;
