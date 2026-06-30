# RinchanMori v0.9.28

みんなで育てる、健康と笑顔の杜。

## v0.9.28 内容

- ログイン画面の説明文を短くし、2行目に「します。」だけが残らないように調整
- ログイン画面の社員番号プレースホルダーを7桁例へ変更
- 初回登録画面の社員番号プレースホルダーを7桁例へ変更
- ログイン・初回登録のキャッシュバージョンを `v0928` に更新

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
│   └── v113-mypage-thanks.js
├── apps-script/
│   └── Code.gs
├── index.html
├── README.md
└── CHANGELOG.md
```

## 画面設計

- 杜ページ：部署・グループ単位の木を表示
- 部署カード：氏名・ニックネーム・所属を確認してからありがとう送信
- 通信ページ：全体向けの出来事、部署単位のありがとう、お知らせ
- マイページ：本人が受け取ったありがとう、送り主、健康宣言、目標、最近の活動

## Apps Script 注意

GitHub の `apps-script/Code.gs` は更新済みです。Google Apps Script 側には自動反映されないため、スプレッドシート保存・ありがとう保存・歩数削除を本番反映するには、Google Apps Script の `Code.gs` へ同じ内容を反映して Web アプリを再デプロイしてください。
