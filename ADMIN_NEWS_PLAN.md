# ADMIN_NEWS_PLAN

## ステータス
- 第一版を実装済み（v1.5.24）。
- 本書は実装後仕様として更新。

## 実装方針（確定仕様反映）
- noticesシートを正本とする。
- 削除は論理削除のみ（物理削除は実装しない）。
- 公開開始日時は必須、公開終了日時は任意。
- 対象は `all`（全職員）または `department`（1部署）。
- 第一版は管理者のみ操作可能（将来の manage_news 段階開放は未対応）。
- 添付ファイル、画像、リッチテキスト、プッシュ通知、多段階承認は未実装。

## 調査した既存仕様（実装前確認）
1. noticesシート
- 実装前は Setup に未定義。
- 実装後は `setupProject()` で自動作成。

2. Setup.gs の既存作成方式
- `ensureSheet()` でヘッダ保証、freeze、autoResize を実施。
- 本実装も同方式に統一。

3. UserReads の既読保存方式
- `user_reads` に `readNewsIds` / `readThanksFlowerIds` をCSV保存。
- `markNewsRead` / `markThanksRead` は継続利用。

4. news.html / news.js の表示構造
- 画面は「今日のまとめ」「ありがとう」「お知らせ」「グループニュース」。
- ありがとう表示は `thanksTimeline` を継続。
- お知らせ表示のみ `publicNewsList` へ接続。

5. 既存ローカルデータ
- `rinchanNotices` / `rinchanGroupNews` は存在。
- 第一版では API 失敗時のフォールバック用途として保持。

6. 権限判定
- 管理系は `requireAdminAction` で統一。
- 第一版は管理者のみ（`admin_required` 応答形式を維持）。

7. 監査ログ形式
- `auditAction()` + `writeAuditLog()` の既存形式（detailJson）を利用。
- noticeId、状態遷移、対象、操作者情報を detail に格納。

8. Router 実装方式
- `if (action === '...')` 分岐 + try/catch + JSON応答。
- 第一版も同方式で追加。

9. 管理メニュー構造
- 第2段階「お知らせ・通信管理」は準備中だった。
- 第一版で利用可能リンク化。

10. タイムゾーンと日時保存形式
- Apps Script `Asia/Tokyo`。
- 保存値は ISO8601 文字列（`toISOString()`）で統一。

## noticesシート構造（実装済み）
- `noticeId`
- `type`（notice / group）
- `title`
- `body`
- `authorName`
- `targetType`（all / department）
- `targetDept`
- `status`（draft / published）
- `startAt`
- `endAt`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `publishedAt`
- `unpublishedAt`
- `deleted`（TRUE / FALSE）
- `deletedAt`
- `deletedBy`
- `version`

## 管理画面（実装済み）
### 1. 管理トップ導線
- admin の第2段階「お知らせ・通信管理」を利用可能化。
- `pages/admin-news.html` へ遷移。

### 2. admin-news 画面
- 一覧表示:
  - タイトル、種別、対象、状態、公開開始、公開終了、更新日時
  - 編集ボタン
  - 公開/公開停止ボタン
  - 削除ボタン（論理削除）
- 絞り込み:
  - 状態
  - 種別
  - 対象部署
  - キーワード
- 新規作成・編集フォーム:
  - 種別
  - タイトル
  - 本文
  - 発信者
  - 対象
  - 対象部署
  - 公開開始日時
  - 公開終了日時
  - 下書き保存
  - 公開保存
  - キャンセル

## 入力検証（実装済み）
- タイトル必須
- 本文必須
- 発信者必須
- 公開開始日時必須
- 対象が部署の場合は対象部署必須
- 公開終了日時がある場合は開始より後
- 削除済みは通常一覧に非表示
- 文字数上限:
  - タイトル: 120文字
  - 本文: 1000文字
  - 発信者: 40文字
- 保存中の二重送信防止

## 保存・公開フロー（実装済み）
1. 下書き保存
- `adminSaveNews(status=draft)`

2. 公開保存
- `adminSaveNews(status=published)`

3. 公開済み編集
- 同一 `noticeId` を維持して更新

4. 公開停止
- `adminUnpublishNews`

5. 論理削除
- `adminDeleteNews`（deleted=TRUE）

### UI動作
- 公開前に確認ダイアログ
- 公開停止前に確認ダイアログ
- 削除前に確認ダイアログ
- 成功/失敗を画面内メッセージ表示
- 保存成功後は一覧へ即時反映
- 既読履歴（user_reads）は変更しない

## 利用者向け配信（実装済み）
- `publicNewsList` を追加。
- 返却条件:
  - deleted=false
  - status=published
  - startAt <= now
  - endAt が空、または endAt >= now
  - targetType=all
  - または targetType=department かつ利用者部署一致
- 利用者画面:
  - news.js を `publicNewsList` へ接続
  - `markNewsRead` を継続使用
  - `noticeId` を既読IDとして利用
  - 非公開/終了/公開停止/削除済みは非表示
  - ありがとうタイムラインと今日のまとめは維持

## 管理API（実装済み）
- `adminNewsList`
- `adminSaveNews`
- `adminPublishNews`
- `adminUnpublishNews`
- `adminDeleteNews`
- `publicNewsList`

### 認可
- 管理系 action は `requireAdminAction` で管理者必須。
- 拒否時は既存の `ADMIN_REQUIRED` 形式。
- `publicNewsList` は一般利用者向け（返却項目は配信用に限定）。

## 監査ログ（実装済み）
- 記録対象:
  - 一覧閲覧
  - 新規作成
  - 下書き更新
  - 公開
  - 公開停止
  - 論理削除
  - 公開済み編集
- 最低限項目:
  - noticeId
  - 操作種別
  - 操作者ID/名前
  - 対象
  - 状態変更前/後
  - 操作日時（detail内）

## 認証・認可（実装済み）
### 画面側
- 未ログイン: login.html へ遷移
- 一般職員: mypage.html へ遷移
- 管理者のみ利用可能

### API側
- 管理 action は管理者のみ
- 画面非表示ではなく API 側で強制
- 操作者情報はサーバー側 `getUserPermissionContext()` で補完

## 実装ファイル
### Apps Script
- apps-script/Config.gs
- apps-script/Setup.gs
- apps-script/News.gs
- apps-script/Router.gs

### Frontend
- pages/admin.html
- pages/admin-news.html
- js/features/admin-news.js
- pages/news.html
- js/features/news.js
- css/v135-admin-news.css

### Documentation
- ADMIN_NEWS_PLAN.md
- ADMIN_PLAN.md
- README.md
- CHANGELOG.md

## 非実装（仕様どおり）
- 物理削除
- 添付ファイル
- 画像アップロード
- リッチテキスト
- プッシュ通知
- 多段階承認
- manage_news の段階開放

## 注意事項
- 本番 Apps Script での挙動は再デプロイ後確認が必要。
- 未確認項目は最終報告で明示する。
