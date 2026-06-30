const RINCHAN_V127_DEPARTMENTS='v0.9.30';
const RINCHAN_DEFAULT_DEPARTMENTS=[
  {deptId:'nurse',deptName:'看護部',displayOrder:10,active:true,mapKey:'nurse'},
  {deptId:'reha',deptName:'リハビリテーション部',displayOrder:20,active:true,mapKey:'reha'},
  {deptId:'care',deptName:'介護部',displayOrder:30,active:true,mapKey:'care'},
  {deptId:'doctor',deptName:'医局',displayOrder:40,active:true,mapKey:'doctor'},
  {deptId:'pharmacy',deptName:'薬剤部',displayOrder:50,active:true,mapKey:'pharmacy'},
  {deptId:'nutrition',deptName:'栄養科',displayOrder:60,active:true,mapKey:'nutrition'},
  {deptId:'office',deptName:'事務部',displayOrder:70,active:true,mapKey:'office'},
  {deptId:'other',deptName:'その他',displayOrder:90,active:true,mapKey:'other'}
];
function v127ReadJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){return fallback}}
function v127Participant(){return v127ReadJson('rinchanParticipant',{})||{}}
async function v127FetchDepartments(){
  try{
    if(typeof v051Api==='function'){
      const result=await v051Api('departments',{force:true,ts:Date.now()});
      if(result&&result.ok&&Array.isArray(result.departments)&&result.departments.length){
        localStorage.setItem('rinchanDepartments',JSON.stringify({savedAt:new Date().toISOString(),departments:result.departments}));
        return result.departments;
      }
    }
  }catch(e){}
  const cached=v127ReadJson('rinchanDepartments',null);
  if(cached&&Array.isArray(cached.departments)&&cached.departments.length)return cached.departments;
  return RINCHAN_DEFAULT_DEPARTMENTS;
}
function v127FillSelect(select,departments,currentValue){
  if(!select)return;
  const current=currentValue!==undefined?currentValue:select.value;
  const list=(departments&&departments.length?departments:RINCHAN_DEFAULT_DEPARTMENTS).filter(d=>d&&d.deptName);
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
  const departments=await v127FetchDepartments();
  const dept=document.getElementById('dept');
  const editDept=document.getElementById('editDept');
  v127FillSelect(dept,departments,dept?dept.value:'');
  v127FillSelect(editDept,departments,p.dept||'');
}
window.v127ReloadDepartments=v127InitDepartmentSelects;
document.addEventListener('DOMContentLoaded',v127InitDepartmentSelects);
