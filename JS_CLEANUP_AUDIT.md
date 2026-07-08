# JS_CLEANUP_AUDIT

## 目的

Cleanup1-3として、JavaScriptの責務・統合候補・後日整理対象を分類します。
この段階では、JSファイルの削除・統合は行いません。

## 基本方針

- 既存機能を壊さない
- ありがとう・同期・ログイン・歩数保存は触らない
- Boot / Patch系は役割を確認してから統合する
- World系はPhase2中は分離維持する

---

## Core系

| ファイル | 判断 |
|---|---|
| `js/core/storage.js` | 維持 |
| `js/core/api.js` | 維持 |
| `js/core/sync.js` | 維持・要注意 |
| `js/core/offline-queue.js` | 維持 |
| `js/core/error-log.js` | 維持 |
| `js/core/rinchan-modal.js` | 維持 |

判断:

- 全画面に影響するためCleanup1では触らない
- 特に `sync.js` は既読・ありがとう・歩数に関わるため、個別修正時のみ扱う

---

## Feature系

| ファイル | 判断 |
|---|---|
| `js/features/auth.js` | 維持 |
| `js/features/activity.js` | 維持 |
| `js/features/news.js` | 維持 |
| `js/features/mypage.js` | 維持 |
| `js/features/thanks.js` | 維持・要注意 |
| `js/features/thanks-home-notice.js` | 維持 |
| `js/features/flower-receive-effect.js` | 維持 |
| `js/features/mori.js` | 維持・要注意 |
| `js/features/mori-thanks-confirm.js` | 維持 |
| `js/features/admin.js` | Phase4で再評価 |

判断:

- 現在の主要機能を担うため、削除・統合しない
- `thanks.js` と `mori.js` は重要度が高く、触る場合は個別検証が必要

---

## World系

| ファイル | 判断 |
|---|---|
| `js/features/mori-world.js` | 維持 |
| `js/features/mori-world-engine.js` | 維持 |
| `js/features/season-engine.js` | 統合候補 |
| `js/features/creature-engine.js` | Phase2で再評価 |
| `js/features/growth-animation.js` | 統合候補 |
| `js/features/growth.js` | 維持 |

判断:

- Phase2では世界観拡張が続くため、今は分離維持
- 生き物・成長演出実装後にWorldEngineへ整理する

---

## Boot / Patch系

| ファイル | 判断 |
|---|---|
| `js/v1138-home-boot.js` | 統合候補 |
| `js/v1138-mypage-boot.js` | 統合候補 |
| `js/v108-mypage-popup-fix.js` | 統合候補 |
| `js/v1027-mypage-optimistic.js` | 統合候補・要注意 |
| `js/v127-departments.js` | 設定ファイル化候補 |

判断:

- Cleanup2以降の主対象
- ただし、マイページ系はありがとう履歴やプロフィールに影響するため、すぐ触らない

---

## 管理画面系

| ファイル | 判断 |
|---|---|
| `js/features/admin.js` | Phase4で再設計候補 |

判断:

- 管理画面はキャッシュ番号・設計ともに古い
- ただし運用確認で使うため、Cleanup1では壊さない

---

## Cleanup1-3の結論

現時点で削除してよいJSはありません。

Cleanup2以降の統合候補は以下です。

1. Boot系JS
2. マイページPatch系JS
3. Season / World周辺JS
4. 部署定義JSの設定化

## 次の作業

- Cleanup1-4として、実際に触れる最小修正を選ぶ
- 候補は「管理画面のキャッシュ番号を更新するかどうか」または「README / 監査文書の整合性確認」

## 注意

JSの整理はCSSより危険度が高いため、削除・統合は必ず1ファイル単位で行います。
