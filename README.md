# RinchanMori v0.9.12

みんなで育てる、健康と笑顔の杜。

## v0.9.12 内容

- りんちゃんの顔を指定画像ベースの `assets/rinchan-face.svg` に変更
- ホーム・ログイン・参加登録・歩数記録・ようこそ画面のりんちゃん表示を統一
- 通信ページ「今日の杜」の杜レベル表示を整理し、PCでも枠内に収まるように修正
- 「葉っぱ◯枚」の抽象表現を削除し、累計歩数・今日の記録・今日の歩数・ありがとう・活動回数に整理
- 「ありがとうの出来事」の謎コメントを削除し、「最近届いたありがとう」に変更
- 通信ページに「お知らせ」欄を復活
- 通信ページを開いた時点で未読バッジを既読化する処理を追加
- 歩数記録の修正・削除機能を追加
- Apps Script に `deleteActivity` を追加し、スプレッドシート側の削除にも対応
- GitHub Pages のキャッシュ対策として関連画面の読み込みバージョンを `v0912` に更新

## 構成

```text
.
├── assets/
│   └── rinchan-face.svg
├── pages/
│   ├── activity.html
│   ├── login.html
│   ├── news.html
│   ├── register.html
│   └── welcome.html
├── css/
│   ├── v100-news-ui.css
│   ├── v102-activity-tools.css
│   └── v102-rinchan-face.css
├── js/
│   ├── v051-news.js
│   └── v102-activity-tools.js
├── apps-script/
│   └── Code.gs
├── index.html
├── README.md
└── CHANGELOG.md
```

## スプレッドシート管理について

今回の修正・削除対応で、スプレッドシート側はまず `activities` の更新・削除に対応しました。
将来的に、運用管理用に `settings` / `news` / `badges` などのシートを追加すれば、アプリの文言・お知らせ・バッジ条件をコード変更なしで管理できます。
