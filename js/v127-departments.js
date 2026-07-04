const RINCHAN_V127_DEPARTMENTS='v1.0.48';

const RINCHAN_DEFAULT_DEPARTMENTS=[
  {deptId:'caresupport',deptName:'ケアサポ',displayOrder:10,active:true,mapKey:'caresupport'},
  {deptId:'medicaltech',deptName:'医療技術部',displayOrder:20,active:true,mapKey:'medicaltech'},
  {deptId:'nurse',deptName:'看護部',displayOrder:30,active:true,mapKey:'nurse'},
  {deptId:'office',deptName:'事務部',displayOrder:40,active:true,mapKey:'office'}
];

function v127ReadJson(key,fallback){
  try{
    if(window.RinchanStorage&&typeof RinchanStorage.readJson==='function')return RinchanStorage.readJson(key,fallback);
    const raw=localStorage.getItem(key);
    return raw?JSON.parse(raw):fallback;
  }catch(e){return fallback}
}

function v127WriteJson(key,value){
  try{
    if(window.RinchanStorage&&typeof RinchanStorage.writeJson==='function')return RinchanStorage.writeJson(key,value);
    localStorage.setItem(key,JSON.stringify(value));
  }catch(e){}
  return value;
}

function v127Participant(){
  try{
    if(window.RinchanStorage&&typeof RinchanStorage.getParticipant==='function')return RinchanStorage.getParticipant()||{};
    return v127ReadJson('rinchanParticipant',{})||{};
  }catch(e){return {}}
}

function v127NormalizeDepartment(item,index){
  if(typeof item==='string')return {deptId:item,deptName:item,displayOrder:index+1,active:true};
  const name=String(item.deptName||item.name||item.department||item.dept||item.section||item.id||'').trim();
  if(!name)return null;
  const activeRaw=item.active!==undefined?item.active:item.isActive;
  const active=activeRaw===undefined||activeRaw===true||String(activeRaw).toUpperCase()==='TRUE'||String(activeRaw)==='1'||String(activeRaw)==='表示';
  return {
    deptId:String(item.deptId||item.id||item.key||name).trim(),
    deptName:name,
    displayOrder:Number(item.displayOrder||item.order||item.sort||index+1)||index+1,
    active,
    mapKey:String(item.mapKey||item.key||'').trim()
  };
}

function v127NormalizeDepartments(list){
  const rows=(Array.isArray(list)?list:[]).map(v127NormalizeDepartment).filter(Boolean).filter(d=>d.active!==false&&d.deptName);
  const seen={};
  return rows.filter(d=>{const key=String(d.deptName);if(seen[key])return false;seen[key]=true;return true;}).sort((a,b)=>(Number(a.displayOrder||999)-Number(b.displayOrder||999))||String(a.deptName).localeCompare(String(b.deptName),'ja'));
}

function v127CachedDepartments(){
  const cached=v127ReadJson('rinchanDepartments',null);
  if(Array.isArray(cached))return v127NormalizeDepartments(cached);
  if(cached&&Array.isArray(cached.departments))return v127NormalizeDepartments(cached.departments);
  const state=v127ReadJson('rinchanMoriState',null);
  if(state&&Array.isArray(state.departments))return v127NormalizeDepartments(state.departments);
  return [];
}

async function v127Request(action,payload){
  if(window.RinchanApi&&typeof RinchanApi.request==='function')return RinchanApi.request(action,payload||{});
  if(typeof v051Api==='function')return v051Api(action,payload||{});
  return {ok:false,reason:'api_not_ready'};
}

function v127ApplyState(result){
  try{
    if(result&&result.ok&&result.state&&window.RinchanSync&&typeof RinchanSync.applyApiResult==='function')RinchanSync.applyApiResult(result);
  }catch(e){}
}

async function v127FetchDepartments(){
  const cached=v127CachedDepartments();
  if(cached.length)return cached;
  try{
    const direct=await v127Request('departments',{force:true,ts:Date.now()});
    if(direct&&direct.ok){
      const rows=v127NormalizeDepartments(direct.departments||direct.depts||direct.sections||(direct.state&&direct.state.departments));
      if(rows.length){v127WriteJson('rinchanDepartments',rows);return rows;}
      v127ApplyState(direct);
      const after=v127CachedDepartments();
      if(after.length)return after;
    }
  }catch(e){}
  try{
    const user=v127Participant();
    const employeeId=String(user.employeeId||user.id||'').trim();
    if(employeeId){
      const state=await v127Request('getUserState',{employeeId,force:true,ts:Date.now()});
      v127ApplyState(state);
      const after=v127CachedDepartments();
      if(after.length)return after;
    }
  }catch(e){}
  return RINCHAN_DEFAULT_DEPARTMENTS;
}

function v127FillSelect(select,departments,currentValue){
  if(!select)return;
  const current=currentValue!==undefined?String(currentValue||''):String(select.value||'');
  const list=v127NormalizeDepartments(departments&&departments.length?departments:RINCHAN_DEFAULT_DEPARTMENTS);
  select.innerHTML='<option value="">選択してください</option>'+list.map(d=>'<option value="'+v127Esc(d.deptName)+'">'+v127Esc(d.deptName)+'</option>').join('');
  if(current){
    const has=list.some(d=>String(d.deptName)===String(current));
    if(!has)select.insertAdjacentHTML('beforeend','<option value="'+v127Esc(current)+'">'+v127Esc(current)+'（現在）</option>');
    select.value=current;
  }
}

function v127Esc(value){return String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function v127InitDepartmentSelects(){
  const p=v127Participant();
  const cached=v127CachedDepartments();
  const dept=document.getElementById('dept');
  const editDept=document.getElementById('editDept');
  if(cached.length){
    v127FillSelect(dept,cached,dept?dept.value:'');
    v127FillSelect(editDept,cached,p.dept||p.department||'');
  }
  const departments=await v127FetchDepartments();
  v127FillSelect(dept,departments,dept?dept.value:'');
  v127FillSelect(editDept,departments,p.dept||p.department||'');
}

window.v127ReloadDepartments=v127InitDepartmentSelects;
document.addEventListener('DOMContentLoaded',v127InitDepartmentSelects);
window.addEventListener('pageshow',function(){setTimeout(v127InitDepartmentSelects,120);});
