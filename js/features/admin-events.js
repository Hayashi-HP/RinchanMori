const RinchanAdminEvents = (() => {
  const VERSION = 'v1.0.0';
  const state = { rows:[], editing:null, loading:false, saving:false, deleting:false };

  function byId(id) { return document.getElementById(id); }
  function value(id) { const el = byId(id); return el ? String(el.value || '').trim() : ''; }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }

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

  function currentYear() { return new Date().getFullYear(); }
  function pad(v) { return String(v).padStart(2, '0'); }
  function dateKey(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
  function formatDate(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? Number(match[2]) + '/' + Number(match[3]) : String(value || '-');
  }

  function setStatus(text, error) {
    const el = byId('adminEventsStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!error);
  }

  function setMessage(text, type) {
    const el = byId('adminEventMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('is-success','is-error','is-info');
    if (text) el.classList.add(type === 'error' ? 'is-error' : (type === 'success' ? 'is-success' : 'is-info'));
  }

  function setRefreshBusy(busy) {
    const button = byId('adminEventsRefresh');
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle('is-refreshing', !!busy);
    button.setAttribute('aria-label', busy ? 'イベント一覧を更新中' : 'イベント一覧を更新');
  }

  function sourceLabel(row) {
    if (row.source === 'custom') return '追加';
    if (row.source === 'override') return '調整済み';
    return '標準';
  }

  function renderList() {
    const box = byId('adminEventsList');
    if (!box) return;
    if (!state.rows.length) { box.innerHTML = '<p class="admin-empty">イベントがありません。</p>'; return; }
    box.innerHTML = state.rows.map(row => {
      const statusClass = row.active ? 'is-active' : 'is-inactive';
      const statusLabel = row.active ? sourceLabel(row) : '休止中';
      const reset = row.source === 'override'
        ? '<button type="button" class="soft-button challenge-reset-button" data-action="delete-event" data-id="' + escapeHtml(row.eventId || '') + '">標準に戻す</button>'
        : (row.source === 'custom' ? '<button type="button" class="soft-button challenge-reset-button" data-action="delete-event" data-id="' + escapeHtml(row.eventId || '') + '">削除</button>' : '');
      const identity = row.eventId || ('standard:' + row.baseKey);
      return '<details class="admin-badge-row">'
        + '<summary class="admin-badge-summary"><span class="admin-badge-icon">' + escapeHtml(row.icon || '🎪') + '</span><span class="admin-badge-summary-copy"><strong>' + escapeHtml(row.title || '-') + '</strong><small>' + escapeHtml(formatDate(row.startDate)) + '〜' + escapeHtml(formatDate(row.endDate)) + '・' + escapeHtml(sourceLabel(row)) + '</small></span><span class="admin-badge-status ' + statusClass + '">' + statusLabel + '</span></summary>'
        + '<div class="admin-badge-row-detail"><div class="admin-badge-meta"><small>表示メッセージ</small><b>' + escapeHtml(row.text || '未設定') + '</b></div><div class="admin-badge-row-actions"><button type="button" class="soft-button" data-action="edit-event" data-id="' + escapeHtml(identity) + '">編集</button>' + reset + '</div></div>'
        + '</details>';
    }).join('');
  }

  async function loadEvents() {
    if (state.loading) return;
    state.loading = true;
    setRefreshBusy(true);
    setStatus('イベント一覧を読み込み中...', false);
    try {
      const auth = authState();
      const result = await api('adminEventList', { employeeId:auth.employeeId, year:value('adminEventFilterYear') });
      if (!result || !result.ok || !result.data) throw new Error(String((result && (result.reason || result.error)) || 'list_failed'));
      state.rows = Array.isArray(result.data.events) ? result.data.events : [];
      renderList();
      setStatus(result.data.year + '年・標準調整 ' + Number(result.data.adjustedCount || 0) + '件・追加 ' + Number(result.data.customCount || 0) + '件', false);
    } catch (e) {
      state.rows = [];
      renderList();
      setStatus('イベント一覧を取得できませんでした。', true);
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.loading = false;
      setRefreshBusy(false);
    }
  }

  function findEvent(id) {
    if (String(id || '').indexOf('standard:') === 0) {
      const key = String(id).slice(9);
      return state.rows.find(row => row.source === 'standard' && row.baseKey === key) || null;
    }
    return state.rows.find(row => String(row.eventId || '') === String(id || '')) || null;
  }

  function defaultCustomDates(year) {
    const now = new Date();
    const start = now.getFullYear() === Number(year) ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : new Date(Number(year), 0, 1);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    if (end.getFullYear() !== Number(year)) return { start:dateKey(start), end:Number(year) + '-12-31' };
    return { start:dateKey(start), end:dateKey(end) };
  }

  function openEditor(row) {
    const year = Number(value('adminEventFilterYear') || currentYear());
    const dates = defaultCustomDates(year);
    state.editing = row || { eventId:'', year, eventType:'custom', baseKey:'', source:'custom' };
    byId('adminEventEditorTitle').textContent = row ? (row.source === 'standard' ? '標準イベントを調整' : 'イベントを編集') : '期間限定イベントを追加';
    byId('adminEventEditorNote').textContent = row && row.source !== 'custom'
      ? 'この年だけ標準内容を上書きします。標準の専用演出はそのまま使用されます。'
      : '追加イベントは共通デザインで表示され、期間中は標準イベントより優先されます。';
    byId('adminEventIcon').value = row ? String(row.icon || '') : '🎪';
    byId('adminEventTitle').value = row ? String(row.title || '') : '';
    byId('adminEventStart').value = row ? String(row.startDate || '') : dates.start;
    byId('adminEventEnd').value = row ? String(row.endDate || '') : dates.end;
    byId('adminEventText').value = row ? String(row.text || '') : '';
    byId('adminEventActive').value = row && row.active === false ? 'false' : 'true';
    setMessage('', 'info');
    const editor = byId('adminEventEditor');
    editor.classList.remove('hidden');
    editor.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function closeEditor() {
    state.editing = null;
    byId('adminEventEditor').classList.add('hidden');
    setMessage('', 'info');
  }

  function errorMessage(reason) {
    const messages = {
      admin_required:'管理者として認証できませんでした。もう一度ログインしてください。',
      manage_events_required:'イベント管理の権限がありません。',
      event_not_found:'対象のイベントが見つかりません。',
      event_year_required:'対象年を確認してください。',
      event_standard_not_found:'標準イベントが見つかりません。',
      event_date_required:'開始日と終了日を入力してください。',
      event_date_year_mismatch:'開始日と終了日は対象年の範囲で入力してください。',
      event_date_order_invalid:'終了日は開始日以降にしてください。',
      event_title_required:'イベント名を入力してください。',
      event_override_duplicate:'この標準イベントはすでに調整されています。',
      event_custom_overlap:'同じ期間に別の追加イベントがあります。期間が重ならないようにしてください。',
      event_icon_too_long:'アイコンが長すぎます。',
      event_title_too_long:'イベント名は80文字以内で入力してください。',
      event_text_too_long:'メッセージは240文字以内で入力してください。'
    };
    return messages[String(reason || '')] || '通信に失敗しました。時間をおいてもう一度お試しください。';
  }

  function setSaving(busy) {
    state.saving = !!busy;
    ['adminEventSave','adminEventCancel','adminEventCreate','adminEventsRefresh'].forEach(id => { const el = byId(id); if (el) el.disabled = !!busy; });
    byId('adminEventSave').textContent = busy ? '保存中...' : '変更を保存';
  }

  async function saveEvent() {
    if (state.saving || !state.editing) return;
    const title = value('adminEventTitle');
    const startDate = value('adminEventStart');
    const endDate = value('adminEventEnd');
    if (!title) { setMessage('イベント名を入力してください。', 'error'); return; }
    if (!startDate || !endDate || startDate > endDate) { setMessage('開始日と終了日を確認してください。', 'error'); return; }
    if (!confirm('「' + title + '」のイベント設定を保存します。よろしいですか？')) return;
    setSaving(true);
    setMessage('保存しています...', 'info');
    try {
      const auth = authState();
      const editing = state.editing;
      const result = await api('adminSaveEvent', {
        employeeId:auth.employeeId,
        eventId:editing.eventId || '',
        year:Number(value('adminEventFilterYear') || editing.year || currentYear()),
        eventType:editing.source === 'custom' ? 'custom' : 'override',
        baseKey:editing.baseKey || '',
        icon:value('adminEventIcon'),
        title,
        startDate,
        endDate,
        text:value('adminEventText'),
        active:value('adminEventActive') === 'true'
      });
      if (!result || !result.ok || !result.saved) throw new Error(String((result && (result.reason || result.error)) || 'save_failed'));
      await loadEvents();
      closeEditor();
      setMessage('イベント設定を保存しました。利用者画面には次回同期時に反映されます。', 'success');
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(row) {
    if (!row || !row.eventId || state.deleting || state.saving) return;
    const reset = row.source === 'override';
    const prompt = reset ? 'この年の調整内容を削除し、標準イベントへ戻します。よろしいですか？' : '追加したイベントを削除します。よろしいですか？';
    if (!confirm(prompt)) return;
    state.deleting = true;
    setMessage(reset ? '標準イベントへ戻しています...' : '削除しています...', 'info');
    try {
      const auth = authState();
      const result = await api('adminDeleteEvent', { employeeId:auth.employeeId, eventId:row.eventId });
      if (!result || !result.ok || !result.deleted) throw new Error(String((result && (result.reason || result.error)) || 'delete_failed'));
      closeEditor();
      await loadEvents();
      setMessage(reset ? '標準イベントへ戻しました。' : '追加イベントを削除しました。', 'success');
    } catch (e) {
      setMessage(errorMessage(e.message), 'error');
    } finally {
      state.deleting = false;
    }
  }

  function bind() {
    byId('adminEventsRefresh').addEventListener('click', loadEvents);
    byId('adminEventFilterYear').addEventListener('change', () => { closeEditor(); loadEvents(); });
    byId('adminEventCreate').addEventListener('click', () => openEditor(null));
    byId('adminEventSave').addEventListener('click', saveEvent);
    byId('adminEventCancel').addEventListener('click', closeEditor);
    byId('adminEventsList').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const row = findEvent(button.dataset.id);
      if (!row) return;
      if (button.dataset.action === 'edit-event') openEditor(row);
      if (button.dataset.action === 'delete-event') deleteEvent(row);
    });
  }

  function init() {
    if (!guardPageAccess()) return;
    byId('adminEventFilterYear').value = String(currentYear());
    bind();
    loadEvents();
  }

  return { VERSION, init, loadEvents };
})();

document.addEventListener('DOMContentLoaded', RinchanAdminEvents.init);
