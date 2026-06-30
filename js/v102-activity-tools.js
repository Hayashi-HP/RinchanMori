const RINCHAN_V102 = 'v0.9.14';
const RINCHAN_ACTIVITY_KEY = 'rinchanActivities';
const RINCHAN_ACTIVITY_LIMIT = 10;

function v102ReadJson(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}
function v102SaveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function v102Activities() { return v102ReadJson(RINCHAN_ACTIVITY_KEY, []); }
function v102Participant() { return v102ReadJson('rinchanParticipant', null) || {}; }
function v102Num(n) { return Number(n || 0).toLocaleString('ja-JP'); }
function v102EscapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function v102FindActivity(activityId) { return v102Activities().find(item => String(item.activityId) === String(activityId)); }
function v102DateLabel(date) { if (!date) return '日付未設定'; const d = new Date(String(date) + 'T00:00:00'); if (isNaN(d)) return date; return (d.getMonth()+1) + '/' + d.getDate(); }
function v102SetBusy(button, busy, label) { if (!button) return; button.disabled = busy; button.textContent = busy ? (label || '保存中...') : '保存する'; }

function v102RenderActivityTools() {
  const box = document.getElementById('activityToolsList');
  if (!box) return;
  const all = v102Activities().slice().sort((a,b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
  if (!all.length) { box.innerHTML = '<p class="empty-note">まだ修正できる記録はありません。</p>'; return; }
  const list = all.slice(0, RINCHAN_ACTIVITY_LIMIT);
  box.innerHTML = '<div class="activity-tools-count">最新' + list.length + '件を表示中' + (all.length > list.length ? '（全' + all.length + '件）' : '') + '</div>' + list.map(item => {
    const id = String(item.activityId || '');
    const comment = String(item.comment || '').trim() || (item.challenge ? 'チャレンジあり' : '');
    return '<article class="activity-row compact-row">' +
      '<div class="activity-row-date">' + v102EscapeHtml(v102DateLabel(item.date)) + '</div>' +
      '<div class="activity-row-steps">' + v102Num(item.steps) + '<small>歩</small></div>' +
      '<div class="activity-row-comment">' + v102EscapeHtml(comment) + '</div>' +
      '<div class="activity-row-actions">' +
        '<button type="button" class="activity-edit-btn icon-action" data-edit-id="' + v102EscapeHtml(id) + '" aria-label="修正">✏️</button>' +
        '<button type="button" class="activity-delete-btn icon-action" data-delete-id="' + v102EscapeHtml(id) + '" aria-label="削除">🗑️</button>' +
      '</div>' +
    '</article>';
  }).join('');
  box.querySelectorAll('[data-edit-id]').forEach(btn => btn.addEventListener('click', () => v102OpenActivityEdit(btn.dataset.editId)));
  box.querySelectorAll('[data-delete-id]').forEach(btn => btn.addEventListener('click', () => v102DeleteActivity(btn.dataset.deleteId)));
}

function v102OpenActivityEdit(activityId) {
  const item = v102FindActivity(activityId);
  if (!item) { alert('記録が見つかりません。'); return; }
  v102CloseActivityEdit();
  const layer = document.createElement('div');
  layer.id = 'activityEditLayer';
  layer.className = 'activity-edit-layer';
  layer.innerHTML = '<section class="activity-edit-card" role="dialog" aria-modal="true" aria-label="歩数記録を修正">' +
    '<button type="button" class="activity-edit-close" aria-label="閉じる">×</button>' +
    '<p class="label">記録の修正</p>' +
    '<h2>歩数記録を修正</h2>' +
    '<form class="activity-edit-form" id="activityEditForm">' +
      '<label>活動日<input id="editActivityDate" type="date" value="' + v102EscapeHtml(item.date || '') + '" required></label>' +
      '<label>歩数<input id="editActivitySteps" type="number" value="' + v102EscapeHtml(item.steps || 0) + '" required></label>' +
      '<label class="activity-edit-check"><input id="editActivityChallenge" type="checkbox"' + (item.challenge === true || item.challenge === 'true' ? ' checked' : '') + '>今週のチャレンジ：階段を使った</label>' +
      '<label>ひとこと<textarea id="editActivityComment" rows="3">' + v102EscapeHtml(item.comment || '') + '</textarea></label>' +
      '<div class="activity-edit-actions"><button type="button" class="activity-edit-cancel">キャンセル</button><button type="submit" class="activity-edit-save">保存する</button></div>' +
    '</form>' +
  '</section>';
  document.body.appendChild(layer);
  layer.querySelector('.activity-edit-close').addEventListener('click', v102CloseActivityEdit);
  layer.querySelector('.activity-edit-cancel').addEventListener('click', v102CloseActivityEdit);
  layer.addEventListener('click', event => { if (event.target === layer) v102CloseActivityEdit(); });
  layer.querySelector('#activityEditForm').addEventListener('submit', event => { event.preventDefault(); v102SaveActivityEdit(activityId, event); });
}
function v102CloseActivityEdit() { const layer = document.getElementById('activityEditLayer'); if (layer) layer.remove(); }

async function v102SaveActivityEdit(activityId, event) {
  const form = event && event.target ? event.target : document.getElementById('activityEditForm');
  const saveButton = form ? form.querySelector('.activity-edit-save') : null;
  v102SetBusy(saveButton, true, '保存中...');
  try {
    const list = v102Activities();
    const idx = list.findIndex(item => String(item.activityId) === String(activityId));
    if (idx < 0) { alert('記録が見つかりません。'); v102SetBusy(saveButton, false); return; }
    const item = Object.assign({}, list[idx]);
    item.date = document.getElementById('editActivityDate').value;
    item.steps = Number(document.getElementById('editActivitySteps').value || 0);
    item.challenge = document.getElementById('editActivityChallenge').checked;
    item.comment = String(document.getElementById('editActivityComment').value || '').trim();
    item.updatedAt = new Date().toISOString();
    item.version = RINCHAN_V102;
    list[idx] = item;
    v102SaveJson(RINCHAN_ACTIVITY_KEY, list);
    await v102SaveRemote('saveActivity', item);
    v102CloseActivityEdit();
    v102RenderActivityTools();
    v102ShowToast('記録を修正しました');
  } catch (e) {
    v102SetBusy(saveButton, false);
    alert('保存できませんでした。もう一度お試しください。');
  }
}

async function v102DeleteActivity(activityId) {
  const item = v102FindActivity(activityId);
  if (!item) { alert('記録が見つかりません。'); return; }
  if (!confirm(v102DateLabel(item.date) + 'の記録を削除しますか？')) return;
  const list = v102Activities().filter(a => String(a.activityId) !== String(activityId));
  v102SaveJson(RINCHAN_ACTIVITY_KEY, list);
  const p = v102Participant();
  await v102SaveRemote('deleteActivity', { activityId, participantId: item.participantId || p.id || p.employeeId || '', deviceId: item.deviceId || p.deviceId || '', deletedAt: new Date().toISOString(), version: RINCHAN_V102 });
  v102RenderActivityTools();
  v102ShowToast('記録を削除しました');
}

async function v102SaveRemote(action, payload) {
  try {
    let result = null;
    if (typeof rinchanApi === 'function') result = await rinchanApi(action, payload);
    else if (typeof v051Api === 'function') result = await v051Api(action, payload);
    if (result && !result.ok && typeof queuePending === 'function') queuePending(action, payload, result.reason || result.error || 'remote_error');
  } catch (e) {
    if (typeof queuePending === 'function') queuePending(action, payload, e.message || 'remote_error');
  }
}

function v102ShowToast(message) {
  const old = document.querySelector('.activity-toast'); if (old) old.remove();
  const toast = document.createElement('div'); toast.className = 'activity-toast'; toast.textContent = message;
  document.body.appendChild(toast); setTimeout(() => toast.remove(), 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  v102RenderActivityTools();
  const form = document.getElementById('activityForm');
  if (form) form.addEventListener('submit', () => setTimeout(v102RenderActivityTools, 500));
});
