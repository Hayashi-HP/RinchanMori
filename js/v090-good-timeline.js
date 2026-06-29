const RINCHAN_V090='v0.9.0';
function v090ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v090SaveJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function v090Mask(name){if(!name)return 'だれか';if(name.length<=2)return name;return name.slice(0,1)+'＊'+name.slice(-1)}
function v090TimeText(iso){const d=new Date(iso);if(isNaN(d))return '';const now=new Date();const diff=Math.floor((now-d)/60000);if(diff<1)return 'たった今';if(diff<60)return diff+'分前';if(diff<1440)return Math.floor(diff/60)+'時間前';return (d.getMonth()+1)+'/'+d.getDate();}

document.addEventListener('DOMContentLoaded',()=>{renderV090Timeline();});

function addGoodEventV090(event){
  const list=v090ReadJson('rinchanGoodTimeline',[]);
  list.unshift(Object.assign({id:'E'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),createdAt:new Date().toISOString()},event||{}));
  v090SaveJson('rinchanGoodTimeline',list.slice(0,50));
}
function buildDefaultTimelineV090(){
  const acts=v090ReadJson('rinchanActivities',[]);
  const thanks=v090ReadJson('rinchanThanks',{});
  const items=[];
  if(acts.length){items.push({icon:'🌱',title:'今日も活動が記録されました',body:'みんなの一歩で、杜に新しい葉っぱが増えています。',createdAt:new Date().toISOString()});}
  const thanksTotal=Object.values(thanks).reduce((s,n)=>s+Number(n||0),0);
  if(thanksTotal>0){items.push({icon:'❤️',title:'ありがとうが届いています',body:'応援の気持ちで、杜に蝶が飛びはじめました。',createdAt:new Date().toISOString()});}
  items.push({icon:'🌳',title:'りんちゃんの杜が育っています',body:'個人の競争ではなく、みんなで健康の杜を育てます。',createdAt:new Date().toISOString()});
  return items;
}
function renderV090Timeline(){
  const box=document.getElementById('goodTimelineList');if(!box)return;
  let list=v090ReadJson('rinchanGoodTimeline',[]);
  if(!list.length)list=buildDefaultTimelineV090();
  box.innerHTML=list.slice(0,5).map(item=>'<div class="good-event"><div class="good-event-icon">'+(item.icon||'🌿')+'</div><div><h3>'+escapeV090(item.title||'杜のできごと')+'</h3><p>'+escapeV090(item.body||'今日も杜が少し育ちました。')+'</p><small>'+v090TimeText(item.createdAt)+'</small></div></div>').join('');
}
function escapeV090(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
