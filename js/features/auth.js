const RinchanAuth = (() => {
  const VERSION = 'v1.0.64';

  function value(id) { const el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; }
  function setBusy(button, busy, label) { if (!button) return; button.disabled = !!busy; if (label) { const labelNode = button.querySelector('span'); if (labelNode) labelNode.textContent = label; else button.textContent = label; } }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} return value; }
  function participant() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant(); return readJson('rinchanParticipant', null); }
  function withoutPin(user) { if (!user || typeof user !== 'object') return user; const safe = Object.assign({}, user); delete safe.pin4; delete safe.pin; delete safe.password; return safe; }
  function saveParticipant(user) { const safe = withoutPin(user); if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.setParticipant === 'function') return RinchanStorage.setParticipant(safe); return writeJson('rinchanParticipant', safe); }
  function clearUserData() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.clearUserData === 'function') return RinchanStorage.clearUserData(); ['rinchanParticipant','rinchanActivities','rinchanThanks','rinchanGoodTimeline','rinchanDashboardCache','rinchanMoriMembers','rinchanReceivedThanks','rinchanSentThanks','rinchanReadNewsIds','rinchanThanksStats','rinchanSyncStatus','rinchanLastSyncedAt','rinchanSyncToken','rinchanKnownUsers','rinchanPendingLoginCheck'].forEach(key => localStorage.removeItem(key)); }
  function deviceId() { if (typeof RinchanStorage !== 'undefined' && RinchanStorage && typeof RinchanStorage.deviceId === 'function') return RinchanStorage.deviceId(); let id = localStorage.getItem('rinchanDeviceId'); if (!id) { id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('rinchanDeviceId', id); } return id; }
  async function api(action, payload) { if (typeof RinchanApi !== 'undefined' && RinchanApi && typeof RinchanApi.request === 'function') return RinchanApi.request(action, payload || {}); if (window.RinchanApi && typeof window.RinchanApi.request === 'function') return window.RinchanApi.request(action, payload || {}); if (typeof v051Api === 'function') return v051Api(action, payload || {}); return { ok: false, reason: 'api_not_ready' }; }
  function applyState(result) { if (typeof RinchanSync !== 'undefined' && RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result); if (window.RinchanSync && typeof window.RinchanSync.applyApiResult === 'function') return window.RinchanSync.applyApiResult(result); if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result); return result; }
  function switchUserLocalData(nextId) { const current = participant(); const currentId = current && (current.employeeId || current.id); if (currentId && nextId && String(currentId) !== String(nextId)) clearUserData(); }
  function makeButton(label, className) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = className; return button; }

  function focusEmployeeId() {
    const el = document.getElementById('employeeId');
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (ignore) {} }
      try { el.select(); } catch (e) {}
    }, 180);
  }

  function injectAuthDialogStyles() {
    if (document.getElementById('rinchanAuthDialogStyles')) return;
    const style = document.createElement('style');
    style.id = 'rinchanAuthDialogStyles';
    style.textContent = '@keyframes rinchanOverlayFade{from{opacity:0}to{opacity:1}}@keyframes rinchanModalPoyon{0%{opacity:0;transform:scale(.85) translateY(12px)}58%{opacity:1;transform:scale(1.05) translateY(-4px)}78%{transform:scale(.98) translateY(1px)}100%{opacity:1;transform:scale(1) translateY(0)}}@keyframes rinchanFaceHop{0%{transform:translateY(0) scale(.96)}45%{transform:translateY(-8px) scale(1.04)}75%{transform:translateY(2px) scale(.99)}100%{transform:translateY(0) scale(1)}}@keyframes rinchanSpeechFloat{0%{opacity:0;transform:translateY(8px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}#authDialogOverlay.rinchan-auth-dialog-animated{animation:rinchanOverlayFade .18s ease-out both}.rinchan-auth-panel-animated{animation:rinchanModalPoyon .46s cubic-bezier(.2,.9,.25,1.25) both;transform-origin:center}.rinchan-auth-face-animated{animation:rinchanFaceHop .58s ease-out .08s both}.rinchan-auth-speech-animated{opacity:0;animation:rinchanSpeechFloat .28s ease-out .16s both}@media (prefers-reduced-motion:reduce){#authDialogOverlay.rinchan-auth-dialog-animated,.rinchan-auth-panel-animated,.rinchan-auth-face-animated,.rinchan-auth-speech-animated{animation:none!important;opacity:1!important;transform:none!important}}';
    document.head.appendChild(style);
  }

  function showAuthDialog(options) {
    const opts = options || {};
    const old = document.getElementById('authDialogOverlay');
    if (old) old.remove();
    injectAuthDialogStyles();

    const overlay = document.createElement('div');
    overlay.id = 'authDialogOverlay';
    overlay.className = 'rinchan-auth-dialog-animated';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(30,46,38,.48);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;';

    const panel = document.createElement('div');
    panel.className = 'rinchan-auth-panel-animated';
    panel.style.cssText = 'width:min(430px,100%);background:#fff;border-radius:28px;padding:24px 22px 20px;box-shadow:0 22px 60px rgba(39,70,53,.28);text-align:center;color:#2f3f34;border:1px solid rgba(113,161,123,.28);';

    const visual = document.createElement('div');
    visual.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:14px;';
    if (opts.rinchan) {
      const img = document.createElement('img');
      img.className = 'rinchan-auth-face-animated';
      img.src = opts.rinchanSrc || '../assets/rinchan-face.svg?v=1049';
      img.alt = 'りんちゃん';
      img.style.cssText = 'width:84px;height:auto;object-fit:contain;background:transparent;border:0;box-shadow:none;';
      visual.appendChild(img);
      if (opts.speech) {
        const speech = document.createElement('div');
        speech.className = 'rinchan-auth-speech-animated';
        speech.textContent = opts.speech;
        speech.style.cssText = 'max-width:320px;background:#f3fbef;border:1px solid #d8efd2;border-radius:18px;padding:12px 14px;color:#2f6b35;font-size:16px;font-weight:900;line-height:1.65;white-space:pre-line;';
        visual.appendChild(speech);
      }
    } else {
      const icon = document.createElement('div');
      icon.textContent = opts.icon || '⚠️';
      icon.style.cssText = 'font-size:42px;line-height:1;';
      visual.appendChild(icon);
    }

    const body = document.createElement('div');
    body.style.cssText = 'font-size:14px;line-height:1.65;margin:0 0 20px;color:#667568;font-weight:800;';
    body.textContent = opts.message || '';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';
    const closeButton = makeButton(opts.closeText || 'OK', 'auth-dialog-close');
    closeButton.style.cssText = 'border:0;border-radius:999px;padding:12px 18px;background:#2E7D32;color:#fff;font-weight:900;min-width:136px;cursor:pointer;box-shadow:0 8px 18px rgba(46,125,50,.22);';
    closeButton.addEventListener('click', () => { overlay.remove(); if (typeof opts.onClose === 'function') opts.onClose(); });
    actions.appendChild(closeButton);

    panel.appendChild(visual);
    if (opts.message) panel.appendChild(body);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    setTimeout(() => { const first = actions.querySelector('button'); if (first) first.focus(); }, 0);
  }

  function showError(message) { showAuthDialog({ icon: '⚠️', message, closeText: 'OK' }); }
  function showDuplicateEmployeeDialog() {
    if (window.RinchanModal && typeof RinchanModal.duplicateEmployee === 'function') {
      RinchanModal.duplicateEmployee(focusEmployeeId);
      return;
    }
    showAuthDialog({
      rinchan: true,
      speech: 'あれれ？\nこの社員番号は\nもう使われているみたい。\nもう一度確認してね♪',
      message: '社員番号を確認してみてね。',
      closeText: '社員番号を確認する',
      onClose: focusEmployeeId
    });
  }
  function clearError() { const box = document.getElementById('authErrorBox'); if (box) box.remove(); const dialog = document.getElementById('authDialogOverlay'); if (dialog) dialog.remove(); if (window.RinchanModal && typeof RinchanModal.close === 'function') RinchanModal.close(); }
  function setSyncStatus(status, message) { try { if (window.RinchanSync && RinchanSync.setStatus) RinchanSync.setStatus(status, message || ''); else writeJson('rinchanSyncStatus', { status, message: message || '', at: new Date().toISOString() }); } catch (e) {} }
  function clearLegacyPinData() {
    try {
      const current = participant();
      if (current && (current.pin4 !== undefined || current.pin !== undefined || current.password !== undefined)) saveParticipant(current);
      localStorage.removeItem('rinchanKnownUsers');
      localStorage.removeItem('rinchanPendingLoginCheck');
    } catch (e) {}
  }
  function goHome() { location.href = '../index.html'; }
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
  async function verifyLoginInBackground(employeeId, pin4) { try { setSyncStatus('syncing', 'ログイン確認中です。'); const result = await api('loginUser', { employeeId, pin4 }); if (result && result.ok && result.user) { const merged = Object.assign({}, participant() || {}, result.user); saveParticipant(merged); applyState(result); setSyncStatus('synced', ''); return true; } setSyncStatus('error', 'ログイン確認が必要です。'); return false; } catch (e) { setSyncStatus('error', '通信できないため確認できませんでした。'); return false; } }

  function initPinToggles() {
    document.querySelectorAll('[data-pin-toggle]').forEach(button => {
      if (button.__rinchanPinToggleInstalled) return;
      button.__rinchanPinToggleInstalled = true;
      button.addEventListener('click', () => {
        const input = document.getElementById(button.getAttribute('data-pin-toggle'));
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.setAttribute('aria-pressed', show ? 'true' : 'false');
        button.setAttribute('aria-label', show ? '誕生日4桁を隠す' : '誕生日4桁を表示');
        input.focus();
      });
    });
  }

  function initRegisterForm() {
    const form = document.getElementById('registerForm'); if (!form || form.__rinchanAuthInstalled) return; form.__rinchanAuthInstalled = true;
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation(); clearError();
      const button = form.querySelector('button[type="submit"],button'); const employeeId = value('employeeId'); const pin4 = value('pin4');
      if (!employeeId) { showAuthDialog({ rinchan: true, speech: '社員番号を\n教えてくれるとうれしいな♪', closeText: '入力する', onClose: focusEmployeeId }); return; }
      if (!/^\d+$/.test(employeeId)) { showAuthDialog({ rinchan: true, speech: '社員番号は\n数字で入力してね♪', closeText: '入力する', onClose: focusEmployeeId }); return; }
      if (!value('userName')) { showAuthDialog({ rinchan: true, speech: 'お名前を\n教えてね♪', closeText: '入力する', onClose: () => { const el = document.getElementById('userName'); if (el) el.focus(); } }); return; }
      if (!value('dept')) { showAuthDialog({ rinchan: true, speech: '所属を\n選んでね♪', closeText: '選ぶ', onClose: () => { const el = document.getElementById('dept'); if (el) el.focus(); } }); return; }
      if (!/^\d{4}$/.test(pin4)) { showAuthDialog({ rinchan: true, speech: '誕生日4桁を\n入れてね♪', message: '例：4月8日なら 0408', closeText: '入力する', onClose: () => { const el = document.getElementById('pin4'); if (el) el.focus(); } }); return; }

      setBusy(button, true, '杜に植えてるよ...');
      const check = await checkEmployeeAvailable(employeeId);
      if (check.ok && check.available === false) {
        setBusy(button, false, '杜に参加する');
        showDuplicateEmployeeDialog();
        return;
      }
      if (!check.ok) {
        setBusy(button, false, '杜に参加する');
        showAuthDialog({ rinchan: true, speech: '通信が少し\n迷子みたい。\nもう一度ためしてね♪', message: '社員番号の確認ができませんでした。', closeText: 'OK' });
        return;
      }

      setBusy(button, true, '杜に植えてるよ...'); switchUserLocalData(employeeId); const now = new Date().toISOString();
      const user = { id: employeeId, employeeId, participantId: employeeId, deviceId: deviceId(), name: value('userName'), dept: value('dept'), nick: value('nick'), email: value('email'), pin4, declaration: '', weeklyGoal: '', weeklyStepGoal: '', createdAt: now, updatedAt: now, version: VERSION, createOnly: true };
      const result = await api('saveUser', user);
      if (result && result.ok) { const savedUser = Object.assign({}, withoutPin(user), withoutPin(result.user || {}), { weeklyGoal: (result.user && result.user.weeklyGoal) || user.weeklyGoal || '' }); saveParticipant(savedUser); applyState(result); location.href = 'welcome.html'; return; }
      setBusy(button, false, '杜に参加する');
      if (isDuplicateResult(result)) { showDuplicateEmployeeDialog(); return; }
      showAuthDialog({ rinchan: true, speech: '保存が少し\nうまくいかなかったみたい。\nもう一度ためしてね♪', message: '通信状態を確認してください。', closeText: 'OK' });
    }, true);
  }

  function initLoginForm() {
    const form = document.getElementById('loginForm'); if (!form || form.__rinchanAuthInstalled) return; form.__rinchanAuthInstalled = true;
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const button = form.querySelector('button[type="submit"],button'); const employeeId = value('loginEmployeeId'); const pin4 = value('loginPin4');
      if (!employeeId) { showAuthDialog({ rinchan: true, speech: '社員番号を\n教えてね♪', closeText: '入力する', onClose: () => { const el = document.getElementById('loginEmployeeId'); if (el) el.focus(); } }); return; }
      if (!/^\d+$/.test(employeeId)) { showAuthDialog({ rinchan: true, speech: '社員番号は\n数字で入力してね♪', closeText: '入力する', onClose: () => { const el = document.getElementById('loginEmployeeId'); if (el) el.focus(); } }); return; }
      if (!/^\d{4}$/.test(pin4)) { showAuthDialog({ rinchan: true, speech: '誕生日4桁を\n入れてね♪', message: '例：4月8日なら 0408', closeText: '入力する', onClose: () => { const el = document.getElementById('loginPin4'); if (el) el.focus(); } }); return; }
      setBusy(button, true, '杜へ向かってるよ...');
      const result = await api('loginUser', { employeeId, pin4 });
      if (result && result.ok && result.user) { switchUserLocalData(employeeId); clearUserData(); const user = Object.assign({}, withoutPin(result.user), { lastLoginAt: new Date().toISOString() }); saveParticipant(user); applyState(result); location.href = '../index.html'; return; }
      setBusy(button, false, 'ログインする'); showAuthDialog({ rinchan: true, speech: 'あれれ？\n番号か誕生日が\n少し違うみたい。', message: 'もう一度確認してみてね。', closeText: '確認する' });
    }, true);
  }

  function logout() { if (!confirm('ログアウトしますか？')) return; clearUserData(); const root = location.pathname.includes('/pages/') ? '../' : ''; location.href = root + 'index.html?logout=1'; }
  async function saveProfile() { if (window.saveProfile && window.saveProfile !== saveProfile) return window.saveProfile(event); }
  async function saveDeclaration() { if (window.saveDeclaration && window.saveDeclaration !== saveDeclaration) return window.saveDeclaration(event); }
  async function saveGoal() { if (window.saveGoal && window.saveGoal !== saveGoal) return window.saveGoal(event); }
  async function saveWeeklyStepGoal() { if (window.saveWeeklyStepGoalV136 && window.saveWeeklyStepGoalV136 !== saveWeeklyStepGoal) return window.saveWeeklyStepGoalV136(event); }
  function install() { clearLegacyPinData(); initPinToggles(); initRegisterForm(); initLoginForm(); window.logoutV115 = logout; if (!window.saveProfile) window.saveProfile = saveProfile; if (!window.saveDeclaration) window.saveDeclaration = saveDeclaration; if (!window.saveGoal) window.saveGoal = saveGoal; if (!window.saveWeeklyStepGoalV136) window.saveWeeklyStepGoalV136 = saveWeeklyStepGoal; }
  document.addEventListener('DOMContentLoaded', install);
  return { VERSION, install, logout, saveProfile, saveDeclaration, saveGoal, saveWeeklyStepGoal, initLoginForm, initRegisterForm, verifyLoginInBackground, checkEmployeeAvailable };
})();
window.RinchanAuth = RinchanAuth;
