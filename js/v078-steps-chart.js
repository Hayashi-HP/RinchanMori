const RINCHAN_V078='v0.7.8';
function v078ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v078Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v078DateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function v078Short(d){return (d.getMonth()+1)+'/'+d.getDate()}

document.addEventListener('DOMContentLoaded',()=>{renderV078Chart();});

function renderV078Chart(){
  const box=document.getElementById('weeklyStepsChart');if(!box)return;
  const acts=v078ReadJson('rinchanActivities',[]);
  const today=new Date();today.setHours(0,0,0,0);
  const start=new Date(today);start.setDate(today.getDate()-6);
  const days=[];
  for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d)}
  const totals={};
  acts.forEach(a=>{const key=String(a.date||'').slice(0,10);totals[key]=(totals[key]||0)+Number(a.steps||0)});
  const values=days.map(d=>totals[v078DateKey(d)]||0);
  const sum=values.reduce((a,b)=>a+b,0);
  const avg=Math.round(sum/7);
  const max=Math.max(10000,...values);
  const labels=['日','月','火','水','木','金','土'];
  const range=v078Short(days[0])+'〜'+v078Short(days[6]);
  const best=Math.max(...values);
  const bestIndex=values.indexOf(best);
  const trend=best>0?'一番歩けた日は '+labels[days[bestIndex].getDay()]+'曜日、'+v078Num(best)+'歩です。':'まだ今週の記録がありません。';
  box.innerHTML='<div class="steps-summary"><p class="label">今週の歩数</p><strong>'+v078Num(avg)+'</strong><span>歩 / 日</span><small>'+range+'</small></div><div class="steps-bars">'+values.map((v,i)=>'<div class="steps-bar-col"><div class="steps-bar-track"><div class="steps-bar-fill" style="height:'+Math.max(4,Math.round(v/max*100))+'%"></div></div><small>'+labels[days[i].getDay()]+'</small></div>').join('')+'</div><p class="steps-trend">🔥 '+trend+'</p>';
}
