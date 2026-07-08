/* v1.1.38 home boot */
(function(){
  function getParticipant(){
    try{
      if(window.RinchanStorage&&typeof RinchanStorage.getParticipant==='function')return RinchanStorage.getParticipant();
      return JSON.parse(localStorage.getItem('rinchanParticipant')||'null');
    }catch(e){return null;}
  }
  function displayName(user){return (user&&(user.nick||user.nickname||user.displayName||user.name||user.employeeName))||'ゲスト';}
  function renderMoriLetter(){
    var text=document.getElementById('homeMoriLetterText');
    if(!text)return;
    if(window.RinchanSeasonEngine&&typeof RinchanSeasonEngine.message==='function')text.textContent=RinchanSeasonEngine.message();
  }
  function renderGuestState(){
    var user=getParticipant();
    var loggedIn=!!(user&&(user.employeeId||user.id));
    var guest=document.getElementById('guestEntryPanel');
    var action=document.getElementById('homePrimaryAction');
    var chart=document.getElementById('weeklyStepsChart');
    var tree=document.getElementById('homeTreeSection');
    var mori=document.getElementById('homeMoriLetter');
    var name=document.getElementById('name');
    var greeting=document.getElementById('dailyGreeting');
    document.body.classList.toggle('is-logged-in',loggedIn);
    document.body.classList.toggle('is-guest',!loggedIn);
    if(name)name.textContent=displayName(user);
    if(greeting)greeting.textContent=loggedIn?'おかえり♪':'こんにちは';
    if(guest)guest.classList.toggle('hidden',loggedIn);
    [action,chart,tree,mori].forEach(function(el){if(el)el.classList.toggle('hidden',!loggedIn);});
  }
  async function boot(){
    try{
      renderGuestState();
      if(window.RinchanAuth&&RinchanAuth.requireUser)RinchanAuth.requireUser({redirect:false});
      if(window.RinchanSync&&RinchanSync.sync)await RinchanSync.sync({silent:true});
      renderGuestState();
      if(window.RinchanSeasonEngine&&RinchanSeasonEngine.install)RinchanSeasonEngine.install();
      renderMoriLetter();
      if(window.RinchanGrowth&&RinchanGrowth.renderHome)RinchanGrowth.renderHome();
      if(window.RinchanChart&&RinchanChart.renderWeeklySteps)RinchanChart.renderWeeklySteps();
      if(window.RinchanGuide&&RinchanGuide.render)RinchanGuide.render();
      if(window.RinchanNews&&RinchanNews.updateBadges)RinchanNews.updateBadges();
      if(window.RinchanVoice&&RinchanVoice.renderHome)RinchanVoice.renderHome();
      if(window.RinchanHomeWorld&&RinchanHomeWorld.renderHome)RinchanHomeWorld.renderHome();
      if(window.RinchanFlowerAlbum&&RinchanFlowerAlbum.renderAll)RinchanFlowerAlbum.renderAll();
      if(window.RinchanGrowthAnimation&&RinchanGrowthAnimation.install)RinchanGrowthAnimation.install();
      if(window.RinchanCreatureEngine&&RinchanCreatureEngine.install)RinchanCreatureEngine.install();
      if(window.RinchanThanksHomeNotice&&RinchanThanksHomeNotice.install)RinchanThanksHomeNotice.install();
      renderGuestState();
      renderMoriLetter();
    }catch(e){console.warn(e);renderGuestState();}
  }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('pageshow',function(){setTimeout(boot,100);});
})();
