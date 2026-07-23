const RinchanPoints = (() => {
  const VERSION = 'v1.0.0';
  let redeeming = false;

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
    return user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }

  function formatDate(value) {
    const date = new Date(value || '');
    if (isNaN(date.getTime())) return '';
    return (date.getMonth() + 1) + '/' + date.getDate();
  }

  function pointState() {
    return readJson('rinchanPointState', { enabled:false, balance:0, totalEarned:0, recentTransactions:[], rewards:[] }) || {};
  }

  function renderHistory(rows) {
    const box = document.getElementById('pointHistoryList');
    if (!box) return;
    if (!rows.length) {
      box.innerHTML = '<p class="point-empty">まだ「りん」の履歴はありません。</p>';
      return;
    }
    box.innerHTML = rows.slice(0, 5).map(row => {
      const amount = Number(row.amount || 0);
      return '<div class="point-history-row"><div><strong>' + escapeHtml(row.description || 'りんの記録') + '</strong><small>' + escapeHtml(formatDate(row.createdAt)) + '</small></div><span class="' + (amount >= 0 ? 'is-plus' : 'is-minus') + '">' + (amount >= 0 ? '+' : '') + amount.toLocaleString('ja-JP') + 'りん</span></div>';
    }).join('');
  }

  function rewardNote(reward, balance) {
    if (reward.lifetimeLimitReached) return '交換済み・バッジ獲得済み';
    if (reward.monthlyLimitReached) return '今月は交換済みです';
    if (balance < reward.cost) return 'あと' + Number(reward.cost - balance).toLocaleString('ja-JP') + 'りん';
    return '交換できます';
  }

  function renderRewards(rewards, balance) {
    const box = document.getElementById('pointRewardList');
    if (!box) return;
    if (!rewards.length) {
      box.innerHTML = '<p class="point-empty">現在交換できるご褒美はありません。</p>';
      return;
    }
    box.innerHTML = rewards.map(reward => (
      '<article class="point-reward-row"><div><strong>' + escapeHtml(reward.name) + '</strong><small>' + escapeHtml(rewardNote(reward, balance)) + '</small></div><div class="point-reward-action"><span>' + Number(reward.cost || 0).toLocaleString('ja-JP') + 'りん</span><button type="button" data-point-reward="' + escapeHtml(reward.key) + '"' + (reward.canRedeem ? '' : ' disabled') + '>交換</button></div></article>'
    )).join('');
    box.querySelectorAll('[data-point-reward]').forEach(button => {
      button.addEventListener('click', () => redeem(button.getAttribute('data-point-reward')));
    });
  }

  function render() {
    const root = document.getElementById('pointProgramCard');
    if (!root) return;
    const state = pointState();
    const active = state.enabled === true;
    root.classList.toggle('is-paused', !active);
    const paused = document.getElementById('pointProgramPaused');
    const content = document.getElementById('pointProgramContent');
    if (paused) paused.classList.toggle('hidden', active);
    if (content) content.classList.toggle('hidden', !active);
    if (!active) return;
    const balance = Number(state.balance || 0);
    document.getElementById('pointBalance').textContent = balance.toLocaleString('ja-JP') + 'りん';
    document.getElementById('pointTotalEarned').textContent = Number(state.totalEarned || 0).toLocaleString('ja-JP') + 'りん';
    renderHistory(Array.isArray(state.recentTransactions) ? state.recentTransactions : []);
    renderRewards(Array.isArray(state.rewards) ? state.rewards : [], balance);
  }

  function requestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function errorMessage(code) {
    const messages = {
      point_program_disabled:'ポイント制度は現在休止中です。',
      point_reward_disabled:'このご褒美は現在利用できません。',
      point_insufficient_balance:'所持りんが足りません。',
      point_reward_monthly_limit:'りんカフェは月1回までです。',
      point_reward_lifetime_limit:'この限定バッジは獲得済みです。'
    };
    return messages[String(code || '')] || '交換できませんでした。時間をおいてもう一度お試しください。';
  }

  async function redeem(rewardKey) {
    if (redeeming || !rewardKey) return;
    const state = pointState();
    const reward = (state.rewards || []).find(item => String(item.key) === String(rewardKey));
    if (!reward || !reward.canRedeem) return;
    if (!confirm(reward.name + 'に' + Number(reward.cost || 0).toLocaleString('ja-JP') + 'りんを使いますか？')) return;
    redeeming = true;
    try {
      const result = await window.RinchanApi.request('redeemPointReward', {
        employeeId:employeeId(),
        rewardKey,
        requestId:requestId()
      });
      if (!result || !result.ok) throw new Error(String((result && (result.reason || result.error)) || 'redeem_failed'));
      if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') RinchanSync.applyApiResult(result);
      alert(reward.name + 'の交換を受け付けました。');
      render();
    } catch (e) {
      alert(errorMessage(e.message));
    } finally {
      redeeming = false;
    }
  }

  function init() { render(); }
  document.addEventListener('DOMContentLoaded', init);
  return { VERSION, render, redeem };
})();
window.RinchanPoints = RinchanPoints;
