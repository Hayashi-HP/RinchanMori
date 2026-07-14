const RinchanAnnualEventCatalog = (() => {
  const VERSION = 'v1.5.13';

  const EVENTS = [
    { month:1,key:'newyear',icon:'🎍',title:'初日の出ウォーク',startDay:1,endDay:31,individualTarget:90000,theme:'新しい一年の歩き始め',collectible:'おみくじ',participationBadge:'初歩き',achievementBadge:'新春ウォーカー',text:'新しい一年のはじまり。みんなの歩みで、今年の杜も少しずつ育ちます。' },
    { month:2,key:'setsubun',icon:'👹',title:'節分ウォーク',startDay:1,endDay:28,individualTarget:80000,theme:'歩いて元気に鬼退治',collectible:'福豆',participationBadge:'福まき参加',achievementBadge:'鬼退治ウォーカー',text:'一歩ごとに福豆を集めて、杜の鬼を追い払いましょう。' },
    { month:3,key:'sakura',icon:'🌸',title:'桜のつぼみチャレンジ',startDay:1,endDay:31,individualTarget:100000,theme:'歩数で桜を咲かせる',collectible:'桜の花びら',participationBadge:'春の芽吹き',achievementBadge:'満開ウォーカー',text:'歩いた分だけ桜のつぼみが開き、春の杜が色づきます。' },
    { month:4,key:'newseason',icon:'🌱',title:'新年度スタートウォーク',startDay:1,endDay:30,individualTarget:100000,theme:'新しい目標と一歩を始める',collectible:'若葉',participationBadge:'新年度スタート',achievementBadge:'若葉ウォーカー',text:'新しい年度の一歩を、りんちゃんの杜から始めましょう。' },
    { month:5,key:'freshgreen',icon:'🍃',title:'新緑ウォーク',startDay:1,endDay:31,individualTarget:110000,theme:'杜の緑を増やす',collectible:'新緑の葉',participationBadge:'新緑参加',achievementBadge:'みどりの守り人',text:'みんなの歩みで、杜いっぱいに新しい緑を増やしましょう。' },
    { month:6,key:'rainy',icon:'☔',title:'雨の日チャレンジ',startDay:1,endDay:30,individualTarget:90000,theme:'梅雨も無理なく続ける',collectible:'しずく',participationBadge:'雨の日参加',achievementBadge:'あじさいウォーカー',text:'雨の日も無理をせず、できる範囲の一歩を積み重ねましょう。' },
    { month:7,key:'tanabata',icon:'🎋',title:'七夕の杜',startDay:1,endDay:31,individualTarget:100000,theme:'星空を楽しむ七夕の杜',collectible:'星のかけら',participationBadge:'七夕の夜',achievementBadge:'星空ウォーカー',text:'今日は七夕。みんなの願いが星空へ届きますように。',module:{css:'../css/v125-tanabata.css?v=192',js:'../js/features/tanabata-event.js?v=192',global:'RinchanTanabataEvent'} },
    { month:8,key:'summer',icon:'🎆',title:'りんちゃん夏祭り',startDay:1,endDay:31,individualTarget:100000,theme:'歩いて夏祭り会場を完成させる',collectible:'屋台スタンプ',participationBadge:'夏祭り参加',achievementBadge:'夏祭りマスター',text:'歩いた分だけ提灯と屋台が増え、夏祭り会場がにぎやかになります。',module:{css:'../css/v126-summer-festival.css?v=150',js:'../js/features/summer-festival-event.js?v=150',global:'RinchanSummerFestivalEvent'} },
    { month:9,key:'moon',icon:'🌕',title:'お月見ウォーク',startDay:1,endDay:30,individualTarget:100000,theme:'歩いて満月を完成させる',collectible:'月のかけら',participationBadge:'お月見参加',achievementBadge:'満月ウォーカー',text:'歩くたびに月のかけらが集まり、杜の夜空に満月が近づきます。' },
    { month:10,key:'halloween',icon:'🎃',title:'ハロウィンウォーク',startDay:1,endDay:31,individualTarget:100000,theme:'不思議な仲間とお菓子を集める',collectible:'お菓子',participationBadge:'仮装参加',achievementBadge:'ハロウィンマスター',text:'杜のどこかに隠れた仲間を探しながら、お菓子を集めましょう。',module:{css:'../css/v127-halloween.css?v=150',js:'../js/features/halloween-event.js?v=150',global:'RinchanHalloweenEvent'} },
    { month:11,key:'harvest',icon:'🍠',title:'秋の大収穫祭',startDay:1,endDay:30,individualTarget:100000,theme:'歩いて秋の実りを集める',collectible:'木の実',participationBadge:'収穫祭参加',achievementBadge:'実りのウォーカー',text:'みんなの歩みで、杜に秋の実りを増やしましょう。' },
    { month:12,key:'christmas',icon:'🎄',title:'クリスマスウォーク',startDay:1,endDay:31,individualTarget:110000,theme:'歩いてツリーを飾る',collectible:'オーナメント',participationBadge:'クリスマス参加',achievementBadge:'聖夜ウォーカー',text:'一歩ごとに飾りが増え、杜のクリスマスツリーが完成していきます。' }
  ];

  function eventForDate(date) {
    const d = date || new Date();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return EVENTS.find(event => event.month === month && day >= event.startDay && day <= event.endDay) || { key:'normal', icon:'🌳', title:'今日の杜', text:'季節と時間に合わせて、杜の景色が変わります。' };
  }

  return { VERSION, EVENTS, eventForDate };
})();
window.RinchanAnnualEventCatalog = RinchanAnnualEventCatalog;
