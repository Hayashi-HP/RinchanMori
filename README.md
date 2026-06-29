# RinchanMori v0.9.9

みんなで育てる、健康と笑顔の杜。

## v0.9.9 内容

- 杜ページの上部タイトルバーを不透明・高優先表示に修正
- 杜の木アイコンがスクロール時にタイトル上へ透けて見える問題を修正
- 戻る矢印・更新ボタン・閉じるボタンのサイズ感を調整
- 杜の木カードの `×` を小さめ・細めに調整し、戻る矢印とのバランスを改善
- マイページの健康宣言を保存後すぐ表示へ反映
- マイページの今週の目標を保存後すぐ表示へ反映
- 健康宣言・今週の目標・プロフィール編集をポップアップ型に統一
- マイページ保存後の再読み込みをやめ、画面内で即時反映
- `css/v099-ui-fixes.css` を追加
- `js/v099-mypage-modal.js` を追加
- GitHub Pages のキャッシュ対策として杜ページ・マイページの読み込みバージョンを `v099` に更新

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
│   └── v099-ui-fixes.css
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
- ありがとう送信数は端末内に即時保存し、杜画面で反映します
- 健康宣言・今週の目標は端末内へ即時保存し、Apps Script にも保存します

## GitHub Pages

杜ページは `pages/mori.html`、マイページは `pages/mypage.html` です。

v0.9.9 では、以下を追加読み込みします。

```html
<link rel="stylesheet" href="../css/v099-ui-fixes.css?v=099">
<script src="../js/v099-mypage-modal.js?v=099"></script>
```
