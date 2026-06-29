const RINCHAN_V080='v0.8.0';
function v080ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v080Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v080DateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

document.addEventListener('DOMContentLoaded',()=>{renderV080Forest();});

function v080Stats(){
  const acts=v080ReadJson('rinchanActivities',[]);
  const thanks=v080ReadJson('rinchanThanks',{});
  const today=v080DateKey(new Date());
  const totalSteps=acts.reduce((s,a)=>s+Number(a.steps||0),0);
  const todayActs=acts.filter(a=>String(a.date||'').slice(0,10)===today);
  const todaySteps=todayActs.reduce((s,a)=>s+Number(a.steps||0),0);
  const participants=new Set(acts.map(a=>String(a.participantId||a.employeeId||a.userId||'me')));
  const thanksTotal=Object.values(thanks).reduce((s,n)=>s+Number(n||0),0);
  const level=Math.max(1,Math.floor(totalSteps/10000)+1);
  const current=totalSteps%10000;
  const remain=10000-current;
  return {acts,totalSteps,todayActs,todaySteps,participants:participants.size||1,thanksTotal,level,current,remain,pct:Math.round(current/10000*100)};
}
function renderV080Forest(){
  const box=document.getElementById('forestLevelCard');if(!box)return;
  const s=v080Stats();
  const leaves=Math.min(24,Math.max(4,Math.floor(s.todaySteps/1000)+s.todayActs.length));
  const butterflies=Math.min(12,Math.floor(s.thanksTotal/2));
  box.innerHTML='<p class="label">🌳 みんなで育てる杜</p><div class="forest-level-main"><div class="forest-symbol">🌳</div><div><h2>杜レベル '+s.level+'</h2><p>全員の歩数で、杜全体が育ちます。</p></div></div><div class="forest-meter"><div style="width:'+s.pct+'%"></div></div><p class="forest-note">あと '+v080Num(s.remain)+'歩でレベル '+(s.level+1)+'</p><div class="forest-mini"><span>🍀 葉っぱ '+leaves+'枚</span><span>🦋 蝶 '+butterflies+'匹</span><span>👟 累計 '+v080Num(s.totalSteps)+'歩</span></div>';
  const news=document.getElementById('forestNewsList');
  if(news){
    news.innerHTML='<div class="forest-news-row">🌱 今日 '+s.todayActs.length+'件の活動が記録されました</div><div class="forest-news-row">👟 今日の歩数は '+v080Num(s.todaySteps)+'歩です</div><div class="forest-news-row">🦋 ありがとうが合計 '+v080Num(s.thanksTotal)+'件届いています</div><div class="forest-news-row">🍀 杜に葉っぱが '+leaves+'枚増えました</div>';
  }
}
