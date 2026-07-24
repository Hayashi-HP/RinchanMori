const RinchanAdminSettings = (() => {
  const VERSION = 'v1.1.0';
  const state = { loading:false, saving:false };

  function byId(id) { return document.getElementById(id); }
  function participant() {
    try {
      if (window.RinchanApi && typeof RinchanApi.authState === 'function') return RinchanApi.authState().user || null;
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    } catch (e) { return null; }
  }

  function authState() {
    const user = participant();
    const employeeId = user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
    const role = String((user && user.role) || '').toLowerCase();
    const isAdmin = !!(user && (String(user.admin || '') === '1' || user.admin === true || role === 'admin' || role === 'system'));
    return { employeeId, loggedIn:!!employeeId, isAdmin };
  }

  function guardPageAccess() {
    const auth = authState();
    if (!auth.loggedIn) { alert('ログイン後に管理画面をご利用ください。'); location.href = 'login.html'; return false; }
    if (!auth.isAdmin) { location.href = 'mypage.html'; return false; }
    return true;
  }

  async function api(action, payload) {
    if (window.RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {});
    return { ok:false, error:'api_not_ready' };
  }

  function formatDate(value) {
    const date = new Date(value || '');
    if (isNaN(date)) return '初期設定';
    return date.getFullYear() + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function setStatus(text, error) {
    const el = byId('adminSettingsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setMessage(text, type) {
    const el = byId('adminSettingsMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success','is-error','is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setPointMessage(text, type) {
    const el = byId('adminPointSettingsMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success','is-error','is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setRefreshBusy(busy) {
    const button = byId('adminSettingsRefresh');
    if (!button) return;
    button.disabled = !!busy || state.saving;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? '設定を更新中' : '設定を更新');
    if (byId('adminSettingsSave')) byId('adminSettingsSave').disabled = !!busy || state.saving;
  }

  function applySettings(settings) {
    const goal = Number(settings.defaultWeeklyStepGoal || 56000);
    const days = Number(settings.inactivityAlertDays || 7);
    byId('adminSettingWeeklyGoal').value = goal;
    byId('adminSettingInactiveDays').value = days;
    byId('adminSettingGoalSummary').textContent = goal.toLocaleString('ja-JP') + '歩';
    byId('adminSettingInactiveSummary').textContent = days + '日';
    byId('adminSettingVersion').textContent = String(settings.version || '-');
    applyPointProgram(settings.pointProgram || { enabled:false, rules:[], rewards:[] });
    try { localStorage.setItem('rinchanAppSettings', JSON.stringify(settings)); } catch (e) {}
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }

  function pointRow(item, kind) {
    const value = kind === 'rule' ? Number(item.amount || 0) : Number(item.cost || 0);
    const suffix = kind === 'rule' ? '付与H' : '必要H';
    return '<article class="admin-point-config-row" data-point-kind="' + kind + '" data-point-key="' + escapeHtml(item.key) + '">' +
      '<label class="admin-point-name"><span>名称</span><input class="point-config-name" type="text" maxlength="80" value="' + escapeHtml(item.name) + '" required></label>' +
      '<label class="admin-point-row-toggle"><input class="point-config-enabled" type="checkbox"' + (item.enabled ? ' checked' : '') + '><span aria-hidden="true"></span><strong>ON</strong></label>' +
      '<label class="admin-point-value"><span>' + suffix + '</span><input class="point-config-value" type="number" inputmode="numeric" min="' + (kind === 'rule' ? '0' : '1') + '" max="' + (kind === 'rule' ? '100000' : '10000000') + '" step="1" value="' + value + '" required></label>' +
      (item.monthlyLimit ? '<small class="admin-point-limit">月' + Number(item.monthlyLimit) + '回まで</small>' : '') +
      '</article>';
  }

  function applyPointProgram(program) {
    const enabled = program && program.enabled === true;
    byId('adminPointEnabled').checked = enabled;
    byId('adminPointEnabledLabel').textContent = enabled ? '運用中' : '休止中';
    byId('adminPointStatusSummary').textContent = enabled ? 'ON' : 'OFF';
    byId('adminPointStatusSummary').classList.toggle('is-paused', !enabled);
    byId('adminPointRules').innerHTML = (program.rules || []).map(item => pointRow(item, 'rule')).join('');
    byId('adminPointRewards').innerHTML = (program.rewards || []).map(item => pointRow(item, 'reward')).join('');
  }

  function collectPointRows(kind) {
    return Array.from(document.querySelectorAll('[data-point-kind="' + kind + '"]')).map(row => ({
      key:String(row.getAttribute('data-point-key') || ''),
      name:String(row.querySelector('.point-config-name').value || '').trim(),
      enabled:!!row.querySelector('.point-config-enabled').checked,
      [kind === 'rule' ? 'amount' : 'cost']:Number(String(row.querySelector('.point-config-value').value || '').trim())
    }));
  }

  function pointPayload() {
    return {
      enabled:!!byId('adminPointEnabled').checked,
      rules:collectPointRows('rule'),
      rewards:collectPointRows('reward')
    };
  }

  function validatePointProgram(program) {
    const all = [].concat(program.rules || [], program.rewards || []);
    if (all.some(item => !String(item.name || '').trim())) return '名称を入力してください。';
    if ((program.rules || []).some(item => !Number.isInteger(item.amount) || item.amount < 0 || item.amount > 100000)) return '付与Hは0〜100,000の整数で入力してください。';
    if ((program.rewards || []).some(item => !Number.isInteger(item.cost) || item.cost < 1 || item.cost > 10000000)) return '必要Hは1〜10,000,000の整数で入力してください。';
    return '';
  }

  async function loadSettings() {
    if (state.loading || state.saving) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('設定を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminSettings', { employeeId:auth.employeeId });
      if (!result || !result.ok || !result.settings) throw new Error(String((result && (result.reason || result.error)) || 'settings_failed'));
      applySettings(result.settings);
      setStatus('最終更新 ' + formatDate(result.settings.updatedAt), false);
      setMessage('', 'info');
    } catch (e) {
      setStatus('設定を取得できませんでした。', true);
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。', 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function inputNumber(id) { return Number(String(byId(id).value || '').trim()); }
  function validate() {
    const goal = inputNumber('adminSettingWeeklyGoal');
    const days = inputNumber('adminSettingInactiveDays');
    if (!Number.isInteger(goal) || goal < 7000 || goal > 1000000) return '標準週間目標は7,000〜1,000,000歩の整数で入力してください。';
    if (!Number.isInteger(days) || days < 1 || days > 90) return '記録なし判定は1〜90日の整数で入力してください。';
    return '';
  }

  function errorMessage(code) {
    const messages = {
      default_weekly_step_goal_integer_required:'標準週間目標は数字で入力してください。',
      default_weekly_step_goal_out_of_range:'標準週間目標は7,000〜1,000,000歩で入力してください。',
      inactivity_alert_days_integer_required:'記録なし判定は数字で入力してください。',
      inactivity_alert_days_out_of_range:'記録なし判定は1〜90日で入力してください。'
    };
    return messages[String(code || '')] || '設定を保存できませんでした。時間をおいてもう一度お試しください。';
  }

  async function saveSettings(event) {
    if (event) event.preventDefault();
    if (state.saving) return;
    const validation = validate();
    if (validation) { setMessage(validation, 'error'); return; }
    state.saving = true;
    const saveButton = byId('adminSettingsSave');
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = '保存中...'; }
    if (byId('adminSettingsRefresh')) byId('adminSettingsRefresh').disabled = true;
    setMessage('設定を保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminSaveSettings', {
        employeeId:auth.employeeId,
        defaultWeeklyStepGoal:inputNumber('adminSettingWeeklyGoal'),
        inactivityAlertDays:inputNumber('adminSettingInactiveDays')
      });
      if (!result || !result.ok || !result.settings) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      applySettings(result.settings);
      setStatus('最終更新 ' + formatDate(result.settings.updatedAt), false);
      setMessage('設定を保存しました。ほかの端末には次回同期時に反映されます。', 'success');
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.saving = false;
      if (saveButton) { saveButton.disabled = false; saveButton.textContent = '設定を保存'; }
      if (byId('adminSettingsRefresh')) byId('adminSettingsRefresh').disabled = false;
    }
  }

  async function savePointSettings(event) {
    if (event) event.preventDefault();
    if (state.saving) return;
    const pointProgram = pointPayload();
    const validation = validatePointProgram(pointProgram);
    if (validation) { setPointMessage(validation, 'error'); return; }
    state.saving = true;
    const button = byId('adminPointSettingsSave');
    if (button) { button.disabled = true; button.textContent = '保存中...'; }
    if (byId('adminSettingsRefresh')) byId('adminSettingsRefresh').disabled = true;
    setPointMessage('H設定を保存しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminSavePointSettings', { employeeId:auth.employeeId, pointProgram });
      if (!result || !result.ok || !result.pointProgram) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      applyPointProgram(result.pointProgram);
      setPointMessage('H設定を保存しました。変更後の付与から反映されます。', 'success');
      setStatus('最終更新 ' + formatDate(result.pointProgram.updatedAt), false);
    } catch (e) {
      setPointMessage(errorMessage(e.message), 'error');
    } finally {
      state.saving = false;
      if (button) { button.disabled = false; button.textContent = 'H設定を保存'; }
      if (byId('adminSettingsRefresh')) byId('adminSettingsRefresh').disabled = false;
    }
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminSettingsRefresh').addEventListener('click', loadSettings);
    byId('adminSettingsForm').addEventListener('submit', saveSettings);
    byId('adminPointSettingsForm').addEventListener('submit', savePointSettings);
    byId('adminPointEnabled').addEventListener('change', () => {
      byId('adminPointEnabledLabel').textContent = byId('adminPointEnabled').checked ? '運用中' : '休止中';
    });
    loadSettings();
  }

  return { VERSION, init, loadSettings };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminSettings.init);
