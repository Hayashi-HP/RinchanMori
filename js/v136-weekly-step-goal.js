const RINCHAN_V136='v0.9.37';
function v136ReadJson(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function v136SaveParticipant(p){localStorage.setItem('rinchanParticipant',JSON.stringify(p))}
function v136Participant(){return v136ReadJson('rinchanParticipant',null)}
function v136Value(id){const el=document.getElementById(id);return el?String(el.value||'').trim():''}
function v136Num(n){return Number(n||0).toLocaleString('ja-JP')}
function v136SetText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
function v136RenderGoal(){const p=v136Participant()||{};const goal=Number(String(p.weeklyStepGoal||'').replace(/,/g,''));v136SetText('v136WeeklyStepGoalText',goal>0?v136Num(goal)+'歩':'未設定');const input=document.getElementById('editWeeklyStepGoal');if(input)input.value=goal>0?String(goal):''}
async function saveWeeklyStepGoalV136(){const btn=event&&event.target?event.target:null;const p=v136Participant();if(!p||!p.id){location.href='login.html';return;}const raw=v136Value('editWeeklyStepGoal').replace(/,/g,'');if(raw&&!/^\d+$/.test(raw)){alert('歩数は数字で入力してください。');return;}if(btn){btn.disabled=true;btn.textContent='保存中...'}p.weeklyStepGoal=raw?String(Number(raw)):'';p.updatedAt=new Date().toISOString();p.version=RINCHAN_V136;v136SaveParticipant(p);if(typeof v051Api==='function'){const result=await v051Api('saveUser',p);if(result&&result.ok&&result.user)v136SaveParticipant(result.user);}location.reload()}
document.addEventListener('DOMContentLoaded',()=>{v136RenderGoal();setTimeout(v136RenderGoal,1200);});
