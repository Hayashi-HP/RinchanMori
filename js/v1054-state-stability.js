/* v1.0.54 state stability layer
   - Keep edited profile visible immediately
   - Mirror current user into mori member cache
   - Prevent older sync user data from overwriting newer local edits
   - Keep department select populated before remote data arrives
*/
(function(){
  var VERSION = 'v1.0.54';
  var USER_KEY = 'rinchanParticipant';
  var MEMBERS_KEY = 'rinchanMoriMembers';
  var DEPTS_KEY = 'rinchanDepartments';
  var LOCAL_PROFILE_KEY = 'rinchanLocalProfileUpdatedAt';
  var installed = false;

  function readJson(key, fallback){
    try{
      if(window.RinchanStorage && typeof RinchanStorage.readJson === 'function'){
        return RinchanStorage.readJson(key, fallback);
      }
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try{
      if(window.RinchanStorage && typeof RinchanStorage.writeJson === 'function'){
        return RinchanStorage.writeJson(key, value);
      }
      localStorage.setItem(key, JSON.stringify(value));
    }catch(e){}
    return value;
  }

  function user(){
    try{
      if(window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function'){
        return RinchanStorage.getParticipant();
      }
    }catch(e){}
    return readJson(USER_KEY, null);
  }

  function uid(u){ return String((u && (u.employeeId || u.id || u.participantId)) || '').trim(); }
  function clean(v){ return String(v || '').trim(); }
  function timeScore(v){ var t = Date.parse(v || ''); return isNaN(t) ? 0 : t; }
  function nowIso(){ return new Date().toISOString(); }

  function localProfileScore(){
    var u = user() || {};
    return Math.max(timeScore(localStorage.getItem(LOCAL_PROFILE_KEY)), timeScore(u.updatedAt), timeScore(u.localUpdatedAt));
  }

  function normalizeDeptName(value){ return clean(value) || 'その他'; }

  function normalizeMember(item){
    item = item || {};
    return {
      employeeId: String(item.employeeId || item.id || item.participantId || ''),
      id: String(item.id || item.employeeId || item.participantId || ''),
      name: String(item.name || item.displayName || ''),
      nick: String(item.nick || item.nickname || ''),
      dept: normalizeDeptName(item.dept || item.department || item.section),
      totalSteps: Number(item.totalSteps || item.steps || item.sumSteps || 0),
      activityCount: Number(item.activityCount || item.count || 0),
      updatedAt: String(item.updatedAt || item.localUpdatedAt || '')
    };
  }

  function ensureDepartmentOption(dept){
    dept = clean(dept);
    var select = document.getElementById('editDept');
    if(!select || !dept) return;
    var exists = Array.prototype.some.call(select.options || [], function(opt){ return opt.value === dept || opt.textContent === dept; });
    if(!exists){
      var opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      select.appendChild(opt);
    }
    select.value = dept;
  }

  function rebuildDeptOptions(){
    var select = document.getElementById('editDept');
    if(!select) return;
    var u = user() || {};
    var current = clean(u.dept || u.department || select.value);
    var names = [];
    function add(name){ name = clean(name); if(name && names.indexOf(name) < 0) names.push(name); }
    add(current);
    (readJson(DEPTS_KEY, []) || []).forEach(function(d){ add(typeof d === 'string' ? d : (d.name || d.dept || d.department || d.id)); });
    (readJson(MEMBERS_KEY, []) || []).forEach(function(m){ add(m.dept || m.department || m.section); });
    ['看護部','リハビリテーション部','介護部','医局','薬剤部','栄養科','事務部','その他'].forEach(add);
    var html = '<option value="">選択してください</option>' + names.map(function(name){ return '<option value="' + escapeAttr(name) + '">' + escapeHtml(name) + '</option>'; }).join('');
    if(select.innerHTML !== html) select.innerHTML = html;
    if(current) select.value = current;
  }

  function mirrorUserToMembers(patchOnly){
    var u = user();
    var id = uid(u);
    if(!u || !id) return;
    var list = readJson(MEMBERS_KEY, []);
    if(!Array.isArray(list)) list = [];
    var currentSteps = 0;
    var currentCount = 0;
    try{
      (readJson('rinchanActivities', []) || []).forEach(function(a){ currentSteps += Number(a.steps || 0); currentCount += 1; });
    }catch(e){}
    var found = false;
    var next = list.map(function(raw){
      var m = normalizeMember(raw);
      if(String(m.employeeId || m.id) === id){
        found = true;
        return Object.assign({}, m, {
          employeeId: id,
          id: id,
          name: clean(u.name) || m.name,
          nick: clean(u.nick) || m.nick,
          dept: normalizeDeptName(u.dept || u.department || m.dept),
          totalSteps: Math.max(Number(m.totalSteps || 0), currentSteps),
          activityCount: Math.max(Number(m.activityCount || 0), currentCount),
          updatedAt: u.updatedAt || u.localUpdatedAt || nowIso()
        });
      }
      return m;
    });
    if(!found){
      next.unshift({
        employeeId: id,
        id: id,
        name: clean(u.name) || clean(u.nick) || '',
        nick: clean(u.nick) || '',
        dept: normalizeDeptName(u.dept || u.department),
        totalSteps: currentSteps,
        activityCount: currentCount,
        updatedAt: u.updatedAt || u.localUpdatedAt || nowIso()
      });
    }
    writeJson(MEMBERS_KEY, next);
    if(!patchOnly) refreshMoriSoon();
  }

  function reconcileLocalProfile(){
    var u = user();
    if(!u) return;
    if(!u.localUpdatedAt && !u.updatedAt) return;
    mirrorUserToMembers(true);
  }

  function refreshMoriSoon(){
    setTimeout(function(){
      try{ if(window.RinchanMori && typeof RinchanMori.renderAll === 'function') RinchanMori.renderAll(); }catch(e){}
    }, 40);
  }

  function refreshMyPageSoon(){
    setTimeout(function(){
      try{ if(window.RinchanMypage && typeof RinchanMypage.renderProfile === 'function') RinchanMypage.renderProfile(); }catch(e){}
      try{ if(window.RinchanMypage && typeof RinchanMypage.renderAll === 'function') RinchanMypage.renderAll(); }catch(e){}
    }, 40);
  }

  function markLocalEdit(){
    var stamp = nowIso();
    localStorage.setItem(LOCAL_PROFILE_KEY, stamp);
    var u = user() || {};
    u.updatedAt = stamp;
    u.localUpdatedAt = stamp;
    writeJson(USER_KEY, u);
    return u;
  }

  function patchSync(){
    if(!window.RinchanSync || window.RinchanSync.__v1054Patched) return false;
    var originalApplyState = window.RinchanSync.applyState;
    var originalApplyApiResult = window.RinchanSync.applyApiResult;
    var originalSync = window.RinchanSync.sync;

    window.RinchanSync.applyState = function(state){
      var before = user() || {};
      var localScore = localProfileScore();
      var remoteUser = state && state.user ? Object.assign({}, state.user) : null;
      var remoteScore = remoteUser ? Math.max(timeScore(remoteUser.updatedAt), timeScore(remoteUser.localUpdatedAt), timeScore(remoteUser.savedAt)) : 0;
      var shouldKeepLocalUser = !!(remoteUser && uid(before) && uid(remoteUser) && uid(before) === uid(remoteUser) && localScore > remoteScore);
      var nextState = state;
      if(shouldKeepLocalUser){
        nextState = Object.assign({}, state, { user: Object.assign({}, remoteUser, before) });
      }
      var changed = originalApplyState ? originalApplyState.call(window.RinchanSync, nextState) : false;
      if(shouldKeepLocalUser) writeJson(USER_KEY, before);
      reconcileLocalProfile();
      return changed;
    };

    window.RinchanSync.applyApiResult = function(response){
      if(!response || !response.ok || !response.state){
        return originalApplyApiResult ? originalApplyApiResult.call(window.RinchanSync, response) : response;
      }
      window.RinchanSync.applyState(response.state);
      try{ if(window.RinchanSync.setStatus) window.RinchanSync.setStatus('synced',''); }catch(e){}
      refreshMyPageSoon();
      refreshMoriSoon();
      return response;
    };

    window.RinchanSync.sync = function(options){
      reconcileLocalProfile();
      var result = originalSync ? originalSync.call(window.RinchanSync, options) : undefined;
      setTimeout(reconcileLocalProfile, 250);
      setTimeout(refreshMoriSoon, 450);
      return result;
    };

    window.RinchanSync.__v1054Patched = true;
    return true;
  }

  function patchProfileSave(){
    if(window.__v1054ProfileSavePatched) return false;
    if(typeof window.saveProfile !== 'function') return false;
    var original = window.saveProfile;
    window.saveProfile = function(e){
      var u = user() || {};
      var nameEl = document.getElementById('editName');
      var deptEl = document.getElementById('editDept');
      var nickEl = document.getElementById('editNick');
      var stamp = nowIso();
      var next = Object.assign({}, u, {
        name: nameEl ? clean(nameEl.value) || u.name || '' : u.name,
        dept: deptEl ? clean(deptEl.value) || u.dept || '' : u.dept,
        nick: nickEl ? clean(nickEl.value) : (u.nick || ''),
        updatedAt: stamp,
        localUpdatedAt: stamp
      });
      localStorage.setItem(LOCAL_PROFILE_KEY, stamp);
      writeJson(USER_KEY, next);
      mirrorUserToMembers(true);
      immediateProfileText(next);
      refreshMoriSoon();
      var res = original.call(this, e);
      setTimeout(function(){ markLocalEdit(); mirrorUserToMembers(false); refreshMyPageSoon(); }, 30);
      return res;
    };
    window.__v1054ProfileSavePatched = true;
    return true;
  }

  function immediateProfileText(u){
    function set(id, text){ var el = document.getElementById(id); if(el) el.textContent = text; }
    set('v070ProfileName', u.name || 'ゲスト');
    set('v070ProfileDept', u.dept || '未設定');
    set('v070ProfileNick', u.nick || '-');
  }

  function patchShowEdit(){
    if(window.__v1054ShowEditPatched) return false;
    if(typeof window.showEdit !== 'function') return false;
    var original = window.showEdit;
    window.showEdit = function(id){
      if(id === 'profileEdit'){
        rebuildDeptOptions();
        var u = user() || {};
        ensureDepartmentOption(u.dept || u.department || '');
      }
      var res = original.apply(this, arguments);
      if(id === 'profileEdit'){
        setTimeout(function(){ rebuildDeptOptions(); var u = user() || {}; ensureDepartmentOption(u.dept || u.department || ''); }, 10);
        setTimeout(function(){ rebuildDeptOptions(); var u = user() || {}; ensureDepartmentOption(u.dept || u.department || ''); }, 120);
      }
      return res;
    };
    window.__v1054ShowEditPatched = true;
    return true;
  }

  function install(){
    if(installed) return;
    installed = true;
    reconcileLocalProfile();
    rebuildDeptOptions();
    var tries = 0;
    var timer = setInterval(function(){
      tries += 1;
      patchSync();
      patchProfileSave();
      patchShowEdit();
      reconcileLocalProfile();
      if(tries > 40 || (window.RinchanSync && window.RinchanSync.__v1054Patched && window.__v1054ProfileSavePatched && window.__v1054ShowEditPatched)) clearInterval(timer);
    }, 100);

    document.addEventListener('click', function(e){
      var t = e.target;
      if(!t) return;
      if(t.closest && t.closest('.profile-edit-icon')){
        rebuildDeptOptions();
        var u = user() || {};
        ensureDepartmentOption(u.dept || u.department || '');
      }
    }, true);

    window.addEventListener('storage', function(ev){
      if(!ev || ev.key === USER_KEY || ev.key === MEMBERS_KEY){
        reconcileLocalProfile();
        refreshMoriSoon();
      }
    });

    document.addEventListener('visibilitychange', function(){
      if(!document.hidden){ reconcileLocalProfile(); refreshMoriSoon(); refreshMyPageSoon(); }
    });

    window.RinchanStateStability = {
      VERSION: VERSION,
      reconcileLocalProfile: reconcileLocalProfile,
      mirrorUserToMembers: mirrorUserToMembers,
      rebuildDeptOptions: rebuildDeptOptions
    };
  }

  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function escapeAttr(value){ return escapeHtml(value).replace(/`/g, '&#96;'); }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
