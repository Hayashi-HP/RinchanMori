const RINCHAN_NEWS_KEY='rinchanReadNewsIds';
const RINCHAN_NEWS_IDS=['news1','news2'];
function readJsonV051(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback}catch(e){return fallback}}
function readNewsIdsV051(){return readJsonV051(RINCHAN_NEWS_KEY,[])}
function saveNewsIdsV051(ids){localStorage.setItem(RINCHAN_NEWS_KEY,JSON.stringify(Array.from(new Set(ids))))}
function unreadCountV051(){const read=readNewsIdsV051();return RINCHAN_NEWS_IDS.filter(id=>!read.includes(id)).length}
function initNewsV051(){updateNewsBadgesV051();updateNewsRowsV051()}
document.addEventListener('DOMContentLoaded',initNewsV051);
function updateNewsBadgesV051(){const count=unreadCountV051();document.querySelectorAll('.notify-badge').forEach(el=>{el.textContent=count;el.classList.toggle('hidden',count===0)})}
function updateNewsRowsV051(){document.querySelectorAll('.news-row').forEach(row=>{const id=row.getAttribute('data-news-id');if(!id)return;const read=readNewsIdsV051().includes(id);row.classList.toggle('unread',!read);row.classList.toggle('read',read);const em=row.querySelector('em');if(em)em.textContent=read?'既読':'未読'})}
function openNews(id){const read=readNewsIdsV051();read.push(id);saveNewsIdsV051(read);updateNewsBadgesV051();updateNewsRowsV051();const list=document.querySelector('.news-list');if(list)list.classList.add('hidden');const sec=document.getElementById(id);if(sec)sec.classList.remove('hidden')}
function closeNews(){document.querySelectorAll('.letter').forEach(el=>el.classList.add('hidden'));const list=document.querySelector('.news-list');if(list)list.classList.remove('hidden');updateNewsBadgesV051();updateNewsRowsV051()}
