# ADMIN_PLAN

## 目的
manager_audit.md の S ランク 3 件（管理トップ方針、実装優先順位、認証・認可方針）を確定する。

## 対象範囲
- 管理トップ（pages/admin.html）
- 診断（pages/diagnostics.html）
- 管理導線（mypage の管理アイコン）
- 管理 API（apps-script/Router.gs, apps-script/Permission.gs）

## 参照文書
- manager_audit.md
- DEVELOPMENT_RULES.md
- TESTLIST.md
- README.md
- ARCHITECTURE.md
- DECISIONS.md

## 前提（現状コード確認結果）
1. 管理アイコン表示条件
- mypage の管理アイコンは、利用者データの admin が 1 または true、または role が admin のときに表示される。
- 根拠: js/v1138-mypage-boot.js の showAdminLink / isAdmin 判定。

2. 管理画面内の管理者判定
- 管理トップのサーバー取得（adminStats）は、フロント側でも同等条件で管理者判定後に実行される。
- 管理者でない場合、adminStats API は呼ばずローカル情報描画のみ実行される。
- 根拠: js/features/admin.js の isAdminUser と loadServerStats。

3. API 側の認可
- adminStats, clearCache, createBackup, recentBackups, recentErrorLogs, recentAuditLogs は isAdminRequest で拒否可能。
- 根拠: apps-script/Router.gs の各 action 分岐。
- isAdminRequest は Permission.gs の role/permission 判定に依存する。

4. API 側の注意点
- saveActivity, deleteActivity, saveUser などは Router 上で admin_required ガードが明示されていない。
- 管理操作で使う API は機能ごとに認可の明示追加が必要。

5. 画面アクセス制御の現状
- admin.html / diagnostics.html はページ読み込み時に未ログイン拒否や管理者拒否の明示ガードを持たない。
- 現状は「導線で隠す + 一部 API で拒否」が中心。

---

## 1. 確定: 管理トップの役割

### 方針
- 管理トップは「管理ハブ」とする。
- 管理トップには閲覧系情報と導線を置き、編集・削除を詰め込まない。
- 編集機能は管理機能ごとの専用画面へ分離する。

### 維持する既存要素
- 登録者数
- 今日の記録者数
- 今日の記録数
- 今日の歩数
- 部署別集計（部署別の動き）
- 要対応項目（所属未設定、長期未記録）
- 利用者検索

### 追加方針（ハブ化）
- 管理トップに「管理機能メニュー」を追加し、各専用画面へ遷移する。
- 管理トップ上で CRUD を開始しない。

---

## 2. 確定: 管理機能の実装優先順位

## 第 1 段階（最優先）
1. 管理トップのハブ化
2. 管理者認証・認可の明確化
3. 歩数修正

### 既存 API/運用確認
- adminStats は利用中（管理トップ）。
- 歩数データの保存・削除 API（saveActivity / deleteActivity）は存在するが、管理者操作向け要件（他者編集可否、監査ログ方針）は未確定。

## 第 2 段階
1. お知らせ・通信管理
2. 職員管理
3. 部署管理

### 既存 API/運用確認
- saveUser は存在する。
- notices 系の管理 API・UI は未接続または未実装（要棚卸し）。

## 第 3 段階
1. チャレンジ管理
2. バッジ管理
3. イベント管理

### 既存 API/運用確認
- 利用者機能の基盤はあるが、管理専用画面としては未実装。

## 第 4 段階
1. バックアップ
2. 監査ログ
3. エラーログ
4. キャッシュ管理
5. その他設定

### 既存 API/運用確認
- createBackup, recentBackups, recentAuditLogs, recentErrorLogs, clearCache は Router に存在し admin ガードあり。
- 管理画面からの接続は未実装。

---

## 3. 確定: 管理者認証・認可方式

### 採用方式（第一候補）
- 通常ログイン済みの管理者のみ、管理画面へ入れる方式を採用する。
- 専用の管理ログイン画面は現時点では新設しない。

### 判断理由
- 既存導線が「通常ログイン後のパスポート画面」から管理導線を出す設計である。
- 既存コードに admin/role 判定と API 側の権限制御基盤がある。
- まずは既存認証の上に認可を明確化する方が、変更範囲を抑えて段階実装しやすい。

### 必須原則
- 画面を隠すだけでは不十分。
- 管理操作は API 側で必ず権限確認する。
- 管理系 action はすべて isAdminRequest 相当の認可を持つ状態を完了条件とする。

### 3 状態の画面遷移と拒否動作（定義）
1. 未ログイン
- 管理画面 URL 直アクセス時はログイン画面へリダイレクト。
- 管理 API 呼び出しは拒否（not_logged_in または admin_required）。

2. 一般職員（ログイン済み、非管理者）
- パスポート画面では管理アイコン非表示。
- 管理画面 URL 直アクセス時は一般画面へ戻す（推奨: mypage）。
- 管理 API 呼び出しは admin_required で拒否。

3. 管理者（ログイン済み）
- パスポート画面で管理アイコン表示。
- 管理トップ、診断、各管理機能画面へ遷移可能。
- 管理 API 呼び出し可能（機能別権限を将来拡張）。

### 実装反映（v1.5.19）
- 画面側:
	- admin.html / diagnostics.html にページ初期化ガードを実装。
	- 未ログイン: 「ログイン後に管理画面をご利用ください。」を表示し login.html へ遷移。
	- 一般職員: mypage.html へ戻し、mypage 側で「管理者のみ利用できます。」を 1 回表示。
	- 管理者: そのまま管理画面を利用可能。
- パスポート画面:
	- 管理アイコンは admin/role 判定に一致する場合のみ表示。
	- 非管理者は hidden を強制し、表示残りを防止。
- API 側:
	- clearCache, createBackup, recentBackups, recentErrorLogs, recentAuditLogs, adminStats は共通関数で管理者判定を実施。
	- 拒否時レスポンスは Router 共通関数で統一（action, error, reason, code, message, version）。
	- 一般利用者向け API（getUserState, myActivities, myThanks など）は変更しない。

---

## 4. 各管理画面の構成（確定版）

| 画面 | 目的 | 閲覧項目 | 操作項目 | 必要 API | 権限 | 優先度 | 未実装事項 |
|---|---|---|---|---|---|---|---|
| 管理トップ（管理ハブ） | 全体把握と導線提供 | 登録者数、歩数、部署別、要対応、利用者検索 | 各管理画面へ遷移 | adminStats | view_admin | 第1段階 | ハブメニュー実装 |
| 歩数修正 | 誤記録修正 | 対象者、対象日、履歴 | 修正（理由必須）、確認、反映 | adminActivityRows, adminUpdateActivity（内部で saveActivity 利用） | view_admin | 第1段階 | Apps Script再デプロイ後に本番確認 |
| 管理認証・認可 | 管理アクセス統制 | ログイン状態、権限状態 | 拒否時遷移、エラー表示 | loginUser, getUserState, 管理系各 API | 管理者/一般/未ログイン制御 | 第1段階 | 直アクセスガードの統一 |
| お知らせ・通信管理 | 通知運用 | 通知一覧、公開状態、対象 | 作成、編集、公開、公開停止、論理削除 | adminNewsList, adminSaveNews, adminPublishNews, adminUnpublishNews, adminDeleteNews, publicNewsList | 管理者（admin） | 第2段階 | Apps Script再デプロイ後に本番確認 |
| 職員管理 | 利用者運用 | 職員一覧、状態 | 登録、更新、有効/無効 | saveUser, getUserState | manage_users 想定 | 第2段階 | 一覧 API と検索条件 |
| 部署管理 | 部署マスタ保守 | 部署一覧、人数 | 追加、名称変更、無効化 | departments（参照）, 更新 API 未確定 | 管理者 | 第2段階 | 更新 API |
| チャレンジ管理 | 目標運用 | チャレンジ一覧、達成状況 | 作成、期間設定、停止 | 未確定 | 管理者 | 第3段階 | 画面/API 一式 |
| バッジ管理 | バッジ運用 | バッジ定義、獲得状況 | 作成、条件変更、停止 | 未確定 | 管理者 | 第3段階 | 画面/API 一式 |
| イベント管理 | 季節イベント運用 | 開催状況、期間 | 有効化、期間設定、切替 | 未確定 | 管理者 | 第3段階 | 運用 UI/API |
| バックアップ管理 | 復旧準備 | バックアップ履歴 | 作成、一覧確認 | createBackup, recentBackups | view_admin | 第4段階 | 管理 UI 接続 |
| 監査ログ管理 | 操作追跡 | 監査ログ一覧 | 絞り込み、確認 | recentAuditLogs | view_admin | 第4段階 | 管理 UI 接続 |
| エラーログ管理 | 障害把握 | サーバーエラーログ | 絞り込み、確認 | recentErrorLogs | view_admin | 第4段階 | 管理 UI 接続 |
| キャッシュ管理 | 運用保守 | キャッシュ状態 | クリア実行 | clearCache | view_admin | 第4段階 | 実行 UI と確認導線 |
| その他設定 | 運用設定 | 設定一覧 | 変更、保存 | setup ほか未確定 | system/admin 想定 | 第4段階 | 対象設定と権限定義 |

注記:
- 「未確定」は、現行コードで明示的に確認できないため推測せず残している。

---

## 5. 実装ルール（管理機能向け）
1. 1 回につき 1 管理機能を完成させる。
2. 管理トップへ機能を詰め込まない。
3. 保存・編集・削除には、確認ダイアログと結果表示を必須にする。
4. スマホ操作可能を維持しつつ、PC 運用を主用途とする。
5. Android スクロール、共通メニュー、利用者画面、季節イベントは変更しない。
6. 機能追加と不具合修正を同一作業に混在させない。
7. 管理機能の完了条件に「API 側認可確認」を含める。

---

## 実装前の未確定事項（要確定）
1. 管理 API の機能別権限
- view_admin だけで十分か。
- manage_users / manage_news など機能別 permission を UI 側にどう対応させるか。

2. 通信管理、部署管理、設定管理の API 定義
- 既存 API の再利用範囲と追加 API の要否。

3. 監査ログ粒度
- 管理画面のどの操作を必須監査対象にするか。

4. 直アクセス拒否時の遷移先・メッセージ統一
- 未ログイン時と非管理者時の表示文言、戻り先画面。

## 歩数修正 実装メモ（v1.5.20）
- 管理トップから歩数修正専用画面（admin-activity）へ遷移可能にした。
- 対象日、氏名/社員番号/部署検索、日別現在歩数一覧、修正フォーム（理由必須）を実装。
- 管理 API として adminActivityRows / adminUpdateActivity を追加し、requireAdminAction で保護。
- adminUpdateActivity は同一職員・同一日付の最新レコードを更新し、未存在時は新規作成する。
- 監査ログは audit_logs に adminActivityCorrection として保存し、修正前後歩数・理由・対象ID・操作者情報を記録。

## お知らせ・通信管理 実装メモ（v1.5.24）
- 管理トップの第2段階メニュー「お知らせ・通信管理」を利用可能にし、admin-news専用画面へ遷移可能にした。
- notices シートを正本として追加し、`setupProject()` でヘッダを自動作成するようにした。
- 管理 API `adminNewsList` / `adminSaveNews` / `adminPublishNews` / `adminUnpublishNews` / `adminDeleteNews` を追加し、`requireAdminAction` で保護した。
- 利用者向け API `publicNewsList` を追加し、未削除・公開中・期間内・対象一致の通知のみ返すようにした。
- 削除は deleted フラグによる論理削除のみ実装し、物理削除は未実装とした。
- 監査ログは一覧閲覧・作成・更新・公開・公開停止・論理削除を記録し、noticeId・状態遷移・対象を detailJson に保存する。

---

## 決定事項まとめ
- 管理トップは閲覧 + 導線の管理ハブとする。
- 管理機能は 4 段階で実装し、第 1 段階を最優先とする。
- 認証は通常ログインを利用し、認可は画面と API の両方で実施する。
- 専用管理ログインは現時点で新設しない。
