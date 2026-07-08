/* v1.1.42 mypage boot: keep thanks history stable until server sync finishes */
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
  function renderAll(){
    try{if(window.RinchanMypage&&typeof RinchanMypage.renderAll==='function')RinchanMypage.renderAll();}catch(e){}
    try{if(window.RinchanThanks&&typeof RinchanThanks.renderAll==='function')RinchanThanks.renderAll();}catch(e){}
    showAdminLink();
    scrollToThanks();
  }
  async function refreshMypage(){
    showAdminLink();
    try{
      if(window.RinchanSync&&typeof RinchanSync.sync==='function'){
        document.body.classList.add('thanks-syncing');
        await RinchanSync.sync({silent:true});
      }
    }catch(e){}
    document.body.classList.remove('thanks-syncing');
    renderAll();
  }
  document.addEventListener('DOMContentLoaded',function(){showAdminLink();setTimeout(refreshMypage,80);});
  window.addEventListener('pageshow',function(){showAdminLink();setTimeout(refreshMypage,80);});
  setTimeout(function(){
    if(document.body.classList.contains('thanks-syncing')){
      document.body.classList.remove('thanks-syncing');
      renderAll();
    }
  },3500);
})();
