const RINCHAN_V071='v0.7.2';
function v071ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v071Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v071Level(count,steps){if(count>=100||steps>=500000)return 7;if(count>=60||steps>=300000)return 6;if(count>=40||steps>=200000)return 5;if(count>=25||steps>=100000)return 4;if(count>=10||steps>=50000)return 3;if(count>=3||steps>=10000)return 2;return 1}
function v071Tree(level){return ['','🌱','🌿','🌳','🌸🌳','🌳🐦','🌳🦋','🌳🐿️'][level]||'🌱'}
function v071Mask(name){if(!name)return 'ゲスト';if(name.length<=2)return name;return name.slice(0,1)+'＊'+name.slice(-1)}
function v071Area(dept){const d=String(dept||'');if(d.includes('看護'))return {x:22,y:34,label:'看護部エリア'};if(d.includes('リハ'))return {x:70,y:34,label:'リハビリエリア'};if(d.includes('介護'))return {x:76,y:66,label:'介護部エリア'};if(d.includes('事務'))return {x:34,y:68,label:'事務部エリア'};return {x:50,y:52,label:'中央エリア'}}

document.addEventListener('DOMContentLoaded',()=>{renderV071Map();});

function renderV071Map(){
  const map=document.getElementById('moriMap');if(!map)return;
  const users=(v071ReadJson('rinchanMoriMembers',null)||buildLocalMembersV071()).sort((a,b)=>Number(b.totalSteps||0)-Number(a.totalSteps||0));
  map.innerHTML='<span class="map-bg sun">☀️</span><span class="map-bg cloud-a">☁️</span><span class="map-bg cloud-b">☁️</span><span class="map-bg bench">🪑</span><span class="map-bg flower">🌻</span><div class="dept-area area-nurse">看護部</div><div class="dept-area area-reha">リハビリ</div><div class="dept-area area-care">介護部</div><div class="dept-area area-office">事務部</div>';
  const offset={};
  users.forEach((u,i)=>{
    const level=v071Level(u.activityCount,u.totalSteps);
    const area=v071Area(u.dept);
    const key=area.label;offset[key]=(offset[key]||0)+1;
    const n=offset[key];
    const x=(u.x||area.x)+((n%3)-1)*7;
    const y=(u.y||area.y)+Math.floor((n-1)/3)*8;
    const btn=document.createElement('button');
    btn.className='mori-tree-node level-'+level+(i<3?' top-tree rank-'+(i+1):'');
    btn.style.left=Math.max(8,Math.min(88,x))+'%';btn.style.top=Math.max(18,Math.min(78,y))+'%';
    btn.innerHTML='<span>'+v071Tree(level)+'</span><small>'+(i<3?'🏆 ':'')+v071Mask(u.name||u.nick)+'</small>';
    btn.onclick=()=>openTreeCardV071(u,level,i+1,area.label);
    map.appendChild(btn);
  });
}
function buildLocalMembersV071(){
  const p=v071ReadJson('rinchanParticipant',{})||{};
  const acts=v071ReadJson('rinchanActivities',[]);
  const total=acts.reduce((s,a)=>s+Number(a.steps||0),0);
  const me={name:p.name||p.nick||'あなた',nick:p.nick||'',dept:p.dept||'未設定',activityCount:acts.length,totalSteps:total};
  const samples=[
    {name:'看護部の木',dept:'看護部',activityCount:18,totalSteps:82000},
    {name:'リハ部の木',dept:'リハビリテーション部',activityCount:32,totalSteps:142000},
    {name:'事務部の木',dept:'事務部',activityCount:8,totalSteps:36000},
    {name:'介護部の木',dept:'介護部',activityCount:14,totalSteps:62000},
    {name:'医局の木',dept:'医局',activityCount:7,totalSteps:28000},
    {name:'栄養科の木',dept:'栄養科',activityCount:11,totalSteps:47000}
  ];
  return [me].concat(samples);
}
function openTreeCardV071(u,level,rank,area){
  const card=document.getElementById('treeInfoCard');if(!card)return;
  card.classList.remove('hidden');
  const rankText=rank&&rank<=3?' / 🏆 ランキング '+rank+'位':'';
  card.innerHTML='<button class="tree-card-close" onclick="closeTreeCardV071()">×</button><p class="label">杜の木'+rankText+'</p><div class="tree-card-icon">'+v071Tree(level)+'</div><h2>'+v071Mask(u.name||u.nick)+'</h2><p>'+((u.dept||'所属未設定'))+'・'+area+'</p><div class="mini-stats"><div><strong>Lv.'+level+'</strong><small>木レベル</small></div><div><strong>'+v071Num(u.totalSteps)+'</strong><small>歩</small></div><div><strong>'+v071Num(u.activityCount)+'</strong><small>記録</small></div></div>';
  card.scrollIntoView({behavior:'smooth',block:'center'});
}
function closeTreeCardV071(){const card=document.getElementById('treeInfoCard');if(card)card.classList.add('hidden')}
