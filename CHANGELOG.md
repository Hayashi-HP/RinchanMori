# CHANGELOG

## v1.5.33

- PC版のタイトル領域とヘッダーメニューの高さ・余白を拡張
- ホームと歩数記録に共通のモダンページシェルを導入
- 1200px以上で適用されていた過度なヘッダー圧縮を解消
- スマートフォン版の表示寸法は変更なし

## v1.5.32

- 歩数記録画面をホーム画面と共通のデザインシステムへ刷新
- 選択日の歩数リングと週間グラフを追加
- PCの2列配置とスマートフォンの1列配置を最適化
- 絵文字の操作ボタンをアクセシブルな線画アイコンへ変更
- 歩数記録画面では旧共通CSSの動的重ね読みを停止

## v1.5.31
- PCの1画面完結を維持したまま、ヒーローと各カードの高さ・余白を再配分して縦横比を改善
- PCの想定占有高を約950pxへ調整し、1920×1080で余白を保ちながら一覧可能に変更
- スマートフォンのニックネームを22〜28pxへ縮小し、長い名前と敬称の折り返しを分離
- 「杜を見る→」リンクへ改行禁止と最小幅を追加
- 今日の杜タイトルへ `text-wrap: balance` を適用し、1文字だけの孤立改行を抑制
- ホームCSSのキャッシュ番号を `213` に更新

## v1.5.30
- 1920×1080級のPC表示に、主要ホーム情報を1画面へ収めるコンパクトレイアウトを追加
- PCの利用者名を30pxへ縮小し、挨拶・メッセージとの視覚的な階層を調整
- PCのヘッダー、横型ナビ、ヒーロー、円形歩数メーター、杜、週間グラフ、杜だよりの高さと余白を最適化
- スマートフォン向けの縦並びと文字サイズには影響しない `min-width: 1200px` / `min-height: 800px` 限定ルールとして実装
- ホームCSSのキャッシュ番号を `212` に更新

## v1.5.29
- スマートフォンで今日の歩数、今日の杜、週間歩数が横並びになるレスポンシブ不具合を修正
- 899px以下のホームダッシュボードを強制縦並びFlexへ変更
- iOS / Android / 小画面端末に `is-mobile-device` を付け、画面幅判定がPC相当でも縦並びを維持
- 週間棒グラフに幅上限と縮小許可を追加し、カード右端の見切れを防止
- ホームCSSと端末判定JSのキャッシュ番号を `211` に更新

## v1.5.28
- 共有デザインイメージに合わせ、ホームの色、ボタン形状、カード、余白を再設計
- 今日の歩数を青〜緑の円形進捗メーターに変更し、日付・目標歩数・残り歩数を集約
- 主要アクションを青〜緑のカプセル型ボタンへ変更
- 900px以上では下部固定ナビを解除し、上部横型ナビと最大1280pxの12カラムダッシュボードを採用
- 899px以下では固定下部ナビと1カラム構成へ切り替えるレスポンシブ境界を明確化
- ホーム関連CSS/JSのキャッシュ番号を `210` に更新
- `assets/rinchan-face.svg` は無変更

## v1.5.27
- ホーム画面を長期運用しやすいレスポンシブUIへ刷新
- ブランドカラー、余白、角丸、影、文字、タップ領域を `css/home-design-system.css` のデザイントークンへ集約
- 絵文字だった主要ナビゲーションと操作アイコンを統一線画SVGへ変更
- 今日の歩数サマリーと目標進捗を `js/features/home-dashboard.js` として追加
- ホームに限り旧来の多重CSS注入とモバイル最終上書きを停止し、ホーム専用デザインシステムを優先
- 既存のGAS連携、同期、認証、歩数、杜、通信、ありがとうの各機能とDOM IDを維持
- `assets/rinchan-face.svg` は無変更
- 375×812と1440×900でログイン前後の表示、横はみ出し、主要データ描画、44px以上の操作領域を確認

## v1.5.26
- 不採用方針に基づき GroupSession 連携コードを撤去
- `adminGroupSessionConnectionTest` と GroupSession 接続処理、Router の該当分岐、専用ファイルを削除
- GroupSession 専用の定数・参照を除去
- 職員管理の単独運用設計は維持し、GroupSession を将来案/不採用として整理

# v1.5.25
- GroupSession Web API 接続確認用の管理 API `adminGroupSessionConnectionTest` を追加
- Apps Script から Script Properties の `GS_BASE_URL` / `GS_API_USER` / `GS_API_PASSWORD` を使い、`/api/user/whoami.do` を BASIC 認証で確認する接続テストを実装
- GroupSession の XML 応答を `XmlService` で解析し、ユーザーSID・ログインID・社員番号・氏名・所属・生年月日フィールド・生年月日公開フラグ・有効無効状態の存在だけを確認するように統一
- 接続確認は管理者限定とし、監査ログに実行結果だけを残して認証情報や個人情報は保存しない方針を反映

## v1.5.24
- 管理者向け「お知らせ・通信管理」専用画面 `pages/admin-news.html` を追加
- `js/features/admin-news.js` を追加し、一覧、絞り込み（状態/種別/部署/キーワード）、新規作成、編集、公開、公開停止、論理削除を実装
- `css/v135-admin-news.css` を追加し、管理ニュース画面のフォーム・一覧・モバイル表示を実装
- 管理トップの第2段階メニューで「お知らせ・通信管理」を利用可能に変更
- Apps Script に `SHEET_NOTICES` を追加し、`setupProject()` で notices シートを作成するよう更新
- Apps Script に `adminNewsList` / `adminSaveNews` / `adminPublishNews` / `adminUnpublishNews` / `adminDeleteNews` / `publicNewsList` を追加
- 削除は論理削除（deleted/deletedAt/deletedBy）で実装し、物理削除は実装しない方針を反映
- `apps-script/News.gs` で notices 入力検証（必須/文字数/日時/対象部署）と公開判定ロジックを実装
- 通信画面を `publicNewsList` に接続し、既存の `markNewsRead` 既読同期を継続
- 管理ニュース操作（一覧閲覧/作成/更新/公開/公開停止/論理削除）を監査ログへ記録
- README を v1.5.24 に更新

## v1.5.20
- 管理者向け「歩数修正」専用画面 `pages/admin-activity.html` を追加
- 管理トップの第1段階メニューから歩数修正画面へ遷移可能に変更（準備中表示を解除）
- `js/features/admin-activity.js` を追加し、対象日/検索/部署フィルタ/修正フォーム/入力検証/二重送信防止を実装
- `css/v134-admin-activity.css` を追加し、歩数修正画面の一覧・フォーム・モバイル表示を実装
- Apps Script に `adminActivityRows` / `adminUpdateActivity` を追加し、`requireAdminAction` で管理者権限を強制
- `apps-script/Admin.gs` に歩数修正用ロジック（対象日正規化・日別最新レコード抽出・修正保存・監査情報返却）を追加
- 歩数修正時の監査ログ `adminActivityCorrection` を追加（before/after/reason/target/admin を記録）
- 管理関連ページのキャッシュクエリを更新（admin / diagnostics / mypage / admin-activity）
- `ADMIN_PLAN.md` を更新し、歩数修正実装内容を反映
- README を v1.5.20 に更新

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
