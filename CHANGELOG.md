# CHANGELOG

## v1.4.27
- `js/features/passport-layout-fix.js` を追加し、パスポート画面のチャレンジカード左右余白をJSで最終補正
- 描画後の月間チャレンジ、部署チャレンジ、病院全体チャレンジに `width: calc(100% - 32px)` と `max-width: 398px` を直接指定
- `css/v128-mobile-polish.css` を更新し、固定フッター `position: fixed` を解除
- ナビゲーションをページ末尾の通常配置カード型へ変更し、Android Chromeのスクロールを優先
- ホーム、杜、歩数記録、通信、パスポート画面のキャッシュ番号を `166` に更新
- READMEをv1.4.27へ更新

## v1.4.26
- `css/v132-passport.css` を更新し、チャレンジカードの左右余白修正方式を変更
- `passport-challenge-stack` を `display: contents` に変更し、外枠の幅指定を廃止
- 月間チャレンジ、部署チャレンジ、病院全体チャレンジの各カード自身に `margin: 0 16px 14px` を直接指定
- `pages/mypage.html` のインラインCSSにも同じ指定を追加
- `pages/mypage.html` のキャッシュ番号を `165` に更新
- READMEをv1.4.26へ更新

## v1.4.25
- `apps-script/Router.gs` を更新し、iPhoneショートカットの `saveHealthSteps` を受け付けるようにした
- `saveHealthSteps` を `saveActivity` の互換actionとして処理
- ショートカット側をすぐ直せない場合でも、従来のショートカットから歩数登録できるようにした
- `writeLog` には元のaction `saveHealthSteps` を残し、互換処理であることが分かるようにした
- API応答には `normalizedAction: saveActivity` を返すようにした
- READMEをv1.4.25へ更新

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
