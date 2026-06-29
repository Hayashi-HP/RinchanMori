document.addEventListener('DOMContentLoaded',()=>{home();register();activity();dateDefault();mypage();initHomeExperience();});

const RINCHAN_VERSION='v0.2.1-A';
const LS={participant:'rinchanParticipant',activities:'rinchanActivities',device:'rinchanDeviceId',pending:'rinchanPendingSaves'};

function participant(){return readJson(LS.participant,null)}
function saveParticipant(p){localStorage.setItem(LS.participant,JSON.stringify(p))}
function activities(){return readJson(LS.activities,[])}
function readJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function page(path){const here=location.pathname;return here.includes('/pages/')?path:'pages/'+path}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}

function home(){
  const n=document.getElementById('name');if(!n)return;
  const p=participant();const a=activities();
  n.textContent=p?(p.nick||p.name||'ゲスト'):'ゲスト';
  if(!p){const action=document.querySelector('.focus-action a');if(action){action.href=page('register.html');action.querySelector('strong').textContent='初回登録する';action.querySelector('small').textContent='あなたの木を植える';}}
  if(a.length){setText('treeTitle','若葉が育っています');setText('treeText',a.length+'回の活動が記録されています。')}
}

function register(){
  const f=document.getElementById('registerForm');if(!f)return;
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=f.querySelector('button');setBusy(btn,true,'登録中...');
    const now=new Date().toISOString();
    const p={id:getParticipantId(),deviceId:getDeviceId(),name:value('userName'),dept:value('dept'),nick:value('nick'),declaration:'',weeklyGoal:'まずは無理なく続ける',createdAt:now,updatedAt:now,version:RINCHAN_VERSION};
    saveParticipant(p);
    await saveRemote('saveUser',p);
    location.href='welcome.html';
  });
}

function activity(){
  const f=document.getElementById('activityForm');if(!f)return;
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    const p=participant();
    if(!p){location.href='register.html';return;}
    const btn=f.querySelector('button');setBusy(btn,true,'保存中...');
    const item={activityId:'A'+Date.now().toString(36),participantId:p.id,deviceId:getDeviceId(),date:value('activityDate'),steps:Number(value('steps')||0),challenge:document.getElementById('challenge').checked,comment:value('comment'),createdAt:new Date().toISOString(),version:RINCHAN_VERSION};
    const list=activities();list.push(item);localStorage.setItem(LS.activities,JSON.stringify(list));
    await saveRemote('saveActivity',item);
    f.classList.add('hidden');document.getElementById('complete').classList.remove('hidden');scrollTo({top:0,behavior:'smooth'});
  });
}

function dateDefault(){const d=document.getElementById('activityDate');if(d&&!d.value)d.value=new Date().toISOString().slice(0,10)}

function mypage(){
  const name=document.getElementById('myName');if(!name)return;
  const p=participant();const a=activities();
  if(p){name.textContent=(p.nick||p.name)+'さん';setText('myDept',p.dept||'');const pd=document.getElementById('plantedDate');if(pd)pd.textContent='🌱 '+formatDateJP(p.createdAt)+'にあなたの木を植えました。';setText('declarationText',p.declaration||'まだ登録されていません。');setText('weeklyGoalText',p.weeklyGoal||'まずは無理なく続ける');setText('profileSummary',(p.name||'未登録')+' / '+(p.dept||'所属未設定')+' / '+(p.nick||'ニックネーム未設定'));}
  setText('activityCount',a.length+'回');
}

function showEdit(id){document.querySelectorAll('.form').forEach(el=>el.classList.add('hidden'));const p=participant()||{};if(id==='profileEdit'){document.getElementById('editName').value=p.name||'';document.getElementById('editDept').value=p.dept||'';document.getElementById('editNick').value=p.nick||'';}if(id==='declarationEdit')document.getElementById('editDeclaration').value=p.declaration||'';if(id==='goalEdit')document.getElementById('editGoal').value=p.weeklyGoal||'';document.getElementById(id).classList.remove('hidden')}
async function saveProfile(){const p=participant()||baseParticipant();p.name=value('editName')||p.name||'ゲスト';p.dept=value('editDept');p.nick=value('editNick');p.updatedAt=new Date().toISOString();saveParticipant(p);await saveRemote('saveUser',p);alert('プロフィールを保存しました。');location.reload()}
async function saveDeclaration(){const p=participant()||baseParticipant();p.declaration=value('editDeclaration');p.updatedAt=new Date().toISOString();saveParticipant(p);await saveRemote('saveUser',p);alert('健康宣言を保存しました。');location.reload()}
async function saveGoal(){const p=participant()||baseParticipant();p.weeklyGoal=value('editGoal');p.updatedAt=new Date().toISOString();saveParticipant(p);await saveRemote('saveUser',p);alert('今週の目標を保存しました。');location.reload()}
function baseParticipant(){return {id:getParticipantId(),deviceId:getDeviceId(),name:'ゲスト',dept:'',nick:'',declaration:'',weeklyGoal:'まずは無理なく続ける',createdAt:new Date().toISOString(),version:RINCHAN_VERSION}}

function openNews(id){document.querySelector('.news-list').classList.add('hidden');document.getElementById(id).classList.remove('hidden')}
function closeNews(){document.querySelectorAll('.letter').forEach(el=>el.classList.add('hidden'));document.querySelector('.news-list').classList.remove('hidden')}
function formatDateJP(value){const d=value?new Date(value):new Date();if(isNaN(d.getTime()))return '今日';return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'}

function initHomeExperience(){
  const msg=document.getElementById('dailyMessage');if(!msg)return;
  const messages=['今日もあなたの木が待っています。','無理のない一歩を、一緒に育てましょう。','少し歩けたら、それだけで十分です。','水分補給も忘れずに、ゆっくりいきましょう。','りんちゃんの杜に、春の風が吹いています。'];
  const challenges=['階段を1回使ってみよう','水をもう一杯飲んでみよう','昼休みに3分だけ歩いてみよう','肩をゆっくり回してみよう','今日は姿勢を少し意識してみよう'];
  const index=new Date().getDate()%messages.length;msg.textContent=messages[index];const c=document.getElementById('todayChallenge');if(c)c.textContent=challenges[index];
  const count=activities().length;const icon=document.getElementById('treeIcon');const title=document.getElementById('treeTitle');const text=document.getElementById('treeText');const bar=document.getElementById('growthBar');const note=document.getElementById('growthNote');
  let stage={icon:'🌱',title:'小さな芽が出ました',text:'活動を記録すると、あなたの木が少しずつ育ちます。',pct:15,next:'次の成長まで、あと5回。'};
  if(count>=5)stage={icon:'🌿',title:'若葉が育っています',text:'少しずつ健康の習慣が育っています。',pct:35,next:'次の成長まで、あと15回。'};
  if(count>=20)stage={icon:'🌳',title:'木が大きくなりました',text:'続ける力が、しっかり根を張っています。',pct:65,next:'次の成長まで、あと30回。'};
  if(count>=50)stage={icon:'🌸',title:'花が咲きました',text:'あなたの木に、きれいな花が咲きました。',pct:90,next:'すばらしい継続です。'};
  if(count>=100)stage={icon:'🌳🌸',title:'立派な木に育ちました',text:'あなたの歩みが、杜を支えています。',pct:100,next:'これからも一緒に育てましょう。'};
  if(icon)icon.textContent=stage.icon;if(title)title.textContent=stage.title;if(text)text.textContent=stage.text;if(bar)bar.style.width=stage.pct+'%';if(note)note.textContent=stage.next;
}

function getParticipantId(){const p=participant();return p&&p.id?p.id:'R'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function getDeviceId(){let id=localStorage.getItem(LS.device);if(!id){id='D'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem(LS.device,id)}return id}
function value(id){const el=document.getElementById(id);return el?String(el.value||'').trim():''}
function setBusy(btn,busy,label){if(!btn)return;btn.disabled=busy;if(label)btn.textContent=label}

async function saveRemote(action,payload){
  const result=await rinchanApi(action,payload);
  if(!result.ok)queuePending(action,payload,result.reason||'remote_error');
  return result;
}
async function rinchanApi(action,payload){
  const url=(typeof RINCHAN_CONFIG!=='undefined')?RINCHAN_CONFIG.API_URL:'';
  if(!url)return {ok:false,localOnly:true,reason:'api_url_empty'};
  try{
    const body=Object.assign({action,deviceId:getDeviceId(),appVersion:RINCHAN_VERSION},payload||{});
    const res=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
    const json=await res.json();return json&&json.ok?json:{ok:false,reason:(json&&json.error)||'api_error'};
  }catch(e){return {ok:false,reason:e.message}}
}
function queuePending(action,payload,reason){const q=readJson(LS.pending,[]);q.push({action,payload,reason,queuedAt:new Date().toISOString()});localStorage.setItem(LS.pending,JSON.stringify(q))}
