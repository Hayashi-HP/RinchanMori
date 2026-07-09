# CHANGELOG

## v1.4.10
- `apps-script/Code.gs` に `testUserReadsManual()` を追加
- Apps Scriptエディタ上で `user_reads` 保存処理を単体テストできるようにした
- `testUserReadsManual()` 実行時に、テスト用のお知らせ既読IDと花受け取りIDを `user_reads` に保存するようにした
- `apps-script/Config.gs` の `VERSION` を `v1.4.10` に更新
- `APPS_SCRIPT_DEPLOY_CHECKLIST.md` を v1.4.10 手順へ更新
- READMEをv1.4.10へ更新

## v1.4.9
- `pages/diagnostics.html` にサーバー確認カードを追加
- `js/features/diagnostics.js` に `checkServer()` を追加
- 診断画面からApps Scriptの応答バージョンを確認できるようにした
- `getUserState` の応答、`userReads`、`readNewsIds`、`readThanksFlowerIds` の有無と件数を診断画面で確認できるようにした
- 診断画面のキャッシュ番号を `149` に更新
- `APPS_SCRIPT_DEPLOY_CHECKLIST.md` を追加
- READMEをv1.4.9へ更新

## v1.4.8
- `apps-script/UserReads.gs` を追加
- `user_reads` シートへお知らせ既読IDと花受け取りIDを保存する関数を追加
- `getUserReadState()` / `markUserRead()` / `markNewsRead()` / `markThanksRead()` を追加
- クライアントから送られた既読IDリストとサーバー既読IDリストを合算して保存
- `apps-script/Config.gs` の `VERSION` を `v1.4.8` に更新
- READMEをv1.4.8へ更新

## v1.4.7
- `js/features/news.js` を更新し、曜日配列に抜けていた「木」を追加
- お知らせ既読IDをローカル値とサーバー値の合算で扱うように修正
- 確認ボタン押下時に `markNewsRead` をサーバーへ送るように修正
- `js/core/sync.js` を更新し、同期時に既読状態を上書きせず合算するように変更
- 自分宛の花判定から公開用ありがとうタイムラインを除外
- `js/features/thanks-home-notice.js` を更新し、ホーム花通知を未受け取りの自分宛だけに限定
- `index.html` と `pages/news.html` のキャッシュ番号を `147` に更新
- READMEをv1.4.7へ更新

## v1.4.6
- `js/features/activity.js` を更新し、歩数保存payloadで `employeeId` を保持するよう修正
- `normalizeActivity()` が `participantId` / `employeeId` / `id` を同一社員番号で保持するように変更
- `js/core/offline-queue.js` を更新し、既存の未送信キュー再送時にも `employeeId` を自動補完するよう修正
- `saveActivity` / `deleteActivity` の再送payloadを安全化
- 歩数記録画面と診断画面のキャッシュ番号を `146` に更新
- READMEをv1.4.6へ更新

## v1.4.5
- 診断画面に未送信キュー詳細カードを追加
- 未送信データの `action` / 日付 / 歩数 / 理由 / retry回数 / payload を画面で確認できるようにした
- 診断画面から未送信キューを再送できるボタンを追加
- 壊れた古い未送信キューを端末から破棄できるボタンを追加
- `js/features/diagnostics.js` のバージョンを `v1.4.5` に更新
- `pages/diagnostics.html` のキャッシュ番号を `145` に更新
- READMEをv1.4.5へ更新

## v1.4.4
- `rinchanQueueFlushing` が残留した場合に、自動で古いロックを解除する処理を追加
- 旧形式のロック値 `1` は古いロックとして扱い、再送を止めないように修正
- 未送信キューのロック値をISO時刻で保存し、30秒超過時は stale lock として解除
- `js/core/offline-queue.js` のバージョンを `v1.4.4` に更新
- 管理画面、診断画面、歩数記録画面、マイページのキャッシュ番号を `144` に更新
- 管理画面と診断画面の表示バージョンを `v1.4.4` に更新
- READMEをv1.4.4へ更新

## v1.4.3
- `js/core/api.js` を更新し、API応答を安全な形へ正規化
- 空レスポンス、JSON不正、ネットワーク失敗時でも `reason` / `error` / `msg` / `message` を必ず返すように修正
- `js/core/offline-queue.js` を更新し、未送信キュー再送時の空応答・例外・古いAPI関数経由の応答を安全化
- `response.msg` 系の端末JavaScriptエラー対策を実施
- `pages/mypage.html` のキャッシュ番号を `143` に更新
- 既存の未送信キューが残っていても、再送処理で画面が落ちないように調整
- READMEをv1.4.3へ更新

## v1.4.2
- パスポート画面のチャレンジ表示順を整理
- 月間チャレンジ、部署チャレンジ、病院全体チャレンジを同一パスポート内に表示
- v1.4.1で抜けていた部署チャレンジ表示枠を復旧
- `department-challenge-engine.js` / `department-challenge-render.js` の読み込みをマイページへ復旧
- マイページ関連ファイルのキャッシュ番号を `142` に更新
- READMEを最新実装状態へ更新

## v1.4.1
- `js/features/hospital-challenge-render.js` を追加
- 病院全体チャレンジをりんちゃんパスポートへ接続
- 病院全体の今月歩数、目標歩数、達成率、進捗バー、メッセージを表示
- マイページ関連ファイルのキャッシュ番号を `141` に更新

## v1.4.0
- `js/features/hospital-challenge-engine.js` を追加
- 病院全体チャレンジの基礎エンジンを追加
- 今月の病院全体歩数を集計する仕組みを追加
- 病院全体の月間目標を2,000万歩に設定
- サーバー同期後の全体歩数取得に対応

## v1.3.9
- `js/features/department-challenge-engine.js` を追加
- `js/features/department-challenge-render.js` を追加
- `css/v139-department-challenge.css` を追加
- 部署チャレンジをりんちゃんパスポートへ接続
- 所属部署ごとの今月歩数、目標歩数、達成率、進捗バー、メッセージを表示
