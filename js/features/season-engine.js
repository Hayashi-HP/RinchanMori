const RinchanSeasonEngine = (() => {
  const VERSION = 'v1.1.27';

  function season(now) {
    const m = (now || new Date()).getMonth() + 1;
    if (m >= 3 && m <= 5) return { key: 'spring', icon: '🌸', name: '春', phrase: '春の風が気持ちいいね♪' };
    if (m >= 6 && m <= 8) return { key: 'summer', icon: '🌿', name: '夏', phrase: '木かげでひとやすみ🌿' };
    if (m >= 9 && m <= 11) return { key: 'autumn', icon: '🍁', name: '秋', phrase: '秋の杜です🍁' };
    return { key: 'winter', icon: '❄️', name: '冬', phrase: 'あたたかくしてね❄️' };
  }

  function timeMood(now) {
    const h = (now || new Date()).getHours();
    if (h >= 5 && h < 11) return { key: 'morning', label: '朝', phrase: '朝の杜です✨' };
    if (h >= 11 && h < 17) return { key: 'day', label: '昼', phrase: 'おひさまの杜☀️' };
    if (h >= 17 && h < 21) return { key: 'evening', label: '夕方', phrase: '夕方の杜🌇' };
    return { key: 'night', label: '夜', phrase: '夜の杜🌙' };
  }

  function pickWeather(now) {
    const d = now || new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    if (seed % 17 === 0) return { key: 'rainbow', icon: '🌈', phrase: '虹が出たよ🌈' };
    if (seed % 7 === 0) return { key: 'rain', icon: '☔', phrase: '雨で木が元気です🌱' };
    return { key: 'clear', icon: '', phrase: '' };
  }

  function today() {
    const now = new Date();
    const s = season(now);
    const t = timeMood(now);
    const w = pickWeather(now);
    return { season: s, time: t, weather: w, className: 'rinchan-season-' + s.key + ' rinchan-time-' + t.key + (w.key !== 'clear' ? ' rinchan-weather-' + w.key : '') };
  }

  function message() {
    const data = today();
    if (data.weather.phrase) return data.weather.phrase;
    return data.time.phrase + ' ' + data.season.phrase;
  }

  function moriMessage() {
    const data = today();
    if (data.weather.phrase) return data.weather.phrase;
    return data.time.phrase;
  }

  function applyBodyClass() {
    const data = today();
    document.body.classList.remove('rinchan-season-spring','rinchan-season-summer','rinchan-season-autumn','rinchan-season-winter','rinchan-time-morning','rinchan-time-day','rinchan-time-evening','rinchan-time-night','rinchan-weather-rain','rinchan-weather-rainbow');
    data.className.split(' ').forEach(cls => { if (cls) document.body.classList.add(cls); });
  }

  function applyHome() {
    const msg = document.getElementById('dailyMessage');
    const challenge = document.getElementById('todayChallenge');
    const data = today();
    if (msg) msg.textContent = message();
    if (challenge) challenge.textContent = data.season.icon + ' 今日だけの杜を見にいこう';
  }

  function applyMori() {
    const seasonMsg = document.getElementById('moriSeasonMessage');
    const highlight = document.getElementById('moriHighlightText');
    if (seasonMsg) seasonMsg.textContent = moriMessage();
    if (highlight && !highlight.dataset.rinchanSeasonLocked) highlight.textContent = moriMessage();
  }

  function install() {
    applyBodyClass();
    applyHome();
    applyMori();
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('pageshow', () => setTimeout(install, 80));

  return { VERSION, today, message, moriMessage, install };
})();
window.RinchanSeasonEngine = RinchanSeasonEngine;
