document.addEventListener('DOMContentLoaded',()=>{home();register();activity();dateDefault();mypage();initHomeExperience();});
function participant(){const r=localStorage.getItem('rinchanParticipant');return r?JSON.parse(r):null}
function saveParticipant(p){localStorage.setItem('rinchanParticipant',JSON.stringify(p))}
function activities(){const r=localStorage.getItem('rinchanActivities');return r?JSON.parse(r):[]}
function home(){const n=document.getElementById('name');if(!n)return;const p=participant();const a=activities();n.textContent=p?(p.nick||p.name||'ゲスト'):'ゲスト';if(a.length){document.getElementById('treeTitle').textContent='若葉が育っています';document.getElementById('treeText').textContent=a.length+'回の活動が記録されています。';}}
function register(){const f=document.getElementById('registerForm');if(!f)return;f.addEventListener('submit',e=>{e.preventDefault();const p={id:'R'+String(Date.now()).slice(-6),name:document.getElementById('userName').value.trim(),dept:document.getElementById('dept').value,nick:document.getElementById('nick').value.trim(),declaration:'',weeklyGoal:'',createdAt:new Date().toISOString()};saveParticipant(p);rinchanApi('saveUser', p).finally(()=>{location.href='welcome.html';});});}
function activity(){const f=document.getElementById('activityForm');if(!f)return;f.addEventListener('submit',e=>{e.preventDefault();const a=activities();a.push({date:document.getElementById('activityDate').value,steps:Number(document.getElementById('steps').value||0),challenge:document.getElementById('challenge').checked,comment:document.getElementById('comment').value.trim(),createdAt:new Date().toISOString()});localStorage.setItem('rinchanActivities',JSON.stringify(a));rinchanApi('saveActivity', a[a.length-1]);f.classList.add('hidden');document.getElementById('complete').classList.remove('hidden');scrollTo({top:0,behavior:'smooth'});});}
function dateDefault(){const d=document.getElementById('activityDate');if(!d)return;d.value=new Date().toISOString().slice(0,10);}
function mypage(){const name=document.getElementById('myName');if(!name)return;const p=participant();const a=activities();if(p){name.textContent=(p.nick||p.name)+'さん';document.getElementById('myDept').textContent=p.dept||'';const pd=document.getElementById('plantedDate');if(pd){pd.textContent='🌱 '+formatDateJP(p.createdAt)+'にあなたの木を植えました。';}document.getElementById('declarationText').textContent=p.declaration||'まだ登録されていません。';document.getElementById('weeklyGoalText').textContent=p.weeklyGoal||'まずは無理なく続ける';document.getElementById('profileSummary').textContent=(p.name||'未登録')+' / '+(p.dept||'所属未設定')+' / '+(p.nick||'ニックネーム未設定');}document.getElementById('activityCount').textContent=a.length+'回';}
function showEdit(id){document.querySelectorAll('.form').forEach(el=>el.classList.add('hidden'));const p=participant()||{};if(id==='profileEdit'){document.getElementById('editName').value=p.name||'';document.getElementById('editDept').value=p.dept||'';document.getElementById('editNick').value=p.nick||'';}if(id==='declarationEdit')document.getElementById('editDeclaration').value=p.declaration||'';if(id==='goalEdit')document.getElementById('editGoal').value=p.weeklyGoal||'';document.getElementById(id).classList.remove('hidden');}
function saveProfile(){const p=participant()||{id:'R'+String(Date.now()).slice(-6),createdAt:new Date().toISOString(),declaration:'',weeklyGoal:''};p.name=document.getElementById('editName').value.trim()||p.name||'ゲスト';p.dept=document.getElementById('editDept').value;p.nick=document.getElementById('editNick').value.trim();saveParticipant(p);alert('プロフィールを保存しました。');location.reload();}
function saveDeclaration(){const p=participant()||{id:'R'+String(Date.now()).slice(-6),name:'ゲスト',dept:'',nick:'',weeklyGoal:''};p.declaration=document.getElementById('editDeclaration').value.trim();saveParticipant(p);alert('健康宣言を保存しました。');location.reload();}
function saveGoal(){const p=participant()||{id:'R'+String(Date.now()).slice(-6),name:'ゲスト',dept:'',nick:'',declaration:''};p.weeklyGoal=document.getElementById('editGoal').value.trim();saveParticipant(p);alert('今週の目標を保存しました。');location.reload();}
function openNews(id){document.querySelector('.news-list').classList.add('hidden');document.getElementById(id).classList.remove('hidden');}
function closeNews(){document.querySelectorAll('.letter').forEach(el=>el.classList.add('hidden'));document.querySelector('.news-list').classList.remove('hidden');}

function formatDateJP(value){const d=value?new Date(value):new Date();if(isNaN(d.getTime()))return '今日';return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';}

function initHomeExperience(){
  const msg=document.getElementById('dailyMessage');
  if(!msg)return;
  const messages=[
    '今日もあなたの木が待っています。',
    '無理のない一歩を、一緒に育てましょう。',
    '少し歩けたら、それだけで十分です。',
    '水分補給も忘れずに、ゆっくりいきましょう。',
    'りんちゃんの杜に、春の風が吹いています。'
  ];
  const challenges=[
    '階段を1回使ってみよう',
    '水をもう一杯飲んでみよう',
    '昼休みに3分だけ歩いてみよう',
    '肩をゆっくり回してみよう',
    '今日は姿勢を少し意識してみよう'
  ];
  const index=new Date().getDate()%messages.length;
  msg.textContent=messages[index];
  const c=document.getElementById('todayChallenge');
  if(c)c.textContent=challenges[index];

  const a=activities();
  const count=a.length;
  const icon=document.getElementById('treeIcon');
  const title=document.getElementById('treeTitle');
  const text=document.getElementById('treeText');
  const bar=document.getElementById('growthBar');
  const note=document.getElementById('growthNote');
  let stage={icon:'🌱',title:'小さな芽が出ました',text:'活動を記録すると、あなたの木が少しずつ育ちます。',pct:15,next:'次の成長まで、あと5回。'};
  if(count>=5) stage={icon:'🌿',title:'若葉が育っています',text:'少しずつ健康の習慣が育っています。',pct:35,next:'次の成長まで、あと15回。'};
  if(count>=20) stage={icon:'🌳',title:'木が大きくなりました',text:'続ける力が、しっかり根を張っています。',pct:65,next:'次の成長まで、あと30回。'};
  if(count>=50) stage={icon:'🌸',title:'花が咲きました',text:'あなたの木に、きれいな花が咲きました。',pct:90,next:'すばらしい継続です。'};
  if(count>=100) stage={icon:'🌳🌸',title:'立派な木に育ちました',text:'あなたの歩みが、杜を支えています。',pct:100,next:'これからも一緒に育てましょう。'};
  if(icon)icon.textContent=stage.icon;
  if(title)title.textContent=stage.title;
  if(text)text.textContent=stage.text;
  if(bar)bar.style.width=stage.pct+'%';
  if(note)note.textContent=stage.next;
}


function getDeviceId(){
  let id=localStorage.getItem('rinchanDeviceId');
  if(!id){id='D'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('rinchanDeviceId',id);}
  return id;
}
async function rinchanApi(action,payload){
  const url=(typeof RINCHAN_CONFIG!=='undefined')?RINCHAN_CONFIG.API_URL:'';
  if(!url)return {ok:false,localOnly:true};
  const body=Object.assign({action:action,deviceId:getDeviceId()},payload||{});
  const res=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
  return await res.json();
}
