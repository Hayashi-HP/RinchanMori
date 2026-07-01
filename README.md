# RinchanMori v0.9.56

みんなで育てる、健康と笑顔の杜。

## v0.9.56 内容

- Apps Script を機能別ファイル構成へ分割
- 同期エンジンを「即表示＋裏同期」方式へ整理
- 画面下に最終同期表示を追加
- 同期中・同期済み・通信失敗の状態表示を追加
- どの端末でログインしても、スプレッドシート側から本人データを復元する方針に統一
- 通常利用ではログイン状態を保持し、アプリ起動時・復帰時に裏で最新化

## Apps Script 構成

Google Apps Script 側にも、以下のファイル名で分けて作成してください。

```text
apps-script/
├── Code.gs       # API入口 doGet / doPost
├── Config.gs     # 定数・初期部署
├── Common.gs     # 共通関数
├── Setup.gs      # シート初期化・部署マスタ
├── User.gs       # ログイン・プロフィール・本人状態
├── Activity.gs   # 歩数登録・削除・履歴
├── Thanks.gs     # ありがとう保存・受信・送信・タイムライン
├── News.gs       # 通信既読
└── Admin.gs      # 管理画面・ランキング集計
```

## Apps Script 反映手順

1. Google スプレッドシートを開く
2. 拡張機能 → Apps Script を開く
3. 既存の `Code.gs` を GitHub の `apps-script/Code.gs` の内容に置き換える
4. `Config.gs`、`Common.gs`、`Setup.gs`、`User.gs`、`Activity.gs`、`Thanks.gs`、`News.gs`、`Admin.gs` を新規作成して、それぞれ GitHub の同名ファイルを貼り付ける
5. `setupProjectManual()` を一度実行
6. Web アプリを再デプロイ

## 同期方針

りんちゃんの杜では、正式データはスプレッドシートを正とします。

通常利用では、スマホ内のデータをキャッシュとして使い、画面はすぐ表示します。その後、裏側で Apps Script に接続し、スプレッドシート側の最新データで画面を更新します。

```text
アプリを開く
↓
手元キャッシュで即表示
↓
裏でサーバー同期
↓
最新データで必要箇所だけ更新
```

ログアウト後に再ログインした場合も、`getUserState` により以下を復元します。

- プロフィール
- 歩数履歴
- 受け取ったありがとう
- 送ったありがとう
- 通信タイムライン
- お知らせ既読状態
- ありがとう件数

## 画面設計

- ホーム：りんちゃんの挨拶、今日の一歩、歩数記録導線、週間歩数、あなたの木
- 杜：部署・グループ単位の木、個人へのありがとう送信
- 歩数記録：歩数保存、直近記録の修正・削除
- 通信：今日の杜、ありがとうの広がり、お知らせ、グループニュース
- マイページ：あなたの木、プロフィール、バッジ、ありがとう、最近の活動、目標、健康宣言
- 管理画面：利用状況、部署別集計、CSV確認

## 今後の整理方針

JavaScript と CSS も、v番号付きファイルから役割名ベースへ段階的に整理します。

```text
js/
├── common.js
├── auth.js
├── activity.js
├── thanks.js
├── news.js
├── mypage.js
├── mori.js
└── admin.js
```

```text
css/
├── base.css
├── layout.css
├── components.css
├── pages.css
└── mobile.css
```
