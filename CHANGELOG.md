# CHANGELOG

## v1.4.16
- `js/features/monthly-challenge-engine.js` を更新し、月間チャレンジが0歩になる問題を修正
- 古い `rinchanSteps` だけでなく、現在使っている `rinchanActivities` / `rinchanUserActivities` / `rinchanAllActivities` を集計元に追加
- 社員番号で本人分の当月歩数だけを抽出
- 活動IDまたは社員番号・日付ベースで重複行を除外
- `pages/mypage.html` のキャッシュ番号を `156` に更新
- READMEをv1.4.16へ更新

## v1.4.15
- `pages/mypage.html` を更新し、月間チャレンジ・部署チャレンジ・病院全体チャレンジの表示枠を `rinchanPassportSection` の外へ移動
- `rinchan-passport-render.js` がパスポート本体を再描画しても、チャレンジ表示枠が消えない構成へ変更
- パスポート画面のキャッシュ番号を `155` に更新
- READMEをv1.4.15へ更新

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
