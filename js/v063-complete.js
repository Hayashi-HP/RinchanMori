document.addEventListener('DOMContentLoaded',function(){
  var complete=document.getElementById('complete');
  if(!complete)return;
  var observer=new MutationObserver(function(){
    if(!complete.classList.contains('hidden'))runLeafCelebration();
  });
  observer.observe(complete,{attributes:true,attributeFilter:['class']});
});
function runLeafCelebration(){
  if(document.querySelector('.leaf-celebration'))return;
  var layer=document.createElement('div');
  layer.className='leaf-celebration';
  var leaves=['🌿','🍃','✨','🌱','🌿','🍃'];
  leaves.forEach(function(x,i){
    var s=document.createElement('span');
    s.textContent=x;
    s.style.left=(12+i*14)+'%';
    s.style.animationDelay=(i*.12)+'s';
    layer.appendChild(s);
  });
  document.body.appendChild(layer);
  setTimeout(function(){layer.remove();},2200);
}
