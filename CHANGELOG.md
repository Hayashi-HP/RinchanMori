# CHANGELOG

## v1.4.24
- `css/v128-mobile-polish.css` を更新し、Android Chromeのスクロールと固定フッター重なりを再修正
- `.app` の下余白を拡大し、固定フッター下までスクロールできるように調整
- `.app::after` を復活させ、下部に安全なスクロール余白を追加
- `.nav` の高さ、背景、重なり順、表示位置を再調整
- `pages/mypage.html` のインラインCSSにもチャレンジカード左右余白と下余白を明示
- ホーム、杜、歩数記録、通信、パスポート画面のキャッシュ番号を `164` に更新
- READMEをv1.4.24へ更新

## v1.4.23
- `css/v132-passport.css` を更新し、パスポート内の3つのチャレンジカードの左右余白を他セクションと統一
- `passport-challenge-stack` に `width: calc(100% - 32px)`、`max-width: 398px`、`margin: 14px auto 0` を指定
- 月間チャレンジ、部署チャレンジ、病院全体チャレンジを同じカード幅に統一
- `pages/mypage.html` のキャッシュ番号を `163` に更新
- READMEをv1.4.23へ更新

## v1.4.22
- `js/features/rinchan-passport-render.js` を更新し、イベント参加欄の未参加表示を説明型に変更
- 未参加時の `🌳 これから参加` 表示を廃止
- 未参加時は `まだ参加したイベントはありません` と表示
- `七夕・夏祭りなどに参加すると、ここに参加バッジが表示されます。` の説明文を追加
- イベント参加欄の補足として `季節イベントに参加すると、記念バッジとして残ります。` を追加
- `css/v132-passport.css` に未参加メッセージ用CSSを追加
- `pages/mypage.html` のキャッシュ番号を `162` に更新
- READMEをv1.4.22へ更新

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
