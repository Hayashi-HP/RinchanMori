const RINCHAN_V070='v0.9.39';
function v070ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v070Activities(){return v070ReadJson('rinchanActivities',[]).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function v070Participant(){return v070ReadJson('rinchanParticipant',{})||{}}
function v070Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v070ShortDate(s){if(!s)return '-';const d=new Date(s);if(isNaN(d))return s;return (d.getMonth()+1)+'/'+d.getDate()}
function v070Esc(v){return String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

document.addEventListener('DOMContentLoaded',()=>{renderV070Mypage();});

function renderV070Mypage(){
  if(!document.getElementById('mypageV070'))return;
  const p=v070Participant();
  const list=v070Activities();
  const totalSteps=list.reduce((sum,a)=>sum+Number(a.steps||0),0);
  const count=list.length;
  const streak=calcStreakV070(list);
  setTextV070('v070EmployeeId',p.employeeId||p.id||'-');
  setTextV070('v070ProfileName',p.name||'ゲスト');
  setTextV070('v070ProfileDept',p.dept||'未設定');
  setTextV070('v070ProfileNick',p.nick||'-');
  setTextV070('v070TotalSteps',v070Num(totalSteps)+'歩');
  setTextV070('v070ActivityCount',count+'回');
  setTextV070('v070Streak',streak.current+'日');
  setTextV070('v070BestStreak',streak.best+'日');
  setTextV070('v070TreeAge',treeAgeV070(p.createdAt)+'日');
  renderHistoryV070(buildRecentActivityV139(list).slice(0,10));
  renderWeeklyGoalV070(list);
}
function setTextV070(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
function treeAgeV070(createdAt){if(!createdAt)return 1;const d=new Date(createdAt);if(isNaN(d))return 1;return Math.max(1,Math.floor((Date.now()-d.getTime())/86400000)+1)}
function dateKeyV070(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function calcStreakV070(list){const days=Array.from(new Set(list.map(a=>String(a.date||'').slice(0,10)).filter(Boolean))).sort();let best=0,run=0,last=null;days.forEach(day=>{const t=new Date(day+'T00:00:00').getTime();if(last!==null&&t-last===86400000){run+=1}else{run=1}best=Math.max(best,run);last=t});let current=0;let cursor=new Date();const set=new Set(days);for(let i=0;i<365;i++){const key=dateKeyV070(cursor);if(set.has(key)){current+=1;cursor.setDate(cursor.getDate()-1)}else{break}}return {current,best}}
function buildRecentActivityV139(steps){const stepItems=(steps||[]).map(a=>({kind:'steps',date:a.date||a.createdAt||'',createdAt:a.createdAt||a.date||'',steps:Number(a.steps||0)}));const sent=(v070ReadJson('rinchanSentThanks',[])||[]).map(t=>({kind:'thanks',date:t.createdAt||'',createdAt:t.createdAt||'',toName:t.toName||t.toDept||'どなたか',reason:t.reason||'ありがとう'}));return stepItems.concat(sent).sort((a,b)=>String(b.createdAt||b.date||'').localeCompare(String(a.createdAt||a.date||'')))}
function renderHistoryV070(list){const box=document.getElementById('v070History');if(!box)return;if(!list.length){box.innerHTML='<p class="empty-note">まだ記録がありません。</p>';return;}box.innerHTML=list.map(a=>{if(a.kind==='thanks')return '<div class="history-row thanks-history-row"><strong>'+v070ShortDate(a.date)+'</strong><span>❤️ '+v070Esc(a.toName)+'さんへ</span><small>'+v070Esc(a.reason)+'</small></div>';return '<div class="history-row"><strong>'+v070ShortDate(a.date)+'</strong><span>👟 '+v070Num(a.steps)+'歩</span></div>'}).join('')}
function renderWeeklyGoalV070(list){const box=document.getElementById('v070WeeklyGoal');if(!box)return;const now=new Date();const start=new Date(now);start.setDate(now.getDate()-now.getDay());start.setHours(0,0,0,0);const weekly=list.filter(a=>{const d=new Date(String(a.date||'')+'T00:00:00');return !isNaN(d)&&d>=start}).length;const pct=Math.min(100,Math.round((weekly/3)*100));box.innerHTML='<div class="goal-progress"><div style="width:'+pct+'%"></div></div><p>今週 '+weekly+' / 3回記録　達成率 '+pct+'%</p>'}
