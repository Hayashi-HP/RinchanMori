const RinchanAuth = (() => {
  const VERSION = 'v0.9.61';

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = !!busy;
    if (label) button.textContent = label;
  }

  function participant() {
    if (window.RinchanStorage) return RinchanStorage.getParticipant();
    try {
      return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveParticipant(user) {
    if (window.RinchanStorage) return RinchanStorage.setParticipant(user);
    localStorage.setItem('rinchanParticipant', JSON.stringify(user));
    return user;
  }

  function clearUserData() {
    if (window.RinchanStorage) return RinchanStorage.clearUserData();
    [
      'rinchanParticipant',
      'rinchanActivities',
      'rinchanThanks',
      'rinchanGoodTimeline',
      'rinchanDashboardCache',
      'rinchanMoriMembers',
      'rinchanReceivedThanks',
      'rinchanSentThanks',
      'rinchanReadNewsIds',
      'rinchanThanksStats',
      'rinchanSyncStatus',
      'rinchanLastSyncedAt',
      'rinchanSyncToken'
    ].forEach(key => localStorage.removeItem(key));
  }

  function deviceId() {
    if (window.RinchanStorage) return RinchanStorage.deviceId();
    let id = localStorage.getItem('rinchanDeviceId');
    if (!id) {
      id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('rinchanDeviceId', id);
    }
    return id;
  }

  async function api(action, payload) {
    if (window.RinchanApi) return RinchanApi.request(action, payload || {});
    if (typeof v051Api === 'function') return v051Api(action, payload || {});
    return { ok: false, reason: 'api_not_ready' };
  }

  function applyState(result) {
    if (window.RinchanSync && typeof RinchanSync.applyApiResult === 'function') return RinchanSync.applyApiResult(result);
    if (typeof v135ApplyApiResult === 'function') return v135ApplyApiResult(result);
    return result;
  }

  function switchUserLocalData(nextId) {
    const current = participant();
    const currentId = current && (current.employeeId || current.id);
    if (currentId && nextId && String(currentId) !== String(nextId)) clearUserData();
  }

  function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form || form.__rinchanAuthInstalled) return;
    form.__rinchanAuthInstalled = true;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const button = form.querySelector('button[type="submit"],button');
      const employeeId = value('employeeId');
      const pin4 = value('pin4');

      if (!employeeId) {
        alert('社員番号を入力してください。');
        return;
      }
      if (!/^\d{4}$/.test(pin4)) {
        alert('誕生日4桁を入力してください。例：4月8日なら0408');
        return;
      }

      setBusy(button, true, '登録中...');
      switchUserLocalData(employeeId);
      const now = new Date().toISOString();
      const user = {
        id: employeeId,
        employeeId,
        deviceId: deviceId(),
        name: value('userName'),
        dept: value('dept'),
        nick: value('nick'),
        email: value('email'),
        pin4,
        declaration: '',
        weeklyGoal: 'まずは無理なく続ける',
        createdAt: now,
        updatedAt: now,
        version: VERSION
      };

      const result = await api('saveUser', user);
      clearUserData();
      saveParticipant(result.ok && result.user ? result.user : user);
      applyState(result);
      location.href = 'welcome.html';
    }, true);
  }

  function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form || form.__rinchanAuthInstalled) return;
    form.__rinchanAuthInstalled = true;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"],button');
      const employeeId = value('loginEmployeeId');
      const pin4 = value('loginPin4');

      if (!employeeId) {
        alert('社員番号を入力してください。');
        return;
      }
      if (!/^\d{4}$/.test(pin4)) {
        alert('誕生日4桁を入力してください。例：4月8日なら0408');
        return;
      }

      setBusy(button, true, 'ログイン中...');
      const result = await api('loginUser', { employeeId, pin4 });
      if (result.ok && result.user) {
        switchUserLocalData(employeeId);
        clearUserData();
        saveParticipant(result.user);
        applyState(result);
        location.href = '../index.html';
        return;
      }

      setBusy(button, false, 'ログインする');
      alert('ログインできませんでした。社員番号と誕生日4桁を確認してください。');
    });
  }

  function logout() {
    if (!confirm('ログアウトしますか？')) return;
    clearUserData();
    const root = location.pathname.includes('/pages/') ? '../' : '';
    location.href = root + 'index.html?logout=1';
  }

  async function saveProfile() {
    const button = event && event.target ? event.target : null;
    const user = participant();
    if (!user || !user.id) {
      location.href = 'login.html';
      return;
    }

    setBusy(button, true, '保存中...');
    user.name = value('editName') || user.name;
    user.dept = value('editDept');
    user.nick = value('editNick');
    user.updatedAt = new Date().toISOString();
    user.version = VERSION;
    saveParticipant(user);
    const result = await api('saveUser', user);
    applyState(result);
    location.reload();
  }

  async function saveDeclaration() {
    const button = event && event.target ? event.target : null;
    const user = participant();
    if (!user || !user.id) {
      location.href = 'login.html';
      return;
    }

    setBusy(button, true, '保存中...');
    user.declaration = value('editDeclaration');
    user.updatedAt = new Date().toISOString();
    user.version = VERSION;
    saveParticipant(user);
    const result = await api('saveUser', user);
    applyState(result);
    location.reload();
  }

  async function saveGoal() {
    const button = event && event.target ? event.target : null;
    const user = participant();
    if (!user || !user.id) {
      location.href = 'login.html';
      return;
    }

    setBusy(button, true, '保存中...');
    user.weeklyGoal = value('editGoal');
    user.updatedAt = new Date().toISOString();
    user.version = VERSION;
    saveParticipant(user);
    const result = await api('saveUser', user);
    applyState(result);
    location.reload();
  }

  async function saveWeeklyStepGoal() {
    const button = event && event.target ? event.target : null;
    const user = participant();
    if (!user || !user.id) {
      location.href = 'login.html';
      return;
    }

    const raw = value('editWeeklyStepGoal').replace(/,/g, '');
    if (raw && !/^\d+$/.test(raw)) {
      alert('歩数は数字で入力してください。');
      return;
    }

    setBusy(button, true, '保存中...');
    user.weeklyStepGoal = raw ? String(Number(raw)) : '';
    user.updatedAt = new Date().toISOString();
    user.version = VERSION;
    saveParticipant(user);
    const result = await api('saveUser', user);
    applyState(result);
    location.reload();
  }

  function install() {
    initRegisterForm();
    initLoginForm();
    window.logoutV115 = logout;
    window.saveProfile = saveProfile;
    window.saveDeclaration = saveDeclaration;
    window.saveGoal = saveGoal;
    window.saveWeeklyStepGoalV136 = saveWeeklyStepGoal;
  }

  document.addEventListener('DOMContentLoaded', install);

  return {
    VERSION,
    install,
    logout,
    saveProfile,
    saveDeclaration,
    saveGoal,
    saveWeeklyStepGoal,
    initLoginForm,
    initRegisterForm
  };
})();
