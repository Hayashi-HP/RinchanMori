# RinchanMori v0.9.13

みんなで育てる、健康と笑顔の杜。

## v0.9.13 内容

- 杜マップを個人配置から部署・グループ単位の木表示へ変更
- 100人規模でも画面が破綻しないよう、個人一覧は部署カード内に分離
- 個人へありがとうを送る時は、部署カード内の個人一覧から選択する方式に変更
- 個人宛てのありがとう画面では、伏せ字ではなくニックネームまたは氏名を表示
- 通信ページのありがとうは、個人名を出さず部署単位の出来事として表示
- マイページに「もらったありがとう」を追加し、本人には誰から届いたか分かる設計に変更
- 未読のお知らせは、通信ページを開いただけでは既読にせず、「確認した」ボタンで既読化
- 歩数修正画面の保存ボタンを「保存中...」表示に変更し、二重押しを防止
- Apps Script に `thanks` シート、`saveThanks`、`myThanks` を追加
- りんちゃん顔画像はアップロード画像をデータURIでそのまま表示
- GitHub Pages のキャッシュ対策として関連画面の読み込みバージョンを `v0913` に更新

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
- 部署カード：部署内の個人一覧からありがとう送信
- 通信ページ：全体向けの出来事、部署単位のありがとう、お知らせ
- マイページ：本人が受け取ったありがとう、健康宣言、目標、最近の活動

## Apps Script 注意

GitHub の `apps-script/Code.gs` は更新済みです。Google Apps Script 側には自動反映されないため、スプレッドシート保存・ありがとう保存・歩数削除を本番反映するには、Google Apps Script の `Code.gs` へ同じ内容を反映して Web アプリを再デプロイしてください。
