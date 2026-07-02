/* v1.0.08 viewport centered edit popup fix */
(function(){
  function readParticipant(){
    try{
      if(window.RinchanStorage && typeof RinchanStorage.getParticipant === 'function') return RinchanStorage.getParticipant();
      return JSON.parse(localStorage.getItem('rinchanParticipant') || 'null');
    }catch(e){ return null; }
  }
  function setInput(id,value){ var el=document.getElementById(id); if(el) el.value=value || ''; }
  function hideEdit(){
    document.querySelectorAll('.edit-panel').forEach(function(el){ el.classList.add('hidden'); });
    document.body.classList.remove('edit-open');
  }
  function centerPanel(panel){
    if(!panel) return;
    panel.style.left='50%';
    panel.style.top='50%';
    panel.style.right='auto';
    panel.style.bottom='auto';
    panel.style.transform='translate(-50%,-50%)';
  }
  function showEdit(id){
    var user=readParticipant();
    if(!user || !(user.employeeId || user.id)){
      alert('登録後に編集できます。');
      location.href='login.html';
      return;
    }
    hideEdit();
    if(id==='profileEdit'){
      setInput('editName',user.name || '');
      setInput('editDept',user.dept || '');
      setInput('editNick',user.nick || '');
    }
    if(id==='declarationEdit') setInput('editDeclaration',user.declaration || '');
    if(id==='goalEdit') setInput('editGoal',user.weeklyGoal || '');
    if(id==='weeklyStepGoalEdit') setInput('editWeeklyStepGoal',user.weeklyStepGoal || '');
    var panel=document.getElementById(id);
    if(!panel) return;
    if(panel.parentElement !== document.body) document.body.appendChild(panel);
    panel.classList.remove('hidden');
    document.body.classList.add('edit-open');
    centerPanel(panel);
    setTimeout(function(){centerPanel(panel);},50);
    setTimeout(function(){centerPanel(panel);},250);
  }
  window.showEdit=showEdit;
  window.hideEdit=hideEdit;
  window.centerEditPanel=function(){
    var panel=document.querySelector('body>.edit-panel:not(.hidden)');
    centerPanel(panel);
  };
  window.addEventListener('resize',window.centerEditPanel);
  if(window.visualViewport){
    visualViewport.addEventListener('resize',window.centerEditPanel);
    visualViewport.addEventListener('scroll',window.centerEditPanel);
  }
})();
