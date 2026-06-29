# RinchanMori v0.2.2

みんなで育てる、健康と笑顔の杜。

## v0.2.2 内容

- Apps Script バックエンド追加
- Google Sheets 自動初期化対応
- `saveUser` 完成
- `saveActivity` 完成
- `users` / `activities` / `logs` シート対応
- GitHub Pages から Apps Script Web アプリへ保存
- 初回登録データ保存
- 活動記録データ保存

## 構成

```text
.
├── index.html
├── pages/
├── css/
├── js/
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

`js/config.js` に Apps Script の Web アプリ URL を設定します。

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

### ログ

処理結果は `logs` シートに保存します。
