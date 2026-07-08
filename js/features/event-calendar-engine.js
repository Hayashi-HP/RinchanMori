const RinchanEventCalendarEngine = (() => {
  const VERSION = 'v1.2.4';

  function currentEvent(date) {
    const d = date || new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (m === 1 && day <= 7) return { key:'newyear', icon:'🎍', title:'お正月の杜', text:'新しい一年のはじまり。みんなの歩みで、今年の杜も少しずつ育ちます。' };
    if (m === 3 || m === 4) return { key:'sakura', icon:'🌸', title:'春の桜まつり', text:'春の杜に桜の気配。ありがとうの花も、歩みの若葉も、少しずつ増えています。' };
    if (m === 7 && day <= 7) return { key:'tanabata', icon:'🎋', title:'七夕の杜', text:'短冊に願いをこめて。今日も誰かの一歩とありがとうが、杜を明るくしています。' };
    if (m === 8) return { key:'summer', icon:'🎆', title:'夏祭りの杜', text:'夏の杜に、少しお祭りの気配。歩いた分だけ、夜空がにぎやかになります。' };
    if (m === 10 && day >= 20) return { key:'halloween', icon:'🎃', title:'ハロウィンの杜', text:'杜のどこかに、ちょっと不思議な仲間が隠れているかもしれません。' };
    if (m === 12 && day >= 10 && day <= 25) return { key:'christmas', icon:'🎄', title:'クリスマスの杜', text:'冬の杜に小さな灯り。ありがとうの花が、あたたかく咲いています。' };
    return { key:'normal', icon:'🌳', title:'今日の杜', text:'季節と時間に合わせて、杜の景色が少しずつ変わります。' };
  }

  function apply() {
    const event = currentEvent();
    const map = document.getElementById('moriMap');
    const title = document.getElementById('moriHighlightTitle');
    const text = document.getElementById('moriHighlightText');
    const season = document.getElementById('moriSeasonMessage');
    if (map) {
      map.classList.remove('rinchan-event-newyear','rinchan-event-sakura','rinchan-event-tanabata','rinchan-event-summer','rinchan-event-halloween','rinchan-event-christmas','rinchan-event-normal');
      map.classList.add('rinchan-event-' + event.key);
      map.dataset.eventKey = event.key;
    }
    if (title) title.textContent = event.icon + ' ' + event.title;
    if (text) text.textContent = event.text;
    if (season && event.key !== 'normal') season.textContent = event.title + '。' + event.text;
  }

  function install() {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1200);
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 120));
  return { VERSION, install, apply, currentEvent };
})();
window.RinchanEventCalendarEngine = RinchanEventCalendarEngine;
