# RinchanMori v0.9.32

みんなで育てる、健康と笑顔の杜。

## v0.9.32 内容

- 杜ページの部署カード配置を調整し、カード同士の重なりを解消
- 長い部署名を自然に改行する表示へ変更
- 部署詳細カードの注意文を読みやすい2行表示へ変更
- 登録メンバーなしの文言の改行バランスを調整
- 杜ページのキャッシュバージョンを `v0932` に更新
- `css/v113-mori-groups.css` を更新
- `js/v132-mori-polish.js` を追加

## 構成

```text
.
├── assets/
│   └── rinchan-face.svg
├── pages/
│   ├── activity.html
│   ├── login.html
│   ├── mori.html
│   ├── mypage.html
│   ├── news.html
│   ├── register.html
│   └── welcome.html
├── css/
│   ├── v100-news-ui.css
│   ├── v102-activity-tools.css
│   ├── v102-rinchan-face.css
│   ├── v113-mori-groups.css
│   ├── v113-mypage-thanks.css
│   └── v128-mobile-polish.css
├── js/
│   ├── v051-news.js
│   ├── v071-mori-map.js
│   ├── v102-activity-tools.js
│   ├── v113-mypage-thanks.js
│   └── v132-mori-polish.js
├── apps-script/
│   └── Code.gs
├── index.html
├── README.md
└── CHANGELOG.md
```

## 画面設計

- ホームページ：りんちゃんの挨拶、今日の一歩、歩数記録導線、週間歩数、あなたの木
- 杜ページ：部署・グループ単位の木を表示
- 部署カード：氏名・ニックネーム・所属を確認してからありがとう送信
- 通信ページ：全体向けの出来事、部署単位のありがとう、お知らせ
- マイページ：本人が受け取ったありがとう、送り主、健康宣言、目標、最近の活動

## Apps Script 注意

GitHub の `apps-script/Code.gs` は更新済みです。Google Apps Script 側には自動反映されないため、スプレッドシート保存・ありがとう保存・歩数削除を本番反映するには、Google Apps Script の `Code.gs` へ同じ内容を反映して Web アプリを再デプロイしてください。
