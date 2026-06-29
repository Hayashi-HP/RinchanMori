const RINCHAN_V071='v0.7.1';
function v071ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v071Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v071Level(count,steps){if(count>=100||steps>=500000)return 7;if(count>=60||steps>=300000)return 6;if(count>=40||steps>=200000)return 5;if(count>=25||steps>=100000)return 4;if(count>=10||steps>=50000)return 3;if(count>=3||steps>=10000)return 2;return 1}
function v071Tree(level){return ['','🌱','🌿','🌳','🌸🌳','🌳🐦','🌳🦋','🌳🐿️'][level]||'🌱'}
function v071Mask(name){if(!name)return 'ゲスト';if(name.length<=2)return name;return name.slice(0,1)+'＊'+name.slice(-1)}

document.addEventListener('DOMContentLoaded',()=>{renderV071Map();});

function renderV071Map(){
  const map=document.getElementById('moriMap');if(!map)return;
  const users=v071ReadJson('rinchanMoriMembers',null)||buildLocalMembersV071();
  map.innerHTML='<span class="map-bg sun">☀️</span><span class="map-bg cloud-a">☁️</span><span class="map-bg cloud-b">☁️</span><span class="map-bg bench">🪑</span><span class="map-bg flower">🌻</span>';
  users.forEach((u,i)=>{
    const level=v071Level(u.activityCount,u.totalSteps);
    const btn=document.createElement('button');
    btn.className='mori-tree-node level-'+level+(i<3?' top-tree':'');
    btn.style.left=u.x+'%';btn.style.top=u.y+'%';
    btn.innerHTML='<span>'+v071Tree(level)+'</span><small>'+v071Mask(u.name||u.nick)+'</small>';
    btn.onclick=()=>openTreeCardV071(u,level);
    map.appendChild(btn);
  });
}
function buildLocalMembersV071(){
  const p=v071ReadJson('rinchanParticipant',{})||{};
  const acts=v071ReadJson('rinchanActivities',[]);
  const total=acts.reduce((s,a)=>s+Number(a.steps||0),0);
  const me={name:p.name||p.nick||'あなた',nick:p.nick||'',dept:p.dept||'未設定',activityCount:acts.length,totalSteps:total,x:48,y:46};
  const samples=[
    {name:'看護部の木',dept:'看護部',activityCount:18,totalSteps:82000,x:22,y:35},
    {name:'リハ部の木',dept:'リハビリテーション部',activityCount:32,totalSteps:142000,x:70,y:34},
    {name:'事務部の木',dept:'事務部',activityCount:8,totalSteps:36000,x:36,y:68},
    {name:'介護部の木',dept:'介護部',activityCount:14,totalSteps:62000,x:78,y:65}
  ];
  return [me].concat(samples);
}
function openTreeCardV071(u,level){
  const card=document.getElementById('treeInfoCard');if(!card)return;
  card.classList.remove('hidden');
  card.innerHTML='<button class="tree-card-close" onclick="closeTreeCardV071()">×</button><p class="label">杜の木</p><div class="tree-card-icon">'+v071Tree(level)+'</div><h2>'+v071Mask(u.name||u.nick)+'</h2><p>'+((u.dept||'所属未設定'))+'</p><div class="mini-stats"><div><strong>Lv.'+level+'</strong><small>木レベル</small></div><div><strong>'+v071Num(u.totalSteps)+'</strong><small>歩</small></div><div><strong>'+v071Num(u.activityCount)+'</strong><small>記録</small></div></div>';
  card.scrollIntoView({behavior:'smooth',block:'center'});
}
function closeTreeCardV071(){const card=document.getElementById('treeInfoCard');if(card)card.classList.add('hidden')}
