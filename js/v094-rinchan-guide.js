const RINCHAN_V094='v0.9.4';
const RINCHAN_GUIDE_KEY='rinchanGuideSeenV094';

document.addEventListener('DOMContentLoaded',()=>{initRinchanGuideV094();});

function initRinchanGuideV094(){
  if(localStorage.getItem(RINCHAN_GUIDE_KEY)==='1')return;
  const layer=document.createElement('div');
  layer.className='rinchan-guide-layer';
  layer.id='rinchanGuideLayer';
  layer.innerHTML='<div class="rinchan-guide-card"><div class="guide-face">😊</div><p class="label">りんちゃんガイド</p><h1 id="guideTitle">ようこそ、りんちゃんの杜へ</h1><p id="guideText">ここでは、一人ひとりの一歩が、みんなの杜を育てます。</p><div class="guide-dots" id="guideDots"></div><div class="guide-actions"><button class="soft-button" onclick="skipRinchanGuideV094()">あとで</button><button class="submit pill-button" onclick="nextRinchanGuideV094()" id="guideNext">次へ</button></div></div>';
  document.body.appendChild(layer);
  renderGuideStepV094();
}

const guideStepsV094=[
  {t:'ようこそ、りんちゃんの杜へ',x:'ここでは、一人ひとりの一歩が、みんなの杜を育てます。'},
  {t:'歩けば、木が育ちます',x:'活動を記録すると、あなたの木に葉っぱが増えて、少しずつ大きくなります。'},
  {t:'ありがとうが届きます',x:'ありがとうが増えると、杜に蝶が遊びに来ます。競争ではなく、みんなで育てる杜です。'},
  {t:'無理せず、いこうね',x:'歩ける日も、歩けない日もあります。自分のペースで、ゆっくり続けましょう。'}
];
let guideIndexV094=0;
function renderGuideStepV094(){
  const step=guideStepsV094[guideIndexV094];
  const title=document.getElementById('guideTitle');
  const text=document.getElementById('guideText');
  const dots=document.getElementById('guideDots');
  const next=document.getElementById('guideNext');
  if(title)title.textContent=step.t;
  if(text)text.textContent=step.x;
  if(dots)dots.innerHTML=guideStepsV094.map((_,i)=>'<span class="'+(i===guideIndexV094?'active':'')+'"></span>').join('');
  if(next)next.textContent=guideIndexV094===guideStepsV094.length-1?'はじめる':'次へ';
}
function nextRinchanGuideV094(){
  if(guideIndexV094<guideStepsV094.length-1){guideIndexV094++;renderGuideStepV094();return;}
  finishRinchanGuideV094();
}
function skipRinchanGuideV094(){finishRinchanGuideV094();}
function finishRinchanGuideV094(){
  localStorage.setItem(RINCHAN_GUIDE_KEY,'1');
  const layer=document.getElementById('rinchanGuideLayer');
  if(layer)layer.remove();
}
