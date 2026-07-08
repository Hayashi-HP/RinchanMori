/* v1.1.38 mypage boot */
(function(){
  function showAdminLink(){
    try{
      var user=(window.RinchanStorage&&typeof RinchanStorage.getParticipant==='function')?RinchanStorage.getParticipant():JSON.parse(localStorage.getItem('rinchanParticipant')||'null');
      var isAdmin=!!(user&&(String(user.admin||'')==='1'||user.admin===true||String(user.role||'').toLowerCase()==='admin'));
      var link=document.getElementById('adminHeaderLink');
      if(link&&isAdmin)link.classList.remove('hidden');
    }catch(e){}
  }
  function scrollToThanks(){
    if(location.hash!=='#thanks')return;
    var el=document.getElementById('thanksInboxSection');
    if(!el||el.classList.contains('hidden'))el=document.getElementById('thanks');
    if(!el)return;
    setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});},350);
  }
  function refreshMypage(){
    try{
      if(window.RinchanMypage&&typeof RinchanMypage.renderAll==='function')RinchanMypage.renderAll();
      if(window.RinchanThanks&&typeof RinchanThanks.renderAll==='function')RinchanThanks.renderAll();
      showAdminLink();
      scrollToThanks();
      if(window.RinchanSync&&typeof RinchanSync.sync==='function')setTimeout(function(){
        RinchanSync.sync({silent:true});
        setTimeout(scrollToThanks,700);
      },600);
    }catch(e){
      showAdminLink();
      scrollToThanks();
    }
  }
  document.addEventListener('DOMContentLoaded',function(){showAdminLink();setTimeout(refreshMypage,80);});
  window.addEventListener('pageshow',function(){showAdminLink();setTimeout(refreshMypage,80);});
})();
