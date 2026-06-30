# RinchanMori v0.9.24

みんなで育てる、健康と笑顔の杜。

## v0.9.24 内容

- ありがとう欄の表示を調整し、送り主名とありがとう項目をバランスよく表示
- マイページの健康宣言・今週の目標の編集ボタンを、丸い編集アイコンへ変更
- 通信ページのお知らせで、未読表示と確認ボタンを横並びに整理
- ホームを含む各ページの横はみ出しを抑止し、縦スクロール中心の表示へ調整
- 下部メニューバーを安全領域込みで固定し、余白を圧縮
- `css/v128-mobile-polish.css` を追加
- `js/v113-mypage-thanks.js` を更新
- ホーム・杜・歩数記録・通信・マイページのキャッシュバージョンを `v0924` に更新

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