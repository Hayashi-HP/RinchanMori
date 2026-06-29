const RINCHAN_V051='v0.5.1';

function v051Participant(){try{return JSON.parse(localStorage.getItem('rinchanParticipant')||'null')}catch(e){return null}}
function v051SaveParticipant(p){localStorage.setItem('rinchanParticipant',JSON.stringify(p))}
function v051ApiUrl(){return (typeof RINCHAN_CONFIG!=='undefined'&&RINCHAN_CONFIG.API_URL)?String(RINCHAN_CONFIG.API_URL).trim():''}
function v051DeviceId(){let id=localStorage.getItem('rinchanDeviceId');if(!id){id='D'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('rinchanDeviceId',id)}return id}
function v051Value(id){const el=document.getElementById(id);return el?String(el.value||'').trim():''}
function v051SetBusy(btn,busy,label){if(!btn)return;btn.disabled=busy;if(label)btn.textContent=label}
async function v051Api(action,payload){const url=v051ApiUrl();if(!url)return {ok:false,reason:'api_url_empty'};try{const res=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action,deviceId:v051DeviceId(),appVersion:RINCHAN_V051},payload||{}))});const json=await res.json();return json&&json.ok?json:{ok:false,reason:(json&&json.error)||'api_error'}}catch(e){return {ok:false,reason:e.message}}}

document.addEventListener('DOMContentLoaded',()=>{interceptRegisterFormV051();initLoginFormV051();protectGuestMypageV051();normalizeNavLabelsV051();});

function normalizeNavLabelsV051(){document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')&&a.getAttribute('href').includes('activity.html')){a.innerHTML='👟<small>歩数記録</small>';a.classList.add('plus')}})}

function interceptRegisterFormV051(){
  const f=document.getElementById('registerForm');if(!f)return;
  f.addEventListener('submit',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const btn=f.querySelector('button[type="submit"],button');
    const employeeId=v051Value('employeeId');const pin4=v051Value('pin4');
    if(!employeeId){alert('社員番号を入力してください。');return;}
    if(!/^\d{4}$/.test(pin4)){alert('誕生日4桁を入力してください。例：4月8日なら0408');return;}
    v051SetBusy(btn,true,'登録中...');
    const now=new Date().toISOString();
    const p={id:employeeId,employeeId:employeeId,deviceId:v051DeviceId(),name:v051Value('userName'),dept:v051Value('dept'),nick:v051Value('nick'),email:v051Value('email'),pin4:pin4,declaration:'',weeklyGoal:'まずは無理なく続ける',createdAt:now,updatedAt:now,version:RINCHAN_V051};
    const result=await v051Api('saveUser',p);
    v051SaveParticipant(result.ok&&result.user?result.user:p);
    location.href='welcome.html';
  },true);
}

function initLoginFormV051(){
  const f=document.getElementById('loginForm');if(!f)return;
  f.addEventListener('submit',async e=>{
    e.preventDefault();const btn=f.querySelector('button[type="submit"],button');
    const employeeId=v051Value('loginEmployeeId');const pin4=v051Value('loginPin4');
    if(!employeeId){alert('社員番号を入力してください。');return;}
    if(!/^\d{4}$/.test(pin4)){alert('誕生日4桁を入力してください。');return;}
    v051SetBusy(btn,true,'ログイン中...');
    const result=await v051Api('loginUser',{employeeId,pin4});
    if(result.ok&&result.user){v051SaveParticipant(result.user);location.href='../index.html';return;}
    v051SetBusy(btn,false,'ログインする');alert('ログインできませんでした。社員番号と誕生日4桁を確認してください。');
  });
}
