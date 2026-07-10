# CHANGELOG

## v1.4.14
- `js/features/hospital-challenge-engine.js` を更新し、病院全体チャレンジを全員データ優先に修正
- `rinchanAllActivities` / `rinchanAllSteps` / `rinchanStepRecords` から当月の病院全体歩数を集計
- 個人ローカル記録だけを病院全体として扱わないように修正
- `js/features/department-challenge-engine.js` を更新し、部署チャレンジを全員データ優先に修正
- `rinchanMoriMembers` から社員番号ごとの所属部署を補完して部署集計
- 活動IDまたは社員番号・日付ベースで重複行を除外
- `pages/mypage.html` のキャッシュ番号を `154` に更新
- READMEをv1.4.14へ更新

## v1.4.13
- `css/v102-activity-tools.css` を更新し、歩数記録ページの「最近の記録」の余白を調整
- 日付・曜日・歩数が詰まって表示される問題を修正
- `pages/activity.html` のキャッシュ番号を `153` に更新

## v1.4.11
- 画面表示上の「マイページ」を「パスポート」へ統一
- ホーム、杜、歩数記録、通信、管理、診断、パスポート画面のフッター表記を更新
- ホーム花通知の「マイページで受け取れます」を「パスポートで受け取れます」へ変更
- `js/features/rinchan-passport-render.js` を更新し、パスポート内の勤続年数タイルを削除
- `2011-04 / 勤続15年` の表示だけを残す構成へ変更
- 獲得済み一覧を「マイバッジ」、全体一覧を「バッジ図鑑」として区別
- パスポート画面に「獲得したバッジ」見出しを追加
- 主要画面のキャッシュ番号を `151` に更新
- READMEをv1.4.11へ更新

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
