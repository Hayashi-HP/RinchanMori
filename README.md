# RinchanMori v0.4.2

みんなで育てる、健康と笑顔の杜。

## v0.4.2 内容

- ホームの「活動を記録する」ボタンを1行表示に修正
- ホームの「今日も30秒」表示を削除
- ホームボタンのアイコンを文字の左先頭へ配置
- 初回登録画面の「登録する」ボタンを丸型に統一
- UIブラッシュアップ用CSS `css/ui-v042.css` を追加

## 構成

```text
.
├── index.html
├── pages/
│   ├── activity.html
│   ├── admin.html
│   ├── mori.html
│   ├── mypage.html
│   ├── news.html
│   └── register.html
├── css/
│   ├── style.css
│   └── ui-v042.css
├── js/
│   ├── admin.js
│   ├── app.js
│   └── config.js
├── apps-script/
│   ├── Code.gs
│   └── appsscript.json
└── docs/
    └── google-sheets.md
```

## GitHub Pages 設定

GitHub Pages は `main` ブランチのルートを公開します。

## API URL 設定

`js/config.js` に Apps Script の Web アプリ URLを設定します。

```js
const RINCHAN_CONFIG = {
  API_URL: "https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec"
};
```

## Google Sheets / Apps Script

設定手順は `docs/google-sheets.md` を参照してください。

## データ保存

### 初回登録

`saveUser` で `users` シートに保存します。

### 活動記録

`saveActivity` で `activities` シートに保存します。

### 杜ダッシュボード

`dashboard` でランキング、参加者数、活動数、総歩数を取得します。

### 管理者画面

`adminStats` で部署別集計、月別集計、CSV出力用データを取得します。

管理者画面：`pages/admin.html`
