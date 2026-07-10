# りんちゃんの杜

みんなで育てる、健康と笑顔の杜。

## 現在バージョン
**v1.4.28**

## 最終更新
2026-07-10

## 現在の位置づけ

Phase1 の基本機能はおおむね完成。
現在は Phase2「杜を生きた世界にする」と Phase3「チャレンジ・バッジ・イベント」を接続しながら拡張中です。

## v1.4.28 で修正された内容

- チャレンジカードの左右余白をCSSではなく描画JS本体で固定
- `monthly-challenge-render.js` にカード幅・左右余白の直接指定を追加
- `department-challenge-render.js` にカード幅・左右余白の直接指定を追加
- `hospital-challenge-render.js` にカード幅・左右余白の直接指定を追加
- 各カード描画時に `width: calc(100% - 48px)`、`max-width: 382px`、`margin-left/right: auto` を付与
- `css/v167-final-layout-override.css` を追加し、最終上書きCSSを用意

## v1.4.27 で修正された内容

- パスポート画面に `passport-layout-fix.js` を追加し、チャレンジカードの左右余白をJSで最終補正
- 描画後の月間チャレンジ、部署チャレンジ、病院全体チャレンジに `width: calc(100% - 32px)` と `max-width: 398px` を直接指定
- Android Chromeでスクロールを安定させるため、固定フッター `position: fixed` を解除
- ナビゲーションをページ末尾の通常配置カード型に変更
- ホーム、杜、歩数記録、通信、パスポート画面のキャッシュ番号を `166` に更新

## 直近の重要な修正

- v1.4.28：チャレンジ余白を描画JS本体で固定
- v1.4.27：チャレンジ余白をJSで最終補正し、固定フッターを解除
- v1.4.26：パスポートのチャレンジカード左右余白をカード自身へ直接指定
- v1.4.25：iPhoneショートカットの `saveHealthSteps` を歩数登録として受け付け
- v1.4.24：Android Chromeスクロールと固定フッター重なりを再修正

## 現在の注意点

- CSS / JS の HotFix ファイルが増えているため、今後整理が必要
- 画面ごとにキャッシュ番号が異なるため、検証時はキャッシュ更新に注意
- Android Chromeでは、反映後にChrome再起動またはページ再読み込みで確認する

## 正式管理文書

| 文書 | 役割 |
|---|---|
| `README.md` | プロジェクト概要・現在地 |
| `CHANGELOG.md` | 更新履歴 |
| `ROADMAP.md` | 開発計画 |
| `ARCHITECTURE.md` | システム設計 |
| `HOTFIX_AUDIT.md` | HotFix整理計画 |
| `CACHE_AUDIT.md` | キャッシュ管理 |
| `HTML_ASSET_AUDIT.md` | HTML読み込み監査 |
| `TECH_DEBT.md` | 技術的負債管理 |
| `DEVELOPMENT_GUIDE.md` | 開発標準 |
| `DECISIONS.md` | 設計判断記録 |
| `CLEANUP_PLAN.md` | Cleanup実行計画 |
| `APPS_SCRIPT_DEPLOY_CHECKLIST.md` | Apps Script反映手順 |
