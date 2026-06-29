# RinchanMori v0.4.1

みんなで育てる、健康と笑顔の杜。

## v0.4.1 内容

- 管理者画面UI追加
- CSVダウンロード追加
- 部署別ランキング表示
- 月別集計表示
- 個人ランキング管理表示
- 管理API `adminStats` 対応
- GitHub Pages 対応
- Apps Script + Google Sheets 保存対応

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
│   └── style.css
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
