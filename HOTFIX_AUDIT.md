# HOTFIX_AUDIT

## 目的

現在の `css/vxxxx-*.css`、`js/vxxxx-*.js` は、短期間で品質改善を進めるために追加したHotFixが多く含まれています。
すぐ削除すると既存画面を壊す危険があるため、まず分類し、段階的に統合・削除します。

## 基本方針

- すぐ削除しない
- 画面表示が安定していることを確認してから整理する
- CSSは後ろで読み込まれるものが前の指定を上書きするため、統合前に影響範囲を確認する
- JSはラップ方式・boot方式が混在しているため、責務を確認してから統合する
- 統合時は1回につき1カテゴリのみ扱う

---

## CSS分類

### Coreとして維持

| ファイル | 用途 | 方針 |
|---|---|---|
| `css/style.css` | 基本デザイン | 維持 |
| `css/ui-v042.css` | 基本UI部品 | 維持 |
| `css/v102-rinchan-face.css` | りんちゃん顔表示 | 維持 |
| `css/v1034-nav-active.css` | フッターナビのアクティブ表示 | 維持 |

### 画面別に維持

| ファイル | 用途 | 方針 |
|---|---|---|
| `css/v097-home-fixes.css` | ホーム調整 | 統合候補 |
| `css/v1064-home-world.css` | ホーム世界観 | 維持 |
| `css/v113-mori-groups.css` | 杜・部署カード | 維持 |
| `css/v113-mypage-thanks.css` | マイページありがとう | 維持 |
| `css/v102-activity-tools.css` | 歩数記録ツール | 維持 |
| `css/v100-news-ui.css` | 通信UI | 維持 |

### レスポンシブ・表示崩れ対策

| ファイル | 用途 | 方針 |
|---|---|---|
| `css/v128-mobile-polish.css` | スマホ調整 | 維持 |
| `css/v1140-desktop-layout-fix.css` | PC表示崩れ対策 | 当面維持 |
| `css/v1136-mori-mobile-decor.css` | スマホ杜マップ装飾 | 当面維持 |
| `css/v1136-tree-info-readable.css` | 木の情報カード改善 | 統合候補 |
| `css/v1142-thanks-sync-loading.css` | ありがとう同期中表示 | 維持 |

### World系として維持

| ファイル | 用途 | 方針 |
|---|---|---|
| `css/v1067-mori-world.css` | 杜の花・小鳥・ちょうちょ | 維持 |
| `css/v1079-season.css` | 季節演出 | 統合候補 |
| `css/v1200-mori-world-engine.css` | Phase2 杜世界エンジン | 維持 |

### 統合候補

| ファイル | 理由 |
|---|---|
| `css/v081-fixes.css` | 古い共通修正。内容確認後Coreへ統合候補 |
| `css/v094-guide.css` | ガイド系。使用範囲確認 |
| `css/v098-hotfix.css` | 古いHotFix。影響確認 |
| `css/v099-ui-fixes.css` | UI調整。Core統合候補 |
| `css/v1013-hotfix.css` | 古いHotFix。影響確認 |
| `css/v1014-hotfix.css` | 古いHotFix。影響確認 |
| `css/v1078-polish.css` | 全体磨き込み。Core統合候補 |
| `css/v108-final-fixes.css` | 最終調整名だが後続多数あり。内容確認 |
| `css/v1120-text-balance.css` | テキスト調整。CoreまたはTypographyへ統合候補 |
| `css/v1139-home-header-fix.css` | ホームヘッダー復旧。ホームCSSへ統合候補 |

---

## JavaScript分類

### Coreとして維持

| ファイル | 用途 | 方針 |
|---|---|---|
| `js/core/storage.js` | localStorage・端末情報 | 維持 |
| `js/core/api.js` | API通信 | 維持 |
| `js/core/sync.js` | 同期 | 維持 |
| `js/core/offline-queue.js` | 未送信キュー | 維持 |
| `js/core/error-log.js` | エラー記録 | 維持 |
| `js/core/rinchan-modal.js` | モーダル | 維持 |

### Featureとして維持

| ファイル | 用途 | 方針 |
|---|---|---|
| `js/features/auth.js` | 認証 | 維持 |
| `js/features/activity.js` | 歩数記録 | 維持 |
| `js/features/news.js` | 通信 | 維持 |
| `js/features/mypage.js` | マイページ | 維持 |
| `js/features/thanks.js` | ありがとう | 維持 |
| `js/features/thanks-home-notice.js` | ホーム花通知 | 維持 |
| `js/features/flower-receive-effect.js` | 花受け取り演出 | 維持 |
| `js/features/mori.js` | 杜マップ | 維持 |
| `js/features/mori-thanks-confirm.js` | ありがとう相手確認 | 維持 |
| `js/features/mori-world.js` | 杜の花・生き物・杜だより | 維持 |
| `js/features/mori-world-engine.js` | 時間・季節・背景演出 | 維持 |
| `js/features/season-engine.js` | 季節 | 統合候補 |
| `js/features/growth.js` | 成長 | 維持 |
| `js/features/growth-animation.js` | 成長演出 | 統合候補 |
| `js/features/creature-engine.js` | 生き物 | Phase2で再評価 |

### Boot / Patch 系

| ファイル | 用途 | 方針 |
|---|---|---|
| `js/v1138-home-boot.js` | ホーム起動補正 | 内容確認後統合候補 |
| `js/v1138-mypage-boot.js` | マイページ起動補正 | 内容確認後統合候補 |
| `js/v108-mypage-popup-fix.js` | マイページポップアップ補正 | 統合候補 |
| `js/v1027-mypage-optimistic.js` | マイページ楽観更新 | 維持またはmypageへ統合 |
| `js/v127-departments.js` | 部署定義 | 設定ファイル化候補 |

---

## 現時点の判断

### すぐ削除してはいけないもの

- フッターナビ関連
- りんちゃん顔表示関連
- マイページありがとう関連
- 既読同期関連
- 杜マップ関連
- スマホ/PC表示崩れ対策

### 優先的に確認するもの

1. 古いHotFix CSSの重複
2. 画面ごとのキャッシュ番号不一致
3. Boot系JSの役割重複
4. World系JSの責務重複
5. インラインCSS / インラインJSの削減

---

## 整理ロードマップ

### Cleanup 1

- CSSを分類したまま、読み込み順を固定
- 現在の動作を壊さない

### Cleanup 2

- 古いHotFix CSSを `core-polish.css` へ統合
- 画面別CSSを `home.css`、`mori.css`、`mypage.css` などに再編

### Cleanup 3

- Boot系JSを各Featureへ統合
- `vxxxx` 命名のJSを段階的に廃止

### Cleanup 4

- キャッシュ番号を一括管理へ変更
- HTML内のCSS/JS読み込みを整理

## 注意

この監査ファイルは削除対象リストではありません。
「何を残し、何を統合するか」を安全に判断するための管理表です。
