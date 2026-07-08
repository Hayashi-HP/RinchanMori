# CACHE_AUDIT

## 目的

画面ごとにCSS / JSのキャッシュ番号が混在しているため、現状を整理し、今後の統一方針を定めます。

## 現在の代表的な状態

| 画面 | ファイル | 主な番号 | 状態 |
|---|---|---:|---|
| ホーム | `index.html` | 1141 | 要整理 |
| 杜 | `pages/mori.html` | 1200 | 最新基準 |
| 歩数記録 | `pages/activity.html` | 1118 | 古いが安定中 |
| 通信 | `pages/news.html` | 1137 | 要整理 |
| マイページ | `pages/mypage.html` | 1142 | ありがとう同期対応済み |
| ログイン | `pages/login.html` | 1117 | 古いが構成は軽量 |
| 新規登録 | `pages/register.html` | 1137 | 部署リスト対応済み |
| 管理 | `pages/admin.html` | 1034 | 最も古い。要重点確認 |

## 追加確認結果

### ログイン

- CSS: `style.css`, `ui-v042.css`, `v102-rinchan-face.css`, `v128-mobile-polish.css`, `v1014-hotfix.css`, `v1116-auth-modal.css`
- JS: `config`, `storage`, `error-log`, `api`, `sync`, `offline-queue`, `rinchan-modal`, `auth`
- 主な番号: `1117`

### 新規登録

- CSS: ログインと同系統
- JS: ログイン構成に加えて `v127-departments.js`
- 主な番号: `1137`

### 管理画面

- CSS: `style.css`, `ui-v042.css`, `v102-rinchan-face.css`, `v129-admin.css`, `v128-mobile-polish.css`, `v1014-hotfix.css`, `v1026-admin-mypage.css`, `v1030-capsule-buttons.css`
- JS: `config`, `storage`, `error-log`, `api`, `sync`, `offline-queue`, `activity`, `admin`
- 主な番号: `1034`
- 注意: 表示上のラベルも `v1.0.34` のまま。今後修正候補。

## 問題点

- 現在バージョンは `v1.2.0` だが、画面ごとに番号が違う
- 検証時に最新反映状況が分かりにくい
- 管理画面の番号が特に古い
- ただし一括更新は表示崩れのリスクがある

## 運用方針

- すぐに全画面を一括更新しない
- 修正した画面だけキャッシュ番号を更新する
- 共通CSS / JSを変更した場合は、影響画面の番号を更新する
- Cleanupフェーズで全画面統一を検討する

## 次にやること

1. 管理画面の表示ラベル `v1.0.34` を今後の修正候補に入れる
2. 各HTMLの読み込み一覧化を続ける
3. `v1.2.1` 以降は修正対象画面のみ番号更新
4. Cleanupフェーズで全画面統一を検討

## 将来方針

Cleanupバージョンで以下を検討します。

- 全HTMLのキャッシュ番号統一
- CSS / JS読み込みの整理
- 画面別CSSへの再編
- 共通バージョン定数化
