# CHANGELOG

## v1.5.10
- 七夕イベントを背景演出だけに簡素化
- 短冊入力、願い表示、吹き出しUIを削除
- 夜空、星、うっすらした天の川、竹1本だけを表示
- 七夕レイヤーを部署カードより背面へ移し、部署名・歩数・人数を隠さない構造へ変更
- 通常の花・ちょうちょ・小鳥は従来どおり表示
- 七夕の見どころ文を「今日は七夕。みんなの願いが星空へ届きますように。」へ変更
- `annual-event-catalog.js` と `event-loader.js` の七夕アセットを `v=160` へ更新
- `pages/mori.html` のイベント関連キャッシュを `190` へ更新
- READMEをv1.5.10へ更新

## v1.5.9
- 七夕イベントのMutationObserverを再接続型へ変更し、部署マップ再描画後も七夕レイヤーを維持
- 2.5秒間隔の軽量再確認を追加し、数秒後に通常表示へ戻る問題を防止
- 七夕の竹・星・短冊をカード中央に重ねず、マップ外周中心の演出へ再設計
- 通常の花・ちょうちょ・小鳥を部署カードより下層へ整理
- 短冊入力エリアだけを操作可能な前面レイヤーとして維持
- `annual-event-catalog.js` と `event-loader.js` の七夕アセットを `v=159` へ更新
- `pages/mori.html` のイベント関連キャッシュを `189` へ更新
- READMEをv1.5.9へ更新

## v1.5.0
- Android Chromeのスクロール領域を再設計し、`html` / `body` / `.app` の高さ・overflow・touch-actionの競合を解消
- Androidだけナビゲーションを通常配置へ切り替える処理を廃止し、全端末で固定フッターへ統一
- iPhoneのホーム、杜、通信、パスポートで固定フッター下部が透けないよう、safe-areaを含む背景レイヤーを追加
- パスポート画面の固定フッターを他の主要画面と同じ位置・高さ・余白へ統一
- `css/v150-mobile-foundation.css` を追加し、モバイルレイアウトの最終上書きを一元化
- `js/core/device-class.js` から共通モバイルCSSを読み込むよう変更
- `css/v125-tanabata.css` の演出レイヤーを部署カードより前面へ変更
- `js/features/tanabata-event.js` で七夕イベントクラスと `data-event-key` を再描画時にも維持
- `js/features/annual-event-catalog.js` をv1.5.0へ更新し、イベントモジュールのキャッシュ番号を `150` に変更
- READMEをv1.5.0へ更新

## v1.4.36
- `js/features/mori-world.js` を更新し、イベント表示中は `杜の見どころ` を通常表示で上書きしないように修正
- `moriMap.dataset.eventKey` または `event-calendar-engine` の現在イベントが `normal` 以外の場合、`renderHighlight()` が処理を抜けるようにした
- 七夕イベント表示が数秒後に「今日の杜」へ戻る問題を修正
- `pages/mori.html` のキャッシュ番号を `176` に更新
- READMEをv1.4.36へ更新

## v1.4.35
- 「今日はどこ？」を凍結し、杜画面から表示カード・CSS・JS読み込みを外した
- `js/features/daily-rinchan-hunt.js` と `css/v134-daily-rinchan-hunt.css` は削除せず保留
- `js/features/annual-event-catalog.js` を追加し、12か月分のイベント定義を共通データ化
- `js/features/event-calendar-engine.js` を年間イベントカタログ参照方式へ移行
- `js/features/event-loader.js` を年間イベントカタログ内の `module` 定義から動的読み込みできる形へ変更
- `pages/mori.html` で `annual-event-catalog.js` を `event-calendar-engine.js` より先に読み込むよう接続
- 杜画面のキャッシュ番号を `175` に更新
- READMEをv1.4.35へ更新

## v1.4.29
- チャレンジカードを通常カードと同じ外側余白・内側余白に統一
- `width: calc(100% - 48px)` と `max-width: 382px` 方式を廃止
- 月間チャレンジ、部署チャレンジ、病院全体チャレンジを `margin: 0 16px 14px` に統一
- 月間チャレンジのみ上余白として `margin-top: 14px` を指定
- 各チャレンジカードの内側余白を `padding: 20px` に統一
- `monthly-challenge-render.js` / `department-challenge-render.js` / `hospital-challenge-render.js` の描画側を修正
- `v167-final-layout-override.css` と `pages/mypage.html` のインラインCSSも同じ指定へ更新
- パスポート画面のキャッシュ番号を `169` に更新
- READMEをv1.4.29へ更新

## v1.4.28
- チャレンジカードの左右余白をCSSではなく描画JS本体で固定
- `monthly-challenge-render.js` にカード幅・左右余白の直接指定を追加
- `department-challenge-render.js` にカード幅・左右余白の直接指定を追加
- `hospital-challenge-render.js` にカード幅・左右余白の直接指定を追加
- `css/v167-final-layout-override.css` を追加し、最終上書きCSSを用意

## v1.4.27
- `js/features/passport-layout-fix.js` を追加し、パスポート画面のチャレンジカード左右余白をJSで最終補正
- 描画後の月間チャレンジ、部署チャレンジ、病院全体チャレンジに `width: calc(100% - 32px)` と `max-width: 398px` を直接指定
- `css/v128-mobile-polish.css` を更新し、固定フッター `position: fixed` を解除
- ナビゲーションをページ末尾の通常配置カード型へ変更し、Android Chromeのスクロールを優先
- ホーム、杜、歩数記録、通信、パスポート画面のキャッシュ番号を `166` に更新
- READMEをv1.4.27へ更新