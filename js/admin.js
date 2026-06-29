document.addEventListener('DOMContentLoaded',()=>{initAdmin();});

const ADMIN_VERSION='v0.4.1';
const ADMIN_CACHE_KEY='rinchanAdminStatsCache';
let adminData=null;

function initAdmin(){
  const refresh=document.getElementById('adminRefreshButton');
  if(refresh)refresh.addEventListener('click',()=>loadAdminStats(true));
  const csv=document.getElementById('downloadCsvButton');
  if(csv)csv.addEventListener('click',downloadAdminCsv);
  const cached=readJson(ADMIN_CACHE_KEY,null);
  if(cached&&cached.data)renderAdmin(cached.data,true);
  loadAdminStats(false);
}

async function loadAdminStats(force){
  setText('adminUpdatedAt',force?'更新中...':'読み込み中...');
  setText('adminStatus','管理データを取得中...');
  const result=await adminApi('adminStats',{});
  if(result.ok&&result.data){
    adminData=result.data;
    localStorage.setItem(ADMIN_CACHE_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:result.data}));
    renderAdmin(result.data,false);
    setText('adminStatus','接続OK：管理データを取得しました。');
    return;
  }
  const cached=readJson(ADMIN_CACHE_KEY,null);
  if(cached&&cached.data){
    adminData=cached.data;
    renderAdmin(cached.data,true);
    setText('adminStatus','API取得に失敗したため、キャッシュを表示しています。');
    return;
  }
  setText('adminStatus','取得できません：'+(result.reason||result.error||'API URLを確認してください。'));
  renderAdminEmpty();
}

function renderAdmin(data,cached){
  setText('adminTotalUsers',numberJP(data.totalUsers)+'人');
  setText('adminTotalActivities',numberJP(data.totalActivities)+'回');
  setText('adminTotalSteps',numberJP(data.totalSteps)+'歩');
  setText('adminUpdatedAt',(cached?'キャッシュ ':'更新 ')+formatDateTimeJP(data.generatedAt));
  renderBarChart('deptChart',data.deptRanking||[],'dept','totalSteps','歩');
  renderBarChart('monthlyChart',data.monthly||[],'month','totalSteps','歩');
  renderAdminRanking(data.ranking||[]);
}

function renderAdminEmpty(){
  setText('adminTotalUsers','-');
  setText('adminTotalActivities','-');
  setText('adminTotalSteps','-');
  setText('adminUpdatedAt','取得できません');
  setHtml('deptChart','<p class="empty-note">データを取得できません。</p>');
  setHtml('monthlyChart','<p class="empty-note">データを取得できません。</p>');
  setHtml('adminRankingList','<p class="empty-note">データを取得できません。</p>');
}

function renderBarChart(id,rows,labelKey,valueKey,suffix){
  const box=document.getElementById(id);if(!box)return;
  if(!rows.length){box.innerHTML='<p class="empty-note">まだデータがありません。</p>';return;}
  const max=Math.max(...rows.map(r=>Number(r[valueKey]||0)),1);
  box.innerHTML=rows.slice(0,12).map(row=>{
    const value=Number(row[valueKey]||0);
    const pct=Math.max(4,Math.round(value/max*100));
    const sub=row.activityCount!==undefined?' / '+numberJP(row.activityCount)+'回':'';
    return '<div class="bar-row"><div class="bar-head"><strong>'+escapeHtml(row[labelKey]||'未設定')+'</strong><span>'+numberJP(value)+suffix+sub+'</span></div><div class="bar-track"><div class="bar-fill" style="width:'+pct+'%"></div></div></div>';
  }).join('');
}

function renderAdminRanking(list){
  const box=document.getElementById('adminRankingList');if(!box)return;
  if(!list.length){box.innerHTML='<p class="empty-note">まだランキングはありません。</p>';return;}
  box.innerHTML=list.slice(0,30).map((m,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const name=m.nick||m.name||'ゲスト';
    return '<div class="rank-row"><span class="rank-medal">'+medal+'</span><div><strong>'+escapeHtml(name)+'</strong><small>'+escapeHtml(m.dept||'所属未設定')+' / '+numberJP(m.activityCount)+'回</small></div><em>'+numberJP(m.totalSteps)+'歩</em></div>';
  }).join('');
}

function downloadAdminCsv(){
  if(!adminData||!adminData.csvRows||!adminData.csvRows.length){
    alert('CSV出力できるデータがありません。');
    return;
  }
  const headers=['date','activityId','participantId','name','nick','dept','steps','challenge','comment','createdAt','savedAt'];
  const rows=[headers].concat(adminData.csvRows.map(r=>headers.map(h=>r[h]===undefined?'':r[h])));
  const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='rinchanmori_activities_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value){
  const text=String(value===null||value===undefined?'':value);
  return '"'+text.replace(/"/g,'""')+'"';
}

async function adminApi(action,payload){
  const url=apiUrl();
  if(!url)return {ok:false,reason:'api_url_empty'};
  try{
    const res=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action:action,appVersion:ADMIN_VERSION},payload||{}))});
    const json=await res.json();
    return json&&json.ok?json:{ok:false,reason:(json&&json.error)||'api_error'};
  }catch(e){return {ok:false,reason:e.message};}
}

function apiUrl(){return (typeof RINCHAN_CONFIG!=='undefined'&&RINCHAN_CONFIG.API_URL)?String(RINCHAN_CONFIG.API_URL).trim():''}
function readJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
function setHtml(id,value){const el=document.getElementById(id);if(el)el.innerHTML=value}
function numberJP(n){return Number(n||0).toLocaleString('ja-JP')}
function formatDateTimeJP(value){const d=value?new Date(value):new Date();if(isNaN(d.getTime()))return '未更新';return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function escapeHtml(str){return String(str||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
