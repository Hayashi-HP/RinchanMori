const RinchanAuth = (() => {
  const VERSION = 'v1.0.57';

  function value(id) { const el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; }
  function setBusy(button, busy, label) { if (!button) return; button.disabled = !!busy; if (label) button.textContent = label; }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} return value; }
  function participant() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant(); return readJson('rinchanParticipant', null); }
  function saveParticipant(user) { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.setParticipant === 'function') return RinchanStorage.setParticipant(user); return writeJson('rinchanParticipant', user); }
  function clearUserData() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.clearUserData === 'function') return RinchanStorage.clearUserData(); ['rinchanParticipant','rinchanActivities','rinchanThanks','rinchanGoodTimeline','rinchanDashboardCache','rinchanMoriMembers','rinchanReceivedThanks','rinchanSentThanks','rinchanReadNewsIds','rinchanThanksStats','rinchanSyncStatus','rinchanLastSyncedAt','rinchanSyncToken'].forEach(key => localStorage.removeItem(key)); }
  function deviceId() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.deviceId === 'function') return RinchanStorage.deviceId(); let id = localStorage.getItem('rinchanDeviceId'); if (!id) { id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('rinchanDeviceId', id); } return id; }
  async function api(action, payload) { if (typeof RinchanApi !== 'undefined' && RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {}); if (window.RinchanApi && typeof window.RinchanApi.request === 'function') return window.RinchanApi.request(action, payload || {}); if (typeof v051Api === 'function') return v051Api(action, payload || {}); return { ok: false, reason: 'api_not_ready' }; }
  function applyState(result) { if (typeof RinchanSync !== 'undefined' && RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result); if (window.RinchanSync && typeof window.RinchanSync.applyApiResult === 'function') return window.RinchanSync.applyApiResult(result); if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result); return result; }
  function switchUserLocalData(nextId) { const current = participant(); const currentId = current && (current.employeeId || current.id); if (currentId && nextId && String(currentId) !== String(nextId)) clearUserData(); }
  function loginPath() { return location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html'; }
  function makeButton(label, className) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = className; return button; }
  function escapeHtml(text) { return String(text || '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }
  function showAuthDialog(options) {
    const opts = options || {};
    const old = document.getElementById('authDialogOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'authDialogOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(30,46,38,.48);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;';

    const panel = document.createElement('div');
    panel.style.cssText = 'width:min(430px,100%);background:#fff;border-radius:28px;padding:24px 22px 20px;box-shadow:0 22px 60px rgba(39,70,53,.28);text-align:center;color:#2f3f34;border:1px solid rgba(113,161,123,.28);';

    const visual = document.createElement('div');
    visual.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:10px;';
    if (opts.rinchan) {
      const img = document.createElement('img');
      img.src = opts.rinchanSrc || '../assets/rinchan-face.svg?v=1049';
      img.alt = 'りんちゃん';
      img.style.cssText = 'width:76px;height:76px;border-radius:50%;object-fit:cover;background:#f2f8ef;border:3px solid #d8efd2;box-shadow:0 8px 18px rgba(71,122,76,.18);';
      visual.appendChild(img);
      if (opts.speech) {
        const speech = document.createElement('div');
        speech.textContent = opts.speech;
        speech.style.cssText = 'max-width:310px;background:#f3fbef;border:1px solid #d8efd2;border-radius:18px;padding:10px 12px;color:#2f6b35;font-size:14px;font-weight:900;line-height:1.55;';
        visual.appendChild(speech);
      }
    } else {
      const icon = document.createElement('div');
      icon.textContent = opts.icon || '⚠️';
      icon.style.cssText = 'font-size:42px;line-height:1;';
      visual.appendChild(icon);
    }

    const title = document.createElement('h2');
    title.textContent = opts.title || '確認してください';
    title.style.cssText = 'margin:0 0 12px;font-size:22px;font-weight:900;color:#2f3f34;';

    const body = document.createElement('div');
    body.style.cssText = 'font-size:15px;line-height:1.75;margin:0 0 20px;color:#405146;font-weight:700;';
    if (opts.html) body.innerHTML = opts.html;
    else body.textContent = opts.message || '';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';

    const closeButton = makeButton(opts.closeText || '閉じる', 'auth-dialog-close');
    closeButton.style.cssText = 'border:0;border-radius:999px;padding:12px 18px;background:#eef4ee;color:#405146;font-weight:900;min-width:116px;cursor:pointer;';
    closeButton.addEventListener('click', () => overlay.remove());

    if (opts.loginButton) {
      const loginButton = makeButton(opts.loginText || 'ログインする', 'auth-dialog-login');
      loginButton.style.cssText = 'border:0;border-radius:999px;padding:12px 18px;background:#2E7D32;color:#fff;font-weight:900;min-width:136px;cursor:pointer;box-shadow:0 8px 18px rgba(46,125,50,.22);';
      loginButton.addEventListener('click', () => { location.href = loginPath(); });
      actions.appendChild(loginButton);
    }
    actions.appendChild(closeButton);

    panel.appendChild(visual);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    setTimeout(() => { const first = actions.querySelector('button'); if (first) first.focus(); }, 0);
  }
  function showError(message) { showAuthDialog({ icon: '⚠️', title: '確認してください', message, closeText: 'OK' }); }
  function showDuplicateEmployeeDialog(employeeId) {
    const safeEmployeeId = escapeHtml(employeeId);
    showAuthDialog({
      rinchan: true,
      speech: 'その社員番号はもう登録されているみたい！ログインしてね♪',
      title: '登録できません',
      html: '社員番号 <strong>' + safeEmployeeId + '</strong> はすでに登録されています。<br><br>新規登録はできません。<br>登録済みの方は <strong>ログイン</strong> してください。',
      loginButton: true,
      loginText: 'ログインする',
      closeText: '閉じる'
    });
  }
  function clearError() { const box = document.getElementById('authErrorBox'); if (box) box.remove(); const dialog = document.getElementById('authDialogOverlay'); if (dialog) dialog.remove(); }
  function setSyncStatus(status, message) { try { if (window.RinchanSync && RinchanSync.setStatus) RinchanSync.setStatus(status, message || ''); else writeJson('rinchanSyncStatus', { status, message: message || '', at: new Date().toISOString() }); } catch (e) {} }
  function enqueueLoginCheck(employeeId, pin4) { try { writeJson('rinchanPendingLoginCheck', { employeeId, pin4, at: new Date().toISOString(), deviceId: deviceId() }); } catch (e) {} }
  function sameReturningUser(employeeId, pin4) { const user = participant(); return !!(user && String(user.employeeId || user.id || '') === String(employeeId || '') && String(user.pin4 || '') === String(pin4 || '')); }
  function goHome() { location.href = '../index.html'; }
  function duplicateMessage(employeeId) { return '社員番号 ' + employeeId + ' はすでに登録されています。新規登録はできません。登録済みの方はログインしてください。'; }
  function isDuplicateResult(result) { const reason = String((result && (result.reason || result.error)) || '').toLowerCase(); return !!(result && (result.exists === true || result.duplicate === true || result.alreadyExists === true || reason === 'duplicate_employee_id' || reason === 'employee_id_exists' || reason === 'already_registered' || reason === 'duplicate'));
  }
  function hasCachedEmployee(employeeId) { const id = String(employeeId || ''); const current = participant(); if (current && String(current.employeeId || current.id || '') === id) return true; const known = readJson('rinchanKnownUsers', []); if (Array.isArray(known) && known.some(user => String(user.employeeId || user.id || '') === id)) return true; const members = readJson('rinchanMoriMembers', []); if (Array.isArray(members) && members.some(user => String(user.employeeId || user.id || user.participantId || '') === id)) return true; return false; }
  async function checkEmployeeAvailable(employeeId) {
    if (hasCachedEmployee(employeeId)) return { ok: true, available: false, source: 'cache' };
    const result = await api('checkEmployeeId', { employeeId });
    if (result && result.ok) {
      return { ok: true, available: !(result.exists === true || result.duplicate === true || result.alreadyExists === true), raw: result };
    }
    if (isDuplicateResult(result)) return { ok: true, available: false, raw: result };
    return { ok: false, reason: (result && (result.reason || result.error)) || 'check_failed', raw: result };
  }
  async function verifyLoginInBackground(employeeId, pin4) { try { setSyncStatus('syncing', 'ログイン確認中です。'); const result = await api('loginUser', { employeeId, pin4 }); if (result && result.ok && result.user) { const merged = Object.assign({}, participant() || {}, result.user, { pin4 }); saveParticipant(merged); applyState(result); setSyncStatus('synced', ''); return true; } setSyncStatus('error', 'ログイン確認が必要です。'); enqueueLoginCheck(employeeId, pin4); return false; } catch (e) { setSyncStatus('error', '通信できないため後で確認します。'); enqueueLoginCheck(employeeId, pin4); return false; } }

  function initRegisterForm() {
    const form = document.getElementById('registerForm'); if (!form || form.__rinchanAuthInstalled) return; form.__rinchanAuthInstalled = true;
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation(); clearError();
      const button = form.querySelector('button[type="submit"],button'); const employeeId = value('employeeId'); const pin4 = value('pin4');
      if (!employeeId) { alert('社員番号を入力してください。'); return; }
      if (!value('userName')) { alert('氏名を入力してください。'); return; }
      if (!value('dept')) { alert('所属を選択してください。'); return; }
      if (!/^\d{4}$/.test(pin4)) { alert('誕生日4桁を入力してください。例：4月8日なら0408'); return; }

      setBusy(button, true, '確認中...');
      const check = await checkEmployeeAvailable(employeeId);
      if (check.ok && check.available === false) {
        setBusy(button, false, '登録する');
        showDuplicateEmployeeDialog(employeeId);
        return;
      }
      if (!check.ok) {
        setBusy(button, false, '登録する');
        showError('社員番号の重複確認ができませんでした。通信状態またはApps Scriptの checkEmployeeId 対応を確認してください。');
        return;
      }

      setBusy(button, true, '登録中...'); switchUserLocalData(employeeId); const now = new Date().toISOString();
      const user = { id: employeeId, employeeId, participantId: employeeId, deviceId: deviceId(), name: value('userName'), dept: value('dept'), nick: value('nick'), email: value('email'), pin4, declaration: '', weeklyGoal: '', weeklyStepGoal: '', createdAt: now, updatedAt: now, version: VERSION, createOnly: true };
      const result = await api('saveUser', user);
      if (result && result.ok) { const savedUser = Object.assign({}, user, result.user || {}, { weeklyGoal: (result.user && result.user.weeklyGoal) || user.weeklyGoal || '' }); saveParticipant(savedUser); applyState(result); location.href = 'welcome.html'; return; }
      setBusy(button, false, '登録する');
      if (isDuplicateResult(result)) { showDuplicateEmployeeDialog(employeeId); return; }
      showError('登録を保存できませんでした。Apps ScriptのデプロイURLまたはusersシートを確認してください。理由: ' + ((result && (result.reason || result.error)) || 'unknown'));
    }, true);
  }

  function initLoginForm() {
    const form = document.getElementById('loginForm'); if (!form || form.__rinchanAuthInstalled) return; form.__rinchanAuthInstalled = true;
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const button = form.querySelector('button[type="submit"],button'); const employeeId = value('loginEmployeeId'); const pin4 = value('loginPin4');
      if (!employeeId) { alert('社員番号を入力してください。'); return; }
      if (!/^\d{4}$/.test(pin4)) { alert('誕生日4桁を入力してください。例：4月8日なら0408'); return; }
      setBusy(button, true, 'ログイン中...');
      if (sameReturningUser(employeeId, pin4)) { setBusy(button, true, 'ログインしました'); setTimeout(() => verifyLoginInBackground(employeeId, pin4), 10); setTimeout(goHome, 80); return; }
      const cachedUsers = readJson('rinchanKnownUsers', []);
      const cached = Array.isArray(cachedUsers) ? cachedUsers.find(user => String(user.employeeId || user.id || '') === String(employeeId) && String(user.pin4 || '') === String(pin4)) : null;
      if (cached) { switchUserLocalData(employeeId); saveParticipant(Object.assign({}, cached, { pin4, lastLoginAt: new Date().toISOString() })); setBusy(button, true, 'ログインしました'); setTimeout(() => verifyLoginInBackground(employeeId, pin4), 10); setTimeout(goHome, 80); return; }
      const result = await api('loginUser', { employeeId, pin4 });
      if (result && result.ok && result.user) { switchUserLocalData(employeeId); clearUserData(); const user = Object.assign({}, result.user, { pin4, lastLoginAt: new Date().toISOString() }); saveParticipant(user); const known = readJson('rinchanKnownUsers', []); const list = Array.isArray(known) ? known.filter(row => String(row.employeeId || row.id || '') !== String(employeeId)) : []; list.unshift(user); writeJson('rinchanKnownUsers', list.slice(0, 5)); applyState(result); location.href = '../index.html'; return; }
      setBusy(button, false, 'ログインする'); alert('ログインできませんでした。社員番号と誕生日4桁を確認してください。');
    }, true);
  }

  function logout() { if (!confirm('ログアウトしますか？')) return; clearUserData(); const root = location.pathname.includes('/pages/') ? '../' : ''; location.href = root + 'index.html?logout=1'; }
  async function saveProfile() { if (window.saveProfile && window.saveProfile !== saveProfile) return window.saveProfile(event); }
  async function saveDeclaration() { if (window.saveDeclaration && window.saveDeclaration !== saveDeclaration) return window.saveDeclaration(event); }
  async function saveGoal() { if (window.saveGoal && window.saveGoal !== saveGoal) return window.saveGoal(event); }
  async function saveWeeklyStepGoal() { if (window.saveWeeklyStepGoalV136 && window.saveWeeklyStepGoalV136 !== saveWeeklyStepGoal) return window.saveWeeklyStepGoalV136(event); }
  function install() { initRegisterForm(); initLoginForm(); window.logoutV115 = logout; if (!window.saveProfile) window.saveProfile = saveProfile; if (!window.saveDeclaration) window.saveDeclaration = saveDeclaration; if (!window.saveGoal) window.saveGoal = saveGoal; if (!window.saveWeeklyStepGoalV136) window.saveWeeklyStepGoalV136 = saveWeeklyStepGoal; }
  document.addEventListener('DOMContentLoaded', install);
  return { VERSION, install, logout, saveProfile, saveDeclaration, saveGoal, saveWeeklyStepGoal, initLoginForm, initRegisterForm, verifyLoginInBackground, checkEmployeeAvailable };
})();
window.RinchanAuth = RinchanAuth;
