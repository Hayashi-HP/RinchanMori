# RinchanMori v0.9.61

みんなで育てる、健康と笑顔の杜。

## v0.9.61 内容

- JavaScript を `core/` と `features/` の役割別構成へ移行
- `core/storage.js`、`core/api.js`、`core/sync.js`、`core/offline-queue.js` を追加
- `features/auth.js`、`features/activity.js`、`features/thanks.js`、`features/news.js`、`features/mori.js`、`features/mypage.js`、`features/admin.js` を追加
- ホーム、ログイン、初回登録、歩数記録、マイページ、通信、杜、管理画面を v0.9.61 に更新
- 主要画面を新しい `core/` と `features/` 読み込み構成へ切り替え
- 旧 `v135-sync.js`、`v160-offline-queue.js` 相当の同期・未送信再送機能を `core/` 側へ移行
- キャッシュバージョンを `0961` に統一

## JavaScript 構成

```text
js/
├── core/
│   ├── storage.js          # localStorage、JSON安全処理、端末ID、ユーザーデータ管理
│   ├── api.js              # Apps Script API 通信
│   ├── sync.js             # 差分同期、同期状態表示、サーバー状態反映
│   └── offline-queue.js    # 通信失敗時の未送信保存、自動再送
│
└── features/
    ├── auth.js             # ログイン、初回登録、ログアウト、プロフィール保存
    ├── activity.js         # 歩数保存、編集、削除、最近の記録
    ├── thanks.js           # ありがとう送信、受信、集計、タイムライン
    ├── news.js             # 通信、お知らせ、既読、通知バッジ
    ├── mori.js             # 杜、部署、木、杜レベル
    ├── mypage.js           # マイページ、バッジ、継続、目標表示
    └── admin.js            # 管理画面、集計、利用者一覧
```

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

保存系APIは、保存が成功したあと `getUserState` 相当の最新状態を返します。画面側はその `state` を受け取り、以下をまとめて更新します。

- プロフィール
- 歩数履歴
- 受け取ったありがとう
- 送ったありがとう
- 通信タイムライン
- お知らせ既読状態
- ありがとう件数

ログアウト後に再ログインした場合も、`loginUser` と `getUserState` により同じ内容を復元します。

## 画面設計

- ホーム：りんちゃんの挨拶、今日の一歩、歩数記録導線、週間歩数、あなたの木
- 杜：部署・グループ単位の木、個人へのありがとう送信
- 歩数記録：歩数保存、直近記録の修正・削除
- 通信：今日の杜、ありがとうの広がり、お知らせ、グループニュース
- マイページ：あなたの木、プロフィール、バッジ、ありがとう、最近の活動、目標、健康宣言
- 管理画面：利用状況、部署別集計、CSV確認

## 今後の整理方針

- 旧 `v***.js` の参照が残っていないか確認
- 不要になった旧ファイルを段階的に legacy 扱いへ移動または削除
- CSS も共通・画面別へ整理
- v1.0 リリース候補として動作確認を進める
