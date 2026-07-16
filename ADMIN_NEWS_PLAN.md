# ADMIN_NEWS_PLAN

## 目的
- ADMIN_PLAN.md と DEVELOPMENT_RULES.md に従い、「お知らせ・通信管理（第2段階）」の現状をコード根拠で整理し、第一版の実装仕様を確定する。
- 今回は設計文書のみを作成し、コード変更は行わない。

## 対象範囲
- 利用者向け通信画面: pages/news.html, js/features/news.js
- 同期・既読関連: js/core/sync.js, js/core/offline-queue.js
- APIルーター・権限・監査: apps-script/Router.gs, apps-script/Permission.gs, apps-script/Audit.gs
- 既読データ管理: apps-script/UserReads.gs, apps-script/News.gs, apps-script/Setup.gs, apps-script/Config.gs
- 管理ハブ方針: pages/admin.html, ADMIN_PLAN.md

## 前提（方針文書との整合）
- ADMIN_PLAN.md では「お知らせ・通信管理」は第2段階、状態は準備中。
- pages/admin.html でも「お知らせ・通信管理」は disabled ボタン（準備中）で、遷移先ページは未接続。
- DEVELOPMENT_RULES.md の方針に従い、既存機能への影響最小・不明点は推測せず記載する。

## 現状仕様（実装済み）

### 1. 利用者向け通信画面の表示
- pages/news.html は以下の4領域を表示する構成。
  - 今日のまとめ
  - ありがとうの広がり
  - お知らせ
  - グループニュース
- js/features/news.js が画面描画を担当し、`renderAll()` で各領域を再描画する。

### 2. お知らせデータの実態
- サーバーの「お知らせ管理 API」は現状存在しない（Router.gs に notice/news CRUD action がない）。
- 利用者画面のお知らせはクライアント側生成が中心。
  - `rinchanDailyNotice()` で日次固定文面を生成
  - `defaultNotices()` で初期2件を付与
  - `rinchanNotices`（localStorage）に配列があればそれを優先
- お知らせの既読は `markNewsRead` API で user_reads シートへ同期される。

### 3. グループニュースの実態
- `groupNewsAuto()` が当日歩数やありがとう件数から自動文面をクライアント生成。
- `rinchanGroupNews`（localStorage）があれば追加ニュースとして表示。
- サーバー側にグループニュースの保存・公開 API はない。

### 4. 既読同期（現行有効）
- フロント:
  - `rinchanReadNewsIds`
  - `rinchanReadThanksFlowerIds`
  - `rinchanUserReads`
  を保持。
- サーバー:
  - `markNewsRead`
  - `markThanksRead`
  - `markRead`
  が Router.gs で有効。
- 永続化先:
  - `user_reads` シート（employeeId, readNewsIds, readThanksFlowerIds, updatedAt, version）。

### 5. 認証・認可（現行）
- 権限定義に `manage_news` は存在（Permission.gs）。
- ただし Router.gs の news/notice 管理 action が未実装のため、`manage_news` を使う管理 API は未接続。
- 管理 API 共通は `requireAdminAction` / `isAdminRequest` の枠組みがあり、同方式を再利用可能。

### 6. 監査ログ（現行）
- `auditAction()` / `writeAuditLog()` が共通化済み。
- 既読系 action（markRead, markNewsRead, markThanksRead）は監査記録あり。
- ただし「お知らせ作成/編集/公開停止/削除」の監査は、対象 action が未実装のため未記録。

## データ構造（現状と第一版方針）

### 現状データ
- user_reads（実装済み）
  - employeeId
  - readNewsIds（CSV）
  - readThanksFlowerIds（CSV）
  - updatedAt
  - version
- notices（ARCHITECTURE.md では想定記載あり）
  - ただし Setup.gs の `setupProject()` で notices シート作成は未実装。

### 第一版で採用するデータ構造（提案）
- 新規シート: notices
- ヘッダ案（第一版）
  - noticeId
  - category（notice/group）
  - title
  - body
  - tag
  - senderType（office/rinchan/group）
  - senderName
  - status（draft/published/archived）
  - publishedAt
  - startAt
  - endAt
  - createdAt
  - updatedAt
  - createdByEmployeeId
  - updatedByEmployeeId
  - version
- 設計意図
  - 利用者画面は `status=published` かつ期間内のみ表示。
  - draft と archived を分離し、公開停止を削除と分ける。

## API構造（現状と第一版）

### 現状API（実装済み）
- 通信ページで使うAPI
  - getUserState（同期）
  - thanksTimeline（ありがとう公開タイムライン）
  - markNewsRead（お知らせ既読）
  - markThanksRead（花受取既読）
- 未実装
  - お知らせ/グループニュースの管理CRUD API
  - 利用者向け notices 取得専用API

### 第一版API（追加提案）
- 管理側
  - adminNewsList
  - adminNewsCreate
  - adminNewsUpdate
  - adminNewsPublish
  - adminNewsArchive
  - adminNewsDelete
- 利用者側
  - publicNewsList
- 認可
  - 管理側 API は `requireAdminAction` + `hasPermission(..., PERMISSION_MANAGE_NEWS)` を必須にする。
- 監査
  - すべて `auditAction` を必須化（before/after 差分、targetId、status を記録）。

## 問題点（現状）
1. 通信コンテンツの正本がサーバーにない
- お知らせ/グループニュースが localStorage 中心で、端末依存となる。

2. 管理画面が未接続
- admin.html では「お知らせ・通信管理」が準備中のまま。

3. 権限定義と実装のギャップ
- `manage_news` 定義はあるが、適用先 action がない。

4. 監査保証の不足
- 既読は監査できるが、配信内容変更の監査は未整備。

5. 公開状態管理が存在しない
- draft/published/archived の状態管理が未実装で、運用フローをコードで担保できない。

## 第一版の画面構成（管理UI）
- 新規ページ案: pages/admin-news.html
- 画面ブロック
  - ヘッダー（戻る、再読込、ログイン/権限状態）
  - タブ（お知らせ / グループニュース）
  - 一覧エリア（status, 公開期間, 更新者, 更新日時）
  - 編集フォーム（新規/編集共用）
  - 操作ボタン（下書き保存、公開、公開停止、削除）
  - 操作結果表示（成功/失敗、監査記録ID）

## 第一版の入力項目
- 共通必須
  - 種別（notice/group）
  - タイトル
  - 本文
  - ステータス
- 任意
  - タグ
  - 送信者表示名
  - 掲載開始日時
  - 掲載終了日時
- バリデーション方針
  - 必須未入力不可
  - 本文最大文字数
  - 開始 <= 終了
  - published 遷移時に必須条件を再検証

## 保存・編集・公開・削除の流れ（第一版）
1. 新規作成
- 下書きで保存（adminNewsCreate, status=draft）
- 監査ログ: action=adminNewsCreate

2. 編集
- 既存レコード読込 → 更新（adminNewsUpdate）
- 監査ログ: action=adminNewsUpdate, before/after

3. 公開
- draft/archived から published へ遷移（adminNewsPublish）
- 公開日時を自動付与
- 監査ログ: action=adminNewsPublish

4. 公開停止
- published から archived へ遷移（adminNewsArchive）
- 監査ログ: action=adminNewsArchive

5. 削除
- 物理削除は第一版では任意（未確定）
- 実施する場合は adminNewsDelete で管理者のみ許可
- 監査ログ: action=adminNewsDelete

## 認証・認可
- 画面アクセス
  - admin系画面共通ガード（未ログインは login へ、一般職員は mypage へ戻す）を踏襲。
- API認可
  - `requireAdminAction` を必須。
  - 加えて `manage_news` 権限を明示チェック（第一版で接続）。
- 完了条件
  - UI表示制御だけでなく、API側で拒否できることを必須とする。

## 監査ログ
- 対象操作（第一版）
  - 一覧閲覧
  - 作成
  - 編集
  - 公開
  - 公開停止
  - 削除（採用時）
- 最低限の記録項目
  - actorEmployeeId
  - action
  - targetType=notice
  - targetId=noticeId
  - status
  - message
  - detailJson（before/after, status遷移, version）

## 実装対象ファイル候補（第一版）
- Apps Script
  - apps-script/Router.gs（action分岐追加）
  - apps-script/News.gs（news CRUDロジック集約）
  - apps-script/Permission.gs（manage_news 判定接続）
  - apps-script/Setup.gs（notices シート ensure 追加）
  - apps-script/Audit.gs（必要なら detail 形式拡張）
  - apps-script/Config.gs（SHEET_NOTICES 定数追加）
- Frontend
  - pages/admin.html（管理メニュー接続）
  - pages/admin-news.html（新規）
  - js/features/admin-news.js（新規）
  - pages/news.html（データ取得先を publicNewsList へ切替）
  - js/features/news.js（local生成中心からAPI取得中心へ段階移行）
  - css/v129-admin.css（既存管理画面スタイル再利用）
  - css/（admin-news専用CSSを必要最小限で追加）

## 実装順（第一版）
1. サーバー基盤
- notices シート追加
- CRUD + 公開制御 API 追加
- 権限チェックと監査ログ接続

2. 管理UI
- admin-news 画面新設
- 一覧/作成/編集/公開停止を接続

3. 利用者UI切替
- news.js のお知らせ取得を publicNewsList 優先に変更
- 既読同期（markNewsRead）は継続利用

4. 既存互換
- API失敗時のみ現行の local fallback を使うか最終判断
- 端末差異（Android/iPhone）確認を実施

## 現在実装済み機能（要約）
- 通信ページの表示枠と描画ロジック
- ありがとう公開タイムライン取得
- お知らせ既読・花受取既読のサーバー同期
- 権限/監査の共通基盤

## 不足機能（要約）
- お知らせ管理画面
- notices 正式データの保存先とCRUD API
- 公開状態管理（draft/published/archived）
- manage_news を使った実効認可
- お知らせ運用操作の監査ログ

## 第一版採用仕様（要約）
- notices シートを正本にする。
- 管理側 CRUD + 公開制御 API を追加する。
- 利用者向けは publicNewsList で published のみ配信する。
- markNewsRead/markThanksRead の既読同期は現行を継続活用する。
- すべての管理操作で監査ログを必須化する。

## 未確定事項
1. 削除方式
- 論理削除（archived運用のみ）に統一するか、物理削除 API を許可するか。

2. 公開期間仕様
- startAt/endAt を必須にするか任意にするか。

3. 種別運用
- notice/group を同一シート同一APIで持つか、将来分離するか。

4. 既存localデータ移行
- rinchanNotices / rinchanGroupNews をどこまで互換維持するか。

5. 権限粒度
- admin と manage_news を同一扱いにするか、manager/head へ段階開放するか。

## 備考
- 本書は現行コード確認に基づく設計案であり、未実装部分は「未確定」として明示した。
- 今回はドキュメント作成のみで、実装変更は行っていない。
