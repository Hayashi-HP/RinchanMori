const RinchanAdminActivity = (() => {
  const VERSION = 'v1.0.0';
  const MAX_STEPS = 200000;
  const LIST_TIMEOUT_MS = 12000;
  const SAVE_TIMEOUT_MS = 20000;
  const state = {
    rows: [],
    selected: null,
    loading: false,
    saving: false,
    searchTimer: null
  };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function setText(id, text) { const el = byId(id); if (el) el.textContent = text; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
  function readJson(key, fallback) {
    try {
      if (window.RinchanStorage && typeof RinchanStorage.readJson === 'function') return RinchanStorage.readJson(key, fallback);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function normalizeDateKey(raw) {
    const text = String(raw || '').trim();
    const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return match[1] + '-' + String(match[2]).padStart(2, '0') + '-' + String(match[3]).padStart(2, '0');
    const parsed = new Date(text);
    if (isNaN(parsed.getTime())) return '';
    return parsed.getFullYear() + '-' + String(parsed.getMonth() + 1).padStart(2, '0') + '-' + String(parsed.getDate()).padStart(2, '0');
  }

  function cachedActivities() {
    const all = readJson('rinchanAllActivities', []);
    const own = readJson('rinchanActivities', []);
    return Array.isArray(all) && all.length ? all : (Array.isArray(own) ? own : []);
  }

  function mergeCachedSteps(rows, dateKey) {
    const byEmployee = {};
    cachedActivities().forEach(item => {
      if (normalizeDateKey(item.date || item.createdAt || item.savedAt) !== dateKey) return;
      const id = String(item.participantId || item.employeeId || item.id || '').trim();
      if (!id) return;
      const current = byEmployee[id];
      const currentAt = current ? String(current.savedAt || current.createdAt || '') : '';
      const nextAt = String(item.savedAt || item.createdAt || '');
      if (!current || nextAt >= currentAt) byEmployee[id] = item;
    });
    return (Array.isArray(rows) ? rows : []).map(row => {
      const serverSteps = row.currentSteps !== undefined && row.currentSteps !== null ? row.currentSteps : row.steps;
      const normalized = Object.assign({}, row, {
        currentSteps: Number(serverSteps || 0),
        hasRecord: !!(row.hasRecord || row.activityId || Number(serverSteps || 0) > 0)
      });
      if (normalized.hasRecord) return normalized;
      const cached = byEmployee[String(normalized.employeeId || '').trim()];
      if (!cached) return normalized;
      return Object.assign({}, normalized, {
        currentSteps: Number(cached.steps || 0),
        source: '同期済みデータ',
        updatedAt: String(cached.savedAt || cached.createdAt || ''),
        activityId: String(cached.activityId || ''),
        hasRecord: true
      });
    });
  }

  function authState() {
    if (window.RinchanApi && typeof RinchanApi.authState === 'function') return RinchanApi.authState();
    let user = null;
    try {
      if (window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') user = RinchanStorage.getParticipant();
      else user = JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    } catch (e) {}
    const employeeId = user && (user.employeeId || user.id || user.participantId) ? String(user.employeeId || user.id || user.participantId) : '';
    const isAdmin = !!(user && (String(user.admin || '') === '1' || user.admin === true || String(user.role || '').toLowerCase() === 'admin'));
    return { user, employeeId, loggedIn: !!employeeId, isAdmin };
  }

  function denyAndRedirect(message, url) {
    try {
      if (url === 'mypage.html') sessionStorage.setItem('rinchanAdminAccessNotice', message);
      else alert(message);
    } catch (e) {}
    location.href = url;
  }

  function guardPageAccess() {
    const a = authState();
    if (!a.loggedIn) {
      denyAndRedirect('ログイン後に管理画面をご利用ください。', 'login.html');
      return false;
    }
    if (!a.isAdmin) {
      denyAndRedirect('管理者のみ利用できます。', 'mypage.html');
      return false;
    }
    return true;
  }

  async function api(action, payload, timeoutMs) {
    if (!(window.RinchanApi && typeof RinchanApi.request === 'function')) return { ok: false, error: 'api_not_ready' };
    try {
      const wait = Number(timeoutMs) > 0 ? Number(timeoutMs) : LIST_TIMEOUT_MS;
      const timeout = new Promise(resolve => setTimeout(() => resolve({ ok: false, error: 'api_timeout', reason: 'api_timeout' }), wait));
      const response = await Promise.race([RinchanApi.request(action, payload || {}), timeout]);
      return response || { ok: false, error: 'empty_response' };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : 'api_error' };
    }
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatAt(raw) {
    if (!raw) return '-';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleString('ja-JP');
  }

  function setStatus(text, isError) {
    const box = byId('adminActivityStatus');
    if (!box) return;
    box.textContent = text;
    box.classList.toggle('is-error', !!isError);
  }

  function setRefreshBusy(busy) {
    const button = byId('adminActivityRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? '歩数一覧を更新中' : '歩数一覧を更新');
  }

  function setMessage(text, type) {
    const box = byId('adminActivityMessage');
    if (!box) return;
    box.textContent = text || '';
    box.classList.remove('is-success', 'is-error', 'is-info');
    if (!text) return;
    box.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function showListMessage(text, isError) {
    const box = byId('adminActivityList');
    if (!box) return;
    box.innerHTML = '<p class="admin-empty' + (isError ? ' is-error' : '') + '">' + escapeHtml(text || '') + '</p>';
  }

  function explainApiFailure(result) {
    const raw = result && (result.error || result.reason || result.message || result.msg)
      ? String(result.error || result.reason || result.message || result.msg)
      : 'api_error';
    const lower = raw.toLowerCase();

    if (lower === 'api_not_ready' || lower === 'api_url_empty') {
      return {
        status: 'APIが呼び出せません。',
        message: 'API設定を確認してください。(' + raw + ')',
        list: '一覧を取得できませんでした。API設定を確認してください。'
      };
    }

    if (lower === 'api_timeout' || lower === 'network_error' || lower === 'network_response_error' || lower.indexOf('failed to fetch') >= 0) {
      return {
        status: 'API通信に失敗しました。',
        message: '通信エラーが発生しました。(' + raw + ')',
        list: '一覧を取得できませんでした。通信状態を確認してください。'
      };
    }

    return {
      status: 'APIエラーが発生しました。',
      message: 'APIエラー: ' + raw,
      list: '一覧を取得できませんでした。(' + raw + ')'
    };
  }

  function updateDeptOptions(list) {
    const select = byId('adminActivityDept');
    if (!select) return;
    const keep = select.value || '';
    const options = ['<option value="">全部署</option>']
      .concat((Array.isArray(list) ? list : []).map(dept => '<option value="' + escapeHtml(dept) + '">' + escapeHtml(dept) + '</option>'));
    select.innerHTML = options.join('');
    select.value = keep;
  }

  function renderRows() {
    const box = byId('adminActivityList');
    if (!box) return;
    if (!state.rows.length) {
      box.innerHTML = '<p class="admin-empty">対象データがありません。</p>';
      return;
    }
    box.innerHTML = state.rows.map(row => (
      '<details class="admin-activity-row">' +
        '<summary class="admin-activity-summary">' +
          '<span class="admin-activity-main">' +
          '<strong>' + escapeHtml(row.name || row.employeeId || '-') + '</strong>' +
          '<small>社員番号 ' + escapeHtml(row.employeeId || '-') + ' / ' + escapeHtml(row.dept || '所属未設定') + '</small>' +
          '</span>' +
          '<span class="admin-activity-summary-steps">' + (row.hasRecord ? '<b>' + Number(row.currentSteps || 0).toLocaleString('ja-JP') + '</b><small>歩</small>' : '<b class="is-empty">記録なし</b>') + '</span>' +
        '</summary>' +
        '<div class="admin-activity-row-detail">' +
          '<div class="admin-activity-meta">' +
          '<span>登録元 ' + escapeHtml(row.source || '-') + '</span>' +
          '<span>更新 ' + escapeHtml(formatAt(row.updatedAt || '')) + '</span>' +
          '</div>' +
          '<div class="admin-activity-action">' +
            '<button type="button" class="soft-button admin-correct-button" data-employee-id="' + escapeHtml(row.employeeId || '') + '">修正</button>' +
          '</div>' +
        '</div>' +
      '</details>'
    )).join('');
  }

  function selectRow(employeeId) {
    const row = state.rows.find(item => String(item.employeeId) === String(employeeId));
    if (!row) return;
    state.selected = row;
    byId('adminActivityEditor').classList.remove('hidden');
    setText('adminActivityTarget', (row.name || row.employeeId) + '（' + (row.employeeId || '-') + ' / ' + (row.dept || '所属未設定') + '）');
    byId('adminCurrentSteps').value = Number(row.currentSteps || 0).toLocaleString('ja-JP');
    byId('adminNewSteps').value = '';
    byId('adminEditReason').value = '';
    setMessage('', 'info');
    byId('adminActivityEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { const input = byId('adminNewSteps'); if (input) input.focus(); }, 180);
  }

  function clearSelection() {
    state.selected = null;
    byId('adminActivityEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function normalizeReason() {
    return String(value('adminEditReason') || '').trim();
  }

  function validate() {
    if (!state.selected) return { ok: false, error: '対象者を選択してください。' };
    const raw = value('adminNewSteps');
    if (!raw) return { ok: false, error: '新しい歩数を入力してください。' };
    if (!/^\d+$/.test(raw)) return { ok: false, error: '歩数は0以上の整数で入力してください。' };
    const steps = Number(raw);
    if (!isFinite(steps) || steps < 0) return { ok: false, error: '歩数は0以上で入力してください。' };
    if (steps > MAX_STEPS) return { ok: false, error: '歩数が上限を超えています。' };
    if (Number(state.selected.currentSteps || 0) === steps) return { ok: false, error: '現在歩数と同じ値には変更できません。' };
    const reason = normalizeReason();
    if (!reason) return { ok: false, error: '修正理由を入力してください。' };
    return { ok: true, steps, reason };
  }

  function setSaveBusy(busy) {
    const button = byId('adminEditSave');
    if (!button) return;
    button.disabled = !!busy;
    button.textContent = busy ? '保存中...' : '保存';
  }

  async function loadRows(options) {
    const opt = options || {};
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('一覧を読み込み中...', false);
    if (!opt.preserveMessage) setMessage('', 'info');
    try {
      const auth = authState();
      const result = await api('adminActivityRows', {
        employeeId: auth.employeeId,
        date: value('adminActivityDate'),
        query: value('adminActivityQuery'),
        dept: value('adminActivityDept')
      }, LIST_TIMEOUT_MS);

      if (!result || !result.ok || !result.data) {
        const detail = explainApiFailure(result || { error: 'api_error' });
        state.rows = [];
        showListMessage(detail.list, true);
        setStatus(detail.status, true);
        setMessage(detail.message, 'error');
        return;
      }

      const dateText = result.data.date || value('adminActivityDate');
      state.rows = mergeCachedSteps(Array.isArray(result.data.rows) ? result.data.rows : [], dateText);
      updateDeptOptions(result.data.departments || []);
      try {
        renderRows();
      } catch (renderError) {
        const reason = renderError && renderError.message ? renderError.message : 'render_failed';
        state.rows = [];
        showListMessage('一覧の描画に失敗しました。画面を再読み込みしてください。', true);
        setStatus('一覧の描画に失敗しました。', true);
        setMessage('描画エラー: ' + reason, 'error');
        return;
      }

      setStatus('対象日 ' + dateText + ' / ' + state.rows.length + '件', false);
      if (!state.rows.length) {
        setMessage('対象データがありません。', 'info');
      }
    } catch (e) {
      const reason = e && e.message ? e.message : 'js_error';
      state.rows = [];
      showListMessage('JavaScriptエラーが発生しました。画面を再読み込みしてください。', true);
      setStatus('JavaScriptエラーが発生しました。', true);
      setMessage('JavaScriptエラー: ' + reason, 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  async function save() {
    if (state.saving) return;
    const valid = validate();
    if (!valid.ok) {
      setMessage(valid.error, 'error');
      return;
    }

    const selected = state.selected;
    if (!confirm('以下の内容で歩数を修正します。\n\n対象: ' + (selected.name || selected.employeeId) + '\n日付: ' + value('adminActivityDate') + '\n現在: ' + Number(selected.currentSteps || 0).toLocaleString('ja-JP') + '歩\n新規: ' + Number(valid.steps || 0).toLocaleString('ja-JP') + '歩\n理由: ' + valid.reason)) {
      return;
    }

    const auth = authState();
    state.saving = true;
    setSaveBusy(true);
    setMessage('保存中です...', 'info');

    const targetEmployeeId = String(selected.employeeId || '');
    const targetSteps = Number(valid.steps || 0);

    const result = await api('adminUpdateActivity', {
      employeeId: auth.employeeId,
      targetEmployeeId: selected.employeeId,
      date: value('adminActivityDate'),
      newSteps: valid.steps,
      reason: valid.reason
    }, SAVE_TIMEOUT_MS);

    if (!result || !result.ok || !result.corrected) {
      const reason = result && (result.error || result.reason || result.message || result.msg) ? (result.error || result.reason || result.message || result.msg) : 'save_failed';

      if (String(reason) === 'api_timeout') {
        setMessage('保存結果を確認しています。しばらくお待ちください...', 'info');
        await loadRows({ preserveMessage: true });

        const refreshed = state.rows.find(row => String(row.employeeId || '') === targetEmployeeId);
        if (refreshed && Number(refreshed.currentSteps || 0) === targetSteps) {
          setStatus('保存しました。対象日 ' + value('adminActivityDate'), false);
          selectRow(targetEmployeeId);
          setMessage('歩数を修正しました。', 'success');
          state.saving = false;
          setSaveBusy(false);
          return;
        }

        setStatus('保存結果を確認中です。', true);
        setMessage('通信が混雑しています。結果が未確定のため、再送せずに一覧を更新して確認してください。', 'error');
        state.saving = false;
        setSaveBusy(false);
        return;
      }

      setMessage('保存に失敗しました: ' + reason, 'error');
      state.saving = false;
      setSaveBusy(false);
      return;
    }

    const corrected = result.corrected;
    const index = state.rows.findIndex(row => String(row.employeeId) === String(corrected.targetEmployeeId));
    if (index >= 0) {
      state.rows[index] = Object.assign({}, state.rows[index], {
        currentSteps: Number(corrected.afterSteps || 0),
        source: String(corrected.source || '管理者修正'),
        updatedAt: String(corrected.updatedAt || corrected.correctedAt || ''),
        activityId: String(corrected.activityId || state.rows[index].activityId || ''),
        hasRecord: true
      });
      renderRows();
      selectRow(corrected.targetEmployeeId);
    }

    setStatus('保存しました。対象日 ' + value('adminActivityDate'), false);
    setMessage('歩数を修正しました。', 'success');
    state.saving = false;
    setSaveBusy(false);
  }

  function installEvents() {
    const refresh = byId('adminActivityRefresh');
    if (refresh && !refresh.__rinchanAdminActivityInstalled) {
      refresh.__rinchanAdminActivityInstalled = true;
      refresh.addEventListener('click', () => loadRows());
    }

    const date = byId('adminActivityDate');
    if (date && !date.__rinchanAdminActivityInstalled) {
      date.__rinchanAdminActivityInstalled = true;
      date.addEventListener('change', () => { clearSelection(); loadRows(); });
    }

    const dept = byId('adminActivityDept');
    if (dept && !dept.__rinchanAdminActivityInstalled) {
      dept.__rinchanAdminActivityInstalled = true;
      dept.addEventListener('change', () => { clearSelection(); loadRows(); });
    }

    const query = byId('adminActivityQuery');
    if (query && !query.__rinchanAdminActivityInstalled) {
      query.__rinchanAdminActivityInstalled = true;
      query.addEventListener('input', () => {
        if (state.searchTimer) clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => { clearSelection(); loadRows(); }, 220);
      });
    }

    const list = byId('adminActivityList');
    if (list && !list.__rinchanAdminActivityInstalled) {
      list.__rinchanAdminActivityInstalled = true;
      list.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest('.admin-correct-button');
        if (!button) return;
        const employeeId = String(button.getAttribute('data-employee-id') || '');
        if (!employeeId) return;
        selectRow(employeeId);
      });
    }

    const saveButton = byId('adminEditSave');
    if (saveButton && !saveButton.__rinchanAdminActivityInstalled) {
      saveButton.__rinchanAdminActivityInstalled = true;
      saveButton.addEventListener('click', () => save());
    }

    const cancelButton = byId('adminEditCancel');
    if (cancelButton && !cancelButton.__rinchanAdminActivityInstalled) {
      cancelButton.__rinchanAdminActivityInstalled = true;
      cancelButton.addEventListener('click', () => clearSelection());
    }
  }

  function initDate() {
    const input = byId('adminActivityDate');
    if (!input) return;
    const today = todayKey();
    input.max = today;
    const latest = cachedActivities().map(item => normalizeDateKey(item.date || item.createdAt || item.savedAt)).filter(date => date && date <= today).sort().pop();
    if (!input.value || input.value > today) input.value = latest || today;
  }

  async function install() {
    if (!document.querySelector('.admin-activity-app')) return;
    if (!guardPageAccess()) return;
    if (window.RinchanSync && typeof RinchanSync.sync === 'function') await RinchanSync.sync({ silent: true });
    initDate();
    installEvents();
    loadRows();
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    loadRows,
    save
  };
})();

window.RinchanAdminActivity = RinchanAdminActivity;
