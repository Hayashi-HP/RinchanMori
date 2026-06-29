# RinchanMori v0.9.11

みんなで育てる、健康と笑顔の杜。

## v0.9.11 内容

- ホーム右上のポストアイコンと下部メニューの通信アイコンを `📬` に統一
- 通信ページの下部メニューも `📬 通信` に統一
- 杜・歩数記録・マイページ・管理画面の下部メニューも `📬 通信` に統一
- `v051-auth.js` のナビゲーション自動補正も `📬 通信` に統一
- GitHub Pages のキャッシュ対策として関連画面の読み込みバージョンを `v0911` に更新

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
│   ├── v098-hotfix.css
│   ├── v099-ui-fixes.css
│   └── v100-news-ui.css
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── config.js
│   ├── v051-auth.js
│   ├── v051-news.js
│   ├── v060-growth.js
│   ├── v071-mori-map.js
│   ├── v078-steps-chart.js
│   ├── v094-rinchan-guide.js
│   └── v099-mypage-modal.js
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
- ありがとう送信数は端末内に即時保存し、杜画面と通信画面で反映します
- 健康宣言・今週の目標は端末内へ即時保存し、Apps Script にも保存します

## GitHub Pages

通信アイコンは全画面で `📬` に統一します。
