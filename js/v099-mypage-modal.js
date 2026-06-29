const RINCHAN_V099 = 'v0.9.9';

function v099ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function v099Participant() {
  return v099ReadJson('rinchanParticipant', null);
}

function v099SaveParticipant(p) {
  localStorage.setItem('rinchanParticipant', JSON.stringify(p));
}

function v099Value(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function v099SetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function v099EscapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

function v099RequireUser() {
  const p = v099Participant();
  if (!p || !p.id) {
    alert('登録後に編集できます。');
    location.href = 'register.html';
    return null;
  }
  return p;
}

function v099RenderMypage() {
  if (!document.getElementById('mypageV070')) return;
  const p = v099Participant() || {};

  v099SetText('v070ProfileName', p.name || 'ゲスト');
  v099SetText('v070ProfileDept', p.dept || '未設定');
  v099SetText('v070ProfileNick', p.nick || '-');
  v099SetText('v070EmployeeId', p.employeeId || p.id || '-');
  v099SetText('declarationText', String(p.declaration || '').trim() || 'まだ登録されていません。');
  v099SetText('weeklyGoalText', String(p.weeklyGoal || '').trim() || 'まずは無理なく続ける');
}

function v099DeptOptions(current) {
  const departments = ['', '看護部', 'リハビリテーション部', '介護部', '医局', '薬剤部', '栄養科', '事務部', 'その他'];
  return departments.map(dept => {
    const label = dept || '選択してください';
    const selected = dept === String(current || '') ? ' selected' : '';
    return '<option value="' + v099EscapeHtml(dept) + '"' + selected + '>' + v099EscapeHtml(label) + '</option>';
  }).join('');
}

function v099OpenModal(kind, title, bodyHtml) {
  closeEditModalV099();
  window.rinchanV099CurrentEdit = kind;

  const layer = document.createElement('div');
  layer.id = 'mypageEditLayer';
  layer.className = 'mypage-edit-layer';
  layer.innerHTML =
    '<section class="mypage-edit-card" role="dialog" aria-modal="true" aria-label="' + v099EscapeHtml(title) + '">' +
      '<button class="mypage-modal-close" type="button" aria-label="閉じる">×</button>' +
      '<p class="label">編集</p>' +
      '<h2>' + v099EscapeHtml(title) + '</h2>' +
      '<form class="mypage-edit-form" id="mypageEditForm">' + bodyHtml +
        '<div class="mypage-modal-actions">' +
          '<button class="mypage-modal-cancel" type="button">キャンセル</button>' +
          '<button class="mypage-modal-save" type="submit">保存する</button>' +
        '</div>' +
      '</form>' +
    '</section>';

  document.body.appendChild(layer);

  const form = document.getElementById('mypageEditForm');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (kind === 'profile') saveProfile(event);
      if (kind === 'declaration') saveDeclaration(event);
      if (kind === 'goal') saveGoal(event);
    });
  }

  const closeButton = layer.querySelector('.mypage-modal-close');
  if (closeButton) closeButton.addEventListener('click', closeEditModalV099);
  const cancelButton = layer.querySelector('.mypage-modal-cancel');
  if (cancelButton) cancelButton.addEventListener('click', closeEditModalV099);
  layer.addEventListener('click', event => {
    if (event.target === layer) closeEditModalV099();
  });

  const first = layer.querySelector('input, select, textarea, button');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 80);
}

function showEdit(id) {
  const p = v099RequireUser();
  if (!p) return;

  if (id === 'profileEdit') {
    v099OpenModal('profile', 'プロフィール編集',
      '<label>氏名<input id="v099EditName" value="' + v099EscapeHtml(p.name || '') + '" placeholder="例：花田 博実"></label>' +
      '<label>所属<select id="v099EditDept">' + v099DeptOptions(p.dept || '') + '</select></label>' +
      '<label>ニックネーム<input id="v099EditNick" value="' + v099EscapeHtml(p.nick || '') + '" placeholder="例：はなだ"></label>'
    );
    return;
  }

  if (id === 'declarationEdit') {
    v099OpenModal('declaration', '健康宣言編集',
      '<label>健康宣言<textarea id="v099EditDeclaration" rows="4" placeholder="例：無理なく歩く習慣をつけます">' + v099EscapeHtml(p.declaration || '') + '</textarea></label>'
    );
    return;
  }

  if (id === 'goalEdit') {
    v099OpenModal('goal', '今週の目標編集',
      '<label>今週の目標<textarea id="v099EditGoal" rows="3" placeholder="例：今週は3回活動を記録する">' + v099EscapeHtml(p.weeklyGoal || '') + '</textarea></label>'
    );
  }
}

function closeEditModalV099() {
  const layer = document.getElementById('mypageEditLayer');
  if (layer) layer.remove();
}

async function v099RemoteSaveUser(p) {
  try {
    if (typeof saveRemote === 'function') {
      await saveRemote('saveUser', p);
      return;
    }
    if (typeof v051Api === 'function') {
      await v051Api('saveUser', p);
    }
  } catch (e) {}
}

function v099SetBusyFromEvent(event, busy) {
  const form = event && event.target ? event.target.closest('form') : document.getElementById('mypageEditForm');
  const button = form ? form.querySelector('.mypage-modal-save') : null;
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? '保存中...' : '保存する';
}

async function saveProfile(event) {
  if (event && event.preventDefault) event.preventDefault();
  const p = v099RequireUser();
  if (!p) return;

  v099SetBusyFromEvent(event, true);
  p.name = v099Value('v099EditName') || v099Value('editName') || p.name || 'ゲスト';
  p.dept = v099Value('v099EditDept') || v099Value('editDept') || '';
  p.nick = v099Value('v099EditNick') || v099Value('editNick') || '';
  p.updatedAt = new Date().toISOString();
  p.version = RINCHAN_V099;
  v099SaveParticipant(p);
  v099RenderMypage();
  await v099RemoteSaveUser(p);
  closeEditModalV099();
  v099ShowSavedToast('プロフィールを保存しました');
}

async function saveDeclaration(event) {
  if (event && event.preventDefault) event.preventDefault();
  const p = v099RequireUser();
  if (!p) return;

  v099SetBusyFromEvent(event, true);
  p.declaration = v099Value('v099EditDeclaration') || v099Value('editDeclaration');
  p.updatedAt = new Date().toISOString();
  p.version = RINCHAN_V099;
  v099SaveParticipant(p);
  v099RenderMypage();
  await v099RemoteSaveUser(p);
  closeEditModalV099();
  v099ShowSavedToast('健康宣言を保存しました');
}

async function saveGoal(event) {
  if (event && event.preventDefault) event.preventDefault();
  const p = v099RequireUser();
  if (!p) return;

  v099SetBusyFromEvent(event, true);
  p.weeklyGoal = v099Value('v099EditGoal') || v099Value('editGoal') || 'まずは無理なく続ける';
  p.updatedAt = new Date().toISOString();
  p.version = RINCHAN_V099;
  v099SaveParticipant(p);
  v099RenderMypage();
  await v099RemoteSaveUser(p);
  closeEditModalV099();
  v099ShowSavedToast('今週の目標を保存しました');
}

function v099ShowSavedToast(message) {
  const old = document.querySelector('.mypage-save-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.className = 'mypage-save-toast';
  toast.innerHTML = '<span>✅</span><strong>' + v099EscapeHtml(message) + '</strong>';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  v099RenderMypage();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeEditModalV099();
  });
});
