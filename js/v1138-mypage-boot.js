/* v1.1.42 mypage boot: keep thanks history stable until server sync finishes */
(function(){
  var refreshInFlight=null;
  var lastRefreshStartedAt=0;
  function consumeAdminNotice(){
    try{
      var message=sessionStorage.getItem('rinchanAdminAccessNotice')||'';
      if(!message)return;
      sessionStorage.removeItem('rinchanAdminAccessNotice');
      alert(message);
    }catch(e){}
  }
  function showAdminLink(){
    try{
      var state=(window.RinchanApi&&typeof RinchanApi.authState==='function')?RinchanApi.authState():null;
      var user=state&&state.user?state.user:((window.RinchanStorage&&typeof RinchanStorage.getParticipant==='function')?RinchanStorage.getParticipant():JSON.parse(localStorage.getItem('rinchanParticipant')||'null'));
      var isAdmin=state?!!state.isAdmin:!!(user&&(String(user.admin||'')==='1'||user.admin===true||String(user.role||'').toLowerCase()==='admin'));
      var link=document.getElementById('adminHeaderLink');
      if(!link)return;
      if(isAdmin)link.classList.remove('hidden');
      else link.classList.add('hidden');
    }catch(e){}
  }
  function scrollToThanks(){
    if(location.hash!=='#thanks')return;
    var el=document.getElementById('thanksInboxSection');
    if(!el||el.classList.contains('hidden'))el=document.getElementById('thanks');
    if(!el)return;
    setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});},350);
  }
  function renderAll(){
    try{if(window.RinchanMypage&&typeof RinchanMypage.renderAll==='function')RinchanMypage.renderAll();}catch(e){}
    try{if(window.RinchanThanks&&typeof RinchanThanks.renderAll==='function')RinchanThanks.renderAll();}catch(e){}
    showAdminLink();
    scrollToThanks();
  }
  async function refreshMypage(force){
    if(refreshInFlight)return refreshInFlight;
    if(!force&&Date.now()-lastRefreshStartedAt<1500)return null;
    lastRefreshStartedAt=Date.now();
    refreshInFlight=(async function(){
    showAdminLink();
    try{
      if(window.RinchanSync&&typeof RinchanSync.sync==='function'){
        document.body.classList.add('thanks-syncing');
        await RinchanSync.sync({silent:true});
      }
    }catch(e){}
    document.body.classList.remove('thanks-syncing');
    renderAll();
    })();
    try{return await refreshInFlight;}finally{refreshInFlight=null;}
  }
  document.addEventListener('DOMContentLoaded',function(){consumeAdminNotice();showAdminLink();setTimeout(refreshMypage,80);});
  window.addEventListener('pageshow',function(event){showAdminLink();if(event&&event.persisted)setTimeout(function(){refreshMypage(true);},80);});
  setTimeout(function(){
    if(document.body.classList.contains('thanks-syncing')){
      document.body.classList.remove('thanks-syncing');
      renderAll();
    }
  },3500);
})();
