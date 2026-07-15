# CHANGELOG

## v1.5.19
- 管理画面（admin / diagnostics）に未ログイン・一般職員・管理者の 3 状態アクセスガードを実装
- 未ログインは login へ遷移、一般職員は mypage へ遷移し拒否メッセージを表示、管理者のみ管理画面利用可能
- パスポート画面の管理アイコン表示を認可状態に応じて明示制御
- `js/core/api.js` に共通の認証状態取得ヘルパー（participant / isAdminUser / authState）を追加
- 管理系 API の権限拒否処理を `apps-script/Router.gs` の共通関数へ集約し、拒否レスポンス形式を統一
- `js/features/admin.js` を v1.0.35 に更新
- `js/features/diagnostics.js` を v1.4.13 に更新
- `js/core/api.js` を v1.4.4 に更新
- 管理関連ページのキャッシュクエリを更新（admin / diagnostics / mypage）
- `ADMIN_PLAN.md` に確定仕様の実装反映を追記
- README を v1.5.19 に更新

## v1.5.18
- 管理トップを「集計確認 + 各管理機能への入口」の管理ハブとして再構成
- 第1〜第4段階の管理メニューをグループ表示で追加
- 未実装機能は「準備中」表示の非遷移項目として実装し、空画面/404への誤遷移を防止
- 診断画面への導線は利用可能のまま維持
- 既存の集計表示・要対応項目・利用者検索を維持
- `css/v133-admin-hub.css` を追加
- `js/features/admin.js` を v1.0.34 に更新
- README を v1.5.18 に更新

## v1.5.17
- 開発ルール文書 `DEVELOPMENT_RULES.md` を追加
- 回帰テスト基準文書 `TESTLIST.md` を追加
- README を v1.5.17 に更新

## v1.5.16
- 9月イベントとしてお月見イベントを追加し、背景中心の最小構成（大きな月・薄い夜空・すすき・小さなうさぎ）で表示するように実装
- 部署カード・人数・歩数を隠さない構成とし、数秒後に見た目が変わらない安定表示へ統一
- Androidスクロールや共通レイアウトには手を入れず、既存の七夕・夏祭りイベントや他機能に影響しない範囲で追加
- `js/features/moon-event.js` と `css/v131-moon-event.css` を追加
- `annual-event-catalog.js` と `event-loader.js` を v1.5.16 に更新
- `pages/mori.html` のイベント関連キャッシュを `195` に更新
- README を v1.5.16 に更新

## v1.5.14
- 夏祭りイベントを七夕と同じ方針で背景中心の最小構成に整理し、提灯・薄い花火・夏祭りらしい夜空だけを表示するように調整
- 部署カード・人数・歩数を隠さないようにし、数秒後に見た目が変わらない安定表示へ統一
- 既存の花・蝶・小鳥の表示と Android スクロール、共通レイアウトには手を入れず、夏祭り表示だけを最小限で更新
- `css/v126-summer-festival.css` と `js/features/summer-festival-event.js` のキャッシュを更新
- `annual-event-catalog.js` と `event-loader.js` を v1.5.14 に更新
- `pages/mori.html` のイベント関連キャッシュを `193` に更新
- README を v1.5.14 に更新

## v1.5.13
- 七夕イベントを背景演出だけに固定し、部署カード・人数・歩数が隠れないように調整
- 既存の共通CSS読み込みで実ファイルが存在しない `v1050-empty-thanks.css` 参照を除去し、主要5ページのCSS 404 を解消
- 通常の花・蝶・小鳥がカード前面へ一瞬出る挙動を抑制し、再描画時の見た目変化を防止
- 七夕演出を夜空・薄い天の川・少数の星・竹1本だけに整理し、短冊入力・吹き出し・願い表示は使用しない構成へ統一
- Android スクロールや共通レイアウトに影響しないよう、七夕表示のみに限定して修正

## v1.5.12
- Android Chrome と iPhone Safari で全ページがスクロールできるよう、共通レイアウトの高さ・overflow・固定ヘッダー/フッターの重なりを整理
- ヘッダーと下部メニューの位置関係が崩れないよう、`header` / `main` / `nav` の配置を共通ルールへ統一
- `100vh` / `100dvh` と `position: fixed` の競合によるスクロール不具合を解消

## v1.5.11
- 七夕期間中は通常の花・ちょうちょ・小鳥の浮遊演出を非表示へ固定
- 再描画時に通常装飾が一瞬だけ部署カード前面へ出る問題を解消
- 竹を部署カードから離し、右下の背景側へ移動
- 七夕演出を夜空・星・天の川・竹だけに統一
- `css/v125-tanabata.css` のキャッシュを `v=161` へ更新
- `annual-event-catalog.js` と `event-loader.js` をv1.5.11へ更新
- `pages/mori.html` のイベント関連キャッシュを `190` へ更新
- READMEをv1.5.11へ更新

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