# RinchanMori v0.9.23

みんなで育てる、健康と笑顔の杜。

## v0.9.23 内容

- ありがとう送信時の相手表示を、氏名・ニックネーム・所属・社員番号が分かる表示へ変更
- 送信前の確認画面で、送る相手を明確に表示
- マイページの「もらったありがとう」に、誰から届いたかを表示
- 通信ページでは従来どおり個人名を出さず、部署単位の出来事として表示
- `js/v071-mori-map.js` を更新
- `js/v113-mypage-thanks.js` を更新
- `css/v113-mori-groups.css` を更新
- 杜ページ・マイページのキャッシュバージョンを `v0923` に更新

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
│   └── v113-mypage-thanks.css
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
