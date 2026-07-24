# CSS_CLEANUP_AUDIT

## 2026-07-24 再点検

- 現行HTML内に、同じCSSまたはJavaScriptを同一画面で重複指定している箇所はありません。
- `js/config.js` が管理・認証画面などへ旧CSSを14枚追加しており、静的な指定と合わせて最大19枚近くになる状態を確認しました。
- 旧CSSの自動追加を停止し、各画面のHTMLが明示したCSSだけを読み込む方式へ変更しました。
- ローカルのログイン画面では、CSS読込が `style.css` と `auth-design-system.css` の2枚だけであることを確認しました。
- ホーム6枚、歩数記録5枚、通信5枚、パスポート5枚、管理画面4〜5枚は役割が分かれており、同一ファイルの重複読込はありません。
- 杜画面は12枚で最多ですが、合計は約68KBで、季節・生き物・イベントなど機能別のCSSです。今回は表示崩れの危険を避けて統合せず、次の整理候補とします。

## 目的

Cleanup1-2として、CSSの重複・統合候補を安全に整理します。
この段階では、CSSファイルの削除・統合は行いません。

## 基本方針

- 既存表示を壊さない
- 読み込み順を変えない
- まず分類する
- 統合候補は次フェーズで個別確認する

---

## CSS分類

### Core系

| ファイル | 判断 |
|---|---|
| `css/style.css` | 維持 |
| `css/ui-v042.css` | 維持 |
| `css/v102-rinchan-face.css` | 維持 |
| `css/v1034-nav-active.css` | 維持 |

理由:

- 多くの画面で使われる基礎CSS
- すぐ統合・削除しない

---

### 認証系

| ファイル | 判断 |
|---|---|
| `css/v1116-auth-modal.css` | 維持 |

対象:

- ログイン
- 新規登録

判断:

- 画面構成がシンプルで安定しているため、現時点では触らない

---

### ホーム系

| ファイル | 判断 |
|---|---|
| `css/v097-home-fixes.css` | 統合候補 |
| `css/v1064-home-world.css` | 維持 |
| `css/v1139-home-header-fix.css` | 統合候補 |
| `css/v1140-desktop-layout-fix.css` | 当面維持 |

判断:

- ホームは何度か崩れた履歴があるため、今は削除しない
- `v1139-home-header-fix.css` は将来的にホームCSSへ統合候補

---

### 杜系

| ファイル | 判断 |
|---|---|
| `css/v113-mori-groups.css` | 維持 |
| `css/v1067-mori-world.css` | 維持 |
| `css/v1136-mori-mobile-decor.css` | 維持 |
| `css/v1200-mori-world-engine.css` | 維持 |

判断:

- Phase2の中心
- 今は統合しない
- 生き物機能追加後に再評価

---

### マイページ・ありがとう系

| ファイル | 判断 |
|---|---|
| `css/v113-mypage-thanks.css` | 維持 |
| `css/v1031-badge-polish.css` | 維持 |
| `css/v1142-thanks-sync-loading.css` | 維持 |
| `css/v1026-admin-mypage.css` | 維持 |

判断:

- ありがとう機能の検証中のため触らない
- マイページは現在重要画面

---

### 通信系

| ファイル | 判断 |
|---|---|
| `css/v100-news-ui.css` | 維持 |

判断:

- 通信はありがとう受け取りを外した後の役割が整理済み
- 今は維持

---

### 歩数記録系

| ファイル | 判断 |
|---|---|
| `css/v102-activity-tools.css` | 維持 |

判断:

- 歩数記録は安定優先
- 今は触らない

---

### 管理画面系

| ファイル | 判断 |
|---|---|
| `css/v129-admin.css` | 維持 |
| `css/v1030-capsule-buttons.css` | 統合候補 |

判断:

- 管理画面は古いが、Phase4で再設計予定
- Cleanup1では大きく触らない

---

### 古いHotFix・統合候補

| ファイル | 判断 |
|---|---|
| `css/v081-fixes.css` | 統合候補 |
| `css/v094-guide.css` | 使用範囲確認 |
| `css/v098-hotfix.css` | 統合候補 |
| `css/v099-ui-fixes.css` | 統合候補 |
| `css/v1013-hotfix.css` | 統合候補 |
| `css/v1014-hotfix.css` | 要注意・多画面利用 |
| `css/v1078-polish.css` | 統合候補 |
| `css/v108-final-fixes.css` | 統合候補 |
| `css/v1120-text-balance.css` | Typography統合候補 |

判断:

- ここがCleanup2の主対象
- ただし `v1014-hotfix.css` は多画面で読まれているため、削除は最後

---

## Cleanup1-2の結論

現時点で削除してよいCSSはありません。

ただし、次のグループはCleanup2で統合候補です。

1. 古いHotFix群
2. ホームヘッダー復旧CSS
3. テキストバランスCSS
4. カプセルボタンCSS

## 次の作業

- JS Boot / Patch の整理監査
- `JS_CLEANUP_AUDIT.md` を作成

## 注意

CSSは後から読み込まれたものが前の指定を上書きするため、統合は必ず画面単位で検証して行います。
