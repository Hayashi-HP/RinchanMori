const RINCHAN_V071='v0.9.7';
function v071ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v071SaveJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function v071Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v071Today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function v071Level(count,steps){if(count>=100||steps>=500000)return 7;if(count>=60||steps>=300000)return 6;if(count>=40||steps>=200000)return 5;if(count>=25||steps>=100000)return 4;if(count>=10||steps>=50000)return 3;if(count>=3||steps>=10000)return 2;return 1}
function v071Tree(level){return ['','🌱','🌿','🌳','🌸🌳','🌳🐦','🌳🦋','🌳🐿️'][level]||'🌱'}
function v071Mask(name){if(!name)return 'ゲスト';if(name.length<=2)return name;return name.slice(0,1)+'＊'+name.slice(-1)}
function v071Area(dept){const d=String(dept||'');if(d.includes('看護'))return {x:22,y:34,label:'看護部エリア'};if(d.includes('リハ'))return {x:70,y:34,label:'リハビリエリア'};if(d.includes('介護'))return {x:76,y:66,label:'介護部エリア'};if(d.includes('事務'))return {x:34,y:68,label:'事務部エリア'};return {x:50,y:52,label:'中央エリア'}}
function v097Season(){const m=new Date().getMonth()+1;if(m>=3&&m<=5)return {key:'spring',name:'春',icon:'🌸',items:['🌸','🌷','🦋'],msg:'春の杜に、やさしい花が咲いています。'};if(m>=6&&m<=8)return {key:'summer',name:'夏',icon:'🌿',items:['🌻','🌿','🎐'],msg:'夏の杜が、青々と育っています。'};if(m>=9&&m<=11)return {key:'autumn',name:'秋',icon:'🍁',items:['🍁','🍄','🌰'],msg:'秋の杜に、実りの気配が広がっています。'};return {key:'winter',name:'冬',icon:'❄️',items:['❄️','✨','☃️'],msg:'冬の杜に、静かな光が灯っています。'}}
function v097Time(){const h=new Date().getHours();if(h<6)return {key:'night',name:'夜',sky:'🌙',msg:'夜の杜は静かに休んでいます。'};if(h<11)return {key:'morning',name:'朝',sky:'☀️',msg:'朝の光が杜に差し込んでいます。'};if(h<17)return {key:'day',name:'昼',sky:'🌤️',msg:'昼の杜に、明るい風が通っています。'};if(h<20)return {key:'evening',name:'夕方',sky:'🌇',msg:'夕方の杜が、少しあたたかい色になりました。'};return {key:'night',name:'夜',sky:'🌙',msg:'夜の杜は静かに休んでいます。'}}

document.addEventListener('DOMContentLoaded',()=>{renderV071Map();});

function renderV071Map(){
  const map=document.getElementById('moriMap');if(!map)return;
  const season=v097Season();const time=v097Time();
  document.body.classList.add('mori-season-'+season.key,'mori-time-'+time.key);
  const note=document.getElementById('moriUpdatedAt');if(note)note.textContent=season.icon+' '+season.name+'の杜・'+time.name;
  const msg=document.getElementById('moriSeasonMessage');if(msg)msg.textContent=season.msg;
  const ht=document.getElementById('moriHighlightTitle');if(ht)ht.textContent=season.icon+' '+season.name+'の見どころ';
  const hx=document.getElementById('moriHighlightText');if(hx)hx.textContent=time.msg+' 今日も無理せず、いこうね。';
  const users=(v071ReadJson('rinchanMoriMembers',null)||buildLocalMembersV071()).sort((a,b)=>Number(b.totalSteps||0)-Number(a.totalSteps||0));
  map.innerHTML='<span class="map-bg sun">'+time.sky+'</span><span class="map-bg cloud-a">☁️</span><span class="map-bg cloud-b">☁️</span><span class="map-bg bench">🪑</span><span class="map-bg flower">'+season.items[0]+'</span><span class="map-bg seasonal-a">'+season.items[1]+'</span><span class="map-bg seasonal-b">'+season.items[2]+'</span><span class="rinchan-walker" id="rinchanWalker">😊</span><div class="dept-area area-nurse">看護部</div><div class="dept-area area-reha">リハビリ</div><div class="dept-area area-care">介護部</div><div class="dept-area area-office">事務部</div>';
  const offset={};
  users.forEach((u,i)=>{
    const level=v071Level(u.activityCount,u.totalSteps);
    const area=v071Area(u.dept);
    const key=area.label;offset[key]=(offset[key]||0)+1;
    const n=offset[key];
    const x=(u.x||area.x)+((n%3)-1)*7;
    const y=(u.y||area.y)+Math.floor((n-1)/3)*8;
    u._x=Math.max(8,Math.min(88,x));u._y=Math.max(18,Math.min(78,y));
    const btn=document.createElement('button');
    btn.className='mori-tree-node level-'+level+(i<3?' top-tree rank-'+(i+1):'');
    btn.style.left=u._x+'%';btn.style.top=u._y+'%';
    btn.innerHTML='<span>'+v071Tree(level)+'</span><small>'+(i<3?'🏆 ':'')+v071Mask(u.name||u.nick)+'</small>';
    btn.onclick=()=>openTreeCardV071(u,level,i+1,area.label);
    map.appendChild(btn);
  });
}
function buildLocalMembersV071(){
  const p=v071ReadJson('rinchanParticipant',{})||{};
  const acts=v071ReadJson('rinchanActivities',[]);
  const total=acts.reduce((s,a)=>s+Number(a.steps||0),0);
  const me={id:p.id||p.employeeId||'me',name:p.name||p.nick||'あなた',nick:p.nick||'',dept:p.dept||'未設定',activityCount:acts.length,totalSteps:total};
  const samples=[
    {id:'sample-nurse',name:'看護部の木',dept:'看護部',activityCount:18,totalSteps:82000},
    {id:'sample-reha',name:'リハ部の木',dept:'リハビリテーション部',activityCount:32,totalSteps:142000},
    {id:'sample-office',name:'事務部の木',dept:'事務部',activityCount:8,totalSteps:36000},
    {id:'sample-care',name:'介護部の木',dept:'介護部',activityCount:14,totalSteps:62000},
    {id:'sample-doctor',name:'医局の木',dept:'医局',activityCount:7,totalSteps:28000},
    {id:'sample-nutrition',name:'栄養科の木',dept:'栄養科',activityCount:11,totalSteps:47000}
  ];
  return [me].concat(samples);
}
function openTreeCardV071(u,level,rank,area){
  window.rinchanSelectedTree=u;
  const card=document.getElementById('treeInfoCard');if(!card)return;
  card.classList.remove('hidden');
  const id=String(u.id||u.name).replace(/'/g,'');
  const rankText=rank&&rank<=3?' / 🏆 ランキング '+rank+'位':'';
  const thanksCount=getThanksCountV073(id);
  const already=hasThanksTodayV077(id);
  const buttonLabel=already?'今日は送信済み':'❤️ ありがとうを届ける';
  const buttonDisabled=already?' disabled':'';
  card.innerHTML='<button class="tree-card-close" onclick="closeTreeCardV071()">×</button><p class="label">杜の木'+rankText+'</p><div class="tree-card-icon">'+v071Tree(level)+'</div><h2>'+v071Mask(u.name||u.nick)+'</h2><p>'+((u.dept||'所属未設定'))+'・'+area+'</p><div class="mini-stats"><div><strong>Lv.'+level+'</strong><small>木レベル</small></div><div><strong>'+v071Num(u.totalSteps)+'</strong><small>歩</small></div><div><strong>'+v071Num(u.activityCount)+'</strong><small>記録</small></div></div><button class="submit pill-button thanks-button" id="thanksButton" onclick="openThanksSheetV096(\''+id+'\')"'+buttonDisabled+'>'+buttonLabel+'</button><p class="thanks-count">受け取ったありがとう：<strong id="thanksCount">'+thanksCount+'</strong>件</p><p class="thanks-limit-note">同じ木には1日1回まで届けられます。</p>';
  window.rinchanThanksReason='';
  card.scrollIntoView({behavior:'smooth',block:'center'});
}
function closeTreeCardV071(){const card=document.getElementById('treeInfoCard');if(card)card.classList.add('hidden')}
function getThanksCountV073(id){const data=v071ReadJson('rinchanThanks',{});return Number(data[id]||0)}
function hasThanksTodayV077(id){const log=v071ReadJson('rinchanThanksDaily',{});return log[id]===v071Today()}
function openThanksSheetV096(id){if(hasThanksTodayV077(id)){alert('この木へのありがとうは今日は送信済みです。');return;}window.rinchanPendingThanksId=id;window.rinchanThanksReason='';const old=document.getElementById('thanksSheetLayer');if(old)old.remove();const layer=document.createElement('div');layer.id='thanksSheetLayer';layer.className='thanks-sheet-layer';layer.innerHTML='<div class="thanks-sheet"><button class="tree-card-close" onclick="closeThanksSheetV096()">×</button><div class="thanks-sheet-heart">❤️</div><h2>ありがとうを届けますか？</h2><p>理由があれば選んでください😊<br><small>選ばなくても届けられます。</small></p><div class="thanks-reason-options sheet-options"><button type="button" onclick="selectThanksReasonV095(this,\'元気をもらった\')">😊 元気をもらった</button><button type="button" onclick="selectThanksReasonV095(this,\'助けてもらった\')">🤝 助けてもらった</button><button type="button" onclick="selectThanksReasonV095(this,\'頑張っていた\')">🌸 頑張っていた</button></div><button class="submit pill-button thanks-button" onclick="confirmThanksV096()">❤️ ありがとうを届ける</button></div>';document.body.appendChild(layer)}
function closeThanksSheetV096(){const layer=document.getElementById('thanksSheetLayer');if(layer)layer.remove()}
function selectThanksReasonV095(btn,reason){window.rinchanThanksReason=reason;document.querySelectorAll('.thanks-reason-options button').forEach(b=>b.classList.remove('selected'));if(btn)btn.classList.add('selected')}
function confirmThanksV096(){const id=window.rinchanPendingThanksId;if(!id)return;sendThanksV073(id);closeThanksSheetV096();showThanksDeliveredV096()}
function showThanksDeliveredV096(){const msg=document.createElement('div');msg.className='thanks-delivered-toast';msg.innerHTML='<span>🦋</span><strong>ありがとうが届きました♪</strong>';document.body.appendChild(msg);setTimeout(()=>msg.remove(),1800)}
function sendThanksV073(id){if(hasThanksTodayV077(id)){alert('この木へのありがとうは今日は送信済みです。');return;}const data=v071ReadJson('rinchanThanks',{});data[id]=Number(data[id]||0)+1;v071SaveJson('rinchanThanks',data);const daily=v071ReadJson('rinchanThanksDaily',{});daily[id]=v071Today();v071SaveJson('rinchanThanksDaily',daily);const reasons=v071ReadJson('rinchanThanksReasons',{});const reason=window.rinchanThanksReason||'ありがとう';reasons[reason]=Number(reasons[reason]||0)+1;v071SaveJson('rinchanThanksReasons',reasons);const el=document.getElementById('thanksCount');if(el)el.textContent=data[id];const btn=document.getElementById('thanksButton');if(btn){btn.textContent='今日は送信済み';btn.disabled=true;}addThanksTimelineV090(window.rinchanSelectedTree,reason);runRinchanDeliveryV074(window.rinchanSelectedTree);runThanksHeartV073();}
function addThanksTimelineV090(tree,reason){const list=v071ReadJson('rinchanGoodTimeline',[]);const target=tree?(tree.dept||'杜の木'):'杜の木';const suffix=reason&&reason!=='ありがとう'?'「'+reason+'」のありがとうです。':'応援の気持ちが届きました。';list.unshift({id:'T'+Date.now().toString(36),icon:'❤️',title:'ありがとうが届きました',body:target+'の木に、'+suffix,createdAt:new Date().toISOString()});v071SaveJson('rinchanGoodTimeline',list.slice(0,50));}
function runRinchanDeliveryV074(tree){const map=document.getElementById('moriMap');const r=document.getElementById('rinchanWalker');if(!map||!r||!tree)return;r.classList.add('walking');r.style.left='8%';r.style.top='82%';setTimeout(()=>{r.style.left=(tree._x||50)+'%';r.style.top=(tree._y||50)+'%';},80);setTimeout(()=>{const h=document.createElement('span');h.className='delivered-heart';h.textContent='❤️';h.style.left=(tree._x||50)+'%';h.style.top=(tree._y||50)+'%';map.appendChild(h);setTimeout(()=>h.remove(),1500);},1100);setTimeout(()=>r.classList.remove('walking'),1600)}
function runThanksHeartV073(){const layer=document.createElement('div');layer.className='thanks-heart-layer';['❤️','💚','💛','❤️','✨'].forEach((h,i)=>{const s=document.createElement('span');s.textContent=h;s.style.left=(20+i*14)+'%';s.style.animationDelay=(i*.08)+'s';layer.appendChild(s)});document.body.appendChild(layer);setTimeout(()=>layer.remove(),1800)}
