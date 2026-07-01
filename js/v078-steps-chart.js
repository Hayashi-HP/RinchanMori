const RINCHAN_V078='v0.9.41';
function v078ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v078Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v078DateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function v078Short(d){return (d.getMonth()+1)+'/'+d.getDate()}
function v078WeekStartMonday(base){const d=new Date(base);d.setHours(0,0,0,0);const day=d.getDay();const diff=(day+6)%7;d.setDate(d.getDate()-diff);return d}
function v078Participant(){return v078ReadJson('rinchanParticipant',{})||{}}
function v078BarHeight(value,max){if(!value||!max)return 0;return Math.max(12,Math.min(100,Math.round(value/max*100)))}

document.addEventListener('DOMContentLoaded',()=>{renderV078Chart();setTimeout(renderV078Chart,1200);});

function renderV078Chart(){
  const box=document.getElementById('weeklyStepsChart');if(!box)return;
  const acts=v078ReadJson('rinchanActivities',[]);
  const p=v078Participant();
  const today=new Date();today.setHours(0,0,0,0);
  const start=v078WeekStartMonday(today);
  const lastStart=new Date(start);lastStart.setDate(start.getDate()-7);
  const days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d)}
  const lastDays=[];for(let i=0;i<7;i++){const d=new Date(lastStart);d.setDate(lastStart.getDate()+i);lastDays.push(d)}
  const totals={};acts.forEach(a=>{const key=String(a.date||'').slice(0,10);totals[key]=(totals[key]||0)+Number(a.steps||0)});
  const values=days.map(d=>totals[v078DateKey(d)]||0);
  const lastValues=lastDays.map(d=>totals[v078DateKey(d)]||0);
  const weekTotal=values.reduce((a,b)=>a+b,0);
  const lastTotal=lastValues.reduce((a,b)=>a+b,0);
  const diff=weekTotal-lastTotal;
  const best=Math.max(...values);
  const max=best>0?best*1.1:1000;
  const labels=['日','月','火','水','木','金','土'];
  const range=v078Short(days[0])+'〜'+v078Short(days[6]);
  const goal=Number(String(p.weeklyStepGoal||'').replace(/,/g,''));
  const hasGoal=goal>0;
  const remain=hasGoal?Math.max(0,goal-weekTotal):0;
  const goalHtml=hasGoal?'<p class="steps-goal">目標 '+v078Num(goal)+'歩まで '+(remain>0?'あと '+v078Num(remain)+'歩':'達成しました')+'</p>':'';
  const diffHtml=lastTotal>0?'<p class="steps-trend">📊 '+(diff>=0?'先週より +'+v078Num(diff)+'歩':'先週より '+v078Num(diff)+'歩')+'</p>':'';
  box.innerHTML='<div class="steps-summary"><p class="label">今週の歩数</p><strong>'+v078Num(weekTotal)+'</strong><span>歩</span><small>'+range+' / 月〜日</small>'+goalHtml+'</div><div class="steps-bars">'+values.map((v,i)=>'<div class="steps-bar-col"><div class="steps-bar-track"><div class="steps-bar-fill" style="height:'+v078BarHeight(v,max)+'%"></div></div><small>'+labels[days[i].getDay()]+'</small></div>').join('')+'</div>'+diffHtml;
}
