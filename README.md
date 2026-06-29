# RinchanMori v0.9.8

みんなで育てる、健康と笑顔の杜。

## v0.9.8 内容

- 杜の木カードの「ありがとうを届ける」ボタンを修正
- インライン `onclick` 依存をやめ、描画後にクリックイベントを直接設定
- ありがとう確認シートをスマホで見やすく表示
- ありがとう送信後に件数更新・送信済み表示・トースト表示・ハート演出を実行
- 杜の木カード左上の閉じるボタンを大型化
- ありがとう確認シート左上の閉じるボタンも大型化
- GitHub Pages のキャッシュ対策として杜ページの読み込みバージョンを `v098` に更新

## 構成

```text
.
├── index.html
├── pages/
│   ├── activity.html
│   ├── admin.html
│   ├── login.html
│   ├── mori.html
│   ├── mypage.html
│   ├── news.html
│   ├── register.html
│   └── welcome.html
├── css/
│   ├── style.css
│   ├── ui-v042.css
│   ├── v081-fixes.css
│   ├── v094-guide.css
│   └── v098-hotfix.css
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── config.js
│   ├── v051-auth.js
│   ├── v051-news.js
│   ├── v060-growth.js
│   ├── v071-mori-map.js
│   ├── v078-steps-chart.js
│   └── v094-rinchan-guide.js
├── apps-script/
│   ├── Code.gs
│   └── appsscript.json
└── docs/
    └── google-sheets.md
```

## API URL 設定

`js/config.js` に Apps Script の Web アプリ URL を設定します。

```js
const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec"
};
```

## ユーザー管理

社員番号を主キーにします。

- 初回登録：社員番号・氏名・所属・メールアドレス・誕生日4桁
- ログイン：社員番号・誕生日4桁
- 歩数記録：登録済みユーザーのみ利用可能

## データ保存

- `users`: 職員登録情報
- `activities`: 歩数記録
- `logs`: APIログ
- ありがとう送信数は端末内に即時保存し、杜画面で反映します

## GitHub Pages

杜ページは `pages/mori.html` です。

v0.9.8 では、以下を追加読み込みします。

```html
<link rel="stylesheet" href="../css/v098-hotfix.css?v=098">
<script src="../js/v071-mori-map.js?v=098"></script>
```
