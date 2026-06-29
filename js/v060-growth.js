const RINCHAN_V060='v0.6.0';
const RINCHAN_BADGE_KEY='rinchanBadges';

function v060ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v060Activities(){return v060ReadJson('rinchanActivities',[])}
function v060Participant(){return v060ReadJson('rinchanParticipant',null)}
function v060Number(n){return Number(n||0).toLocaleString('ja-JP')}

document.addEventListener('DOMContentLoaded',()=>{renderV060Growth();renderV060Badges();});

function getSeasonV060(){
  const m=new Date().getMonth()+1;
  if(m>=3&&m<=5)return {key:'spring',label:'春の杜',icon:'🌸',message:'春の風が、あなたの木をやさしく育てています。'};
  if(m>=6&&m<=8)return {key:'summer',label:'夏の杜',icon:'🌿',message:'夏の光を浴びて、木がぐんぐん伸びています。'};
  if(m>=9&&m<=11)return {key:'autumn',label:'秋の杜',icon:'🍁',message:'秋の杜に、継続の実りが増えています。'};
  return {key:'winter',label:'冬の杜',icon:'❄️',message:'冬の静かな杜で、習慣の根が育っています。'};
}

function getGrowthV060(count,totalSteps){
  if(count>=100||totalSteps>=500000)return {level:7,icon:'🌳🌸🐿️',title:'杜を支える大樹',text:'あなたの継続が、りんちゃんの杜を支えています。',pct:100,next:'すばらしい継続です。'};
  if(count>=60||totalSteps>=300000)return {level:6,icon:'🌳🦋',title:'蝶が集まる木',text:'あなたの木に、やさしい仲間が集まってきました。',pct:86,next:'次は大樹を目指しましょう。'};
  if(count>=40||totalSteps>=200000)return {level:5,icon:'🌳🐦',title:'鳥が来る木',text:'習慣がしっかり根づき、杜に鳥が遊びに来ました。',pct:72,next:'次は蝶が来る木へ。'};
  if(count>=25||totalSteps>=100000)return {level:4,icon:'🌸🌳',title:'花が咲く木',text:'続ける力が花になって咲きました。',pct:58,next:'次は鳥が来る木へ。'};
  if(count>=10||totalSteps>=50000)return {level:3,icon:'🌳',title:'木が大きくなりました',text:'健康の習慣が、しっかり育っています。',pct:42,next:'次は花が咲く木へ。'};
  if(count>=3||totalSteps>=10000)return {level:2,icon:'🌿',title:'若葉が育っています',text:'小さな一歩が、若葉になりました。',pct:25,next:'次は大きな木へ。'};
  return {level:1,icon:'🌱',title:'小さな芽が出ました',text:'活動を記録すると、あなたの木が少しずつ育ちます。',pct:12,next:'まずは3回記録してみましょう。'};
}

function calcStatsV060(){
  const list=v060Activities();
  const totalSteps=list.reduce((s,a)=>s+Number(a.steps||0),0);
  return {count:list.length,totalSteps};
}

function renderV060Growth(){
  const icon=document.getElementById('treeIcon');
  const title=document.getElementById('treeTitle');
  const text=document.getElementById('treeText');
  const bar=document.getElementById('growthBar');
  const note=document.getElementById('growthNote');
  if(!icon&&!title&&!text&&!bar&&!note)return;
  const stats=calcStatsV060();
  const season=getSeasonV060();
  const growth=getGrowthV060(stats.count,stats.totalSteps);
  if(icon)icon.textContent=growth.icon;
  if(title)title.textContent='Lv.'+growth.level+' '+growth.title;
  if(text)text.textContent=growth.text+' '+season.message;
  if(bar)bar.style.width=growth.pct+'%';
  if(note)note.textContent=season.icon+' '+season.label+' / '+growth.next+'（累計 '+v060Number(stats.totalSteps)+'歩）';
}

function badgesV060(){
  const stats=calcStatsV060();
  const year=new Date().getFullYear();
  const badges=[];
  badges.push({id:'year-'+year,icon:'🏅',name:String(year).slice(2)+'年度参加',on:true});
  badges.push({id:'first-log',icon:'🌱',name:'初回記録',on:stats.count>=1});
  badges.push({id:'three-logs',icon:'🌿',name:'3回記録',on:stats.count>=3});
  badges.push({id:'ten-logs',icon:'🌳',name:'10回記録',on:stats.count>=10});
  badges.push({id:'steps-10000',icon:'👟',name:'累計1万歩',on:stats.totalSteps>=10000});
  badges.push({id:'steps-50000',icon:'✨',name:'累計5万歩',on:stats.totalSteps>=50000});
  badges.push({id:'steps-100000',icon:'🌸',name:'累計10万歩',on:stats.totalSteps>=100000});
  return badges;
}

function renderV060Badges(){
  const box=document.getElementById('badgeList');
  if(!box)return;
  const badges=badgesV060();
  box.innerHTML=badges.map(b=>'<div class="badge-item '+(b.on?'earned':'locked')+'"><span>'+b.icon+'</span><strong>'+b.name+'</strong><small>'+(b.on?'獲得':'未獲得')+'</small></div>').join('');
}
