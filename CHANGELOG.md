# CHANGELOG

## v1.4.21
- `css/v1200-mori-world-engine.css` を更新し、杜の成長セクションに進捗バーCSSを追加
- 既にHTMLとJSで用意されていた `moriStatusProgressBar` を見える表示へ調整
- バーの高さ、背景、グラデーション、余白、説明文を整備
- `pages/mori.html` のキャッシュ番号を `161` に更新
- READMEをv1.4.21へ更新

## v1.4.20
- `js/features/monthly-challenge-render.js` を更新し、月間イベント名を残したまま `個人チャレンジ｜今月` を表示
- `js/features/department-challenge-render.js` を更新し、`部署チャレンジ｜今月` を表示
- `js/features/hospital-challenge-render.js` を更新し、`病院全体チャレンジ｜今月` を表示
- 数値ラベルを `あなたの今月歩数` / `部署全体の今月歩数` / `病院全体の今月歩数` へ整理
- `css/v137-monthly-challenge.css` と `css/v139-department-challenge.css` を更新し、対象・期間表示を整形
- `pages/mypage.html` のキャッシュ番号を `160` に更新
- READMEをv1.4.20へ更新

## v1.4.19
- `js/features/forest-summary-fix.js` を更新し、今日判定を `Asia/Tokyo` 固定に変更
- 端末のタイムゾーンやブラウザ差で、今日の記録・今日の歩数がズレる可能性を低減
- ISO時刻の `createdAt` / `savedAt` を日本時間の日付へ変換して判定
- 通信画面の日付表示を日本時間基準へ変更
- 杜画面の全員データ反映時刻を日本時間表示へ変更
- `pages/news.html` と `pages/mori.html` のキャッシュ番号を `159` に更新
- READMEをv1.4.19へ更新

## v1.4.18
- `js/features/forest-summary-fix.js` を追加
- りんちゃん通信の「今日のまとめ」を `rinchanAllActivities` 優先で再計算する補正を追加
- 杜画面の「杜の成長」を `rinchanAllActivities` 優先で再計算する補正を追加
- 古い `rinchanForestSummary` が0を返す場合でも、全員歩数データがある場合はそちらを優先
- 今日の記録数、今日の歩数、累計歩数、ありがとう件数を再計算
- 杜レベル、進捗バー、次レベルまでの歩数を再計算
- `pages/news.html` と `pages/mori.html` のキャッシュ番号を `158` に更新
- READMEをv1.4.18へ更新

## v1.4.17
- `css/v128-mobile-polish.css` を更新し、Android Chromeで全ページの縦スクロールができない問題へ対応
- `html` / `body` に `height:auto`、`overflow-y:auto`、`-webkit-overflow-scrolling:touch` を追加
- `.app` に `min-height:100dvh`、`height:auto`、`overflow-y:visible` を設定
- `body.scroll-lock` / `html.scroll-lock` が残っても縦スクロールできるように保護
- ホーム、杜、歩数記録、通信、パスポート、管理画面のキャッシュ番号を `157` に更新
- READMEをv1.4.17へ更新
