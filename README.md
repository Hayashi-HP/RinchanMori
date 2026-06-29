# RinchanMori v0.5.2

みんなで育てる、健康と笑顔の杜。

## v0.5.2 内容

- 全画面の読み込みバージョンを `v052` に統一
- 社員番号をユーザーIDとして利用
- 初回登録に社員番号・メールアドレス・誕生日4桁を追加
- ログイン画面を追加
- 未登録ユーザーの歩数記録をブロック
- 未登録ユーザーのマイページ編集をブロック
- 下部メニューを `👟 歩数記録` に統一
- お知らせの未読・既読管理を追加
- ホーム右上ベルに未読バッジを追加

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
│   └── ui-v042.css
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── config.js
│   ├── v051-auth.js
│   └── v051-news.js
├── apps-script/
│   ├── Code.gs
│   └── appsscript.json
└── docs/
    └── google-sheets.md
```

## API URL 設定

`js/config.js` に Apps Script の Web アプリ URLを設定します。

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
