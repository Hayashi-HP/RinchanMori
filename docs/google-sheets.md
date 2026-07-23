# Google Sheets 設定 v0.2.2

## 作成するスプレッドシート

任意の名前で新規 Google Sheets を作成します。
推奨名：りんちゃんの杜_DB

## Apps Script 設置

1. スプレッドシートを開く
2. 拡張機能 → Apps Script
3. `apps-script/` 内の全 `.gs` ファイルを同名で作成して内容を反映
4. `apps-script/appsscript.json` の内容をマニフェストへ反映
5. デプロイ → 新しいデプロイ
6. 種類：ウェブアプリ
7. 実行ユーザー：自分
8. アクセスできるユーザー：全員
9. 発行された Web アプリ URL を `js/config.js` の `API_URL` に貼り付け

## 自動作成されるシート

初回アクセス時に以下のシートが自動作成されます。

ポイント制度を追加した更新では、Apps Script側を保存後に `setupProjectManual()` を一度実行してください。`app_settings` に `point.*` の初期設定が追加され、`point_transactions` が作成されます。

### users

| 列 | 内容 |
|---|---|
| id | 参加者ID |
| deviceId | 端末ID |
| name | 氏名 |
| dept | 所属 |
| nick | ニックネーム |
| declaration | 健康宣言 |
| weeklyGoal | 今週の目標 |
| createdAt | 初回登録日時 |
| updatedAt | 更新日時 |
| version | アプリバージョン |
| lastSavedAt | Sheets保存日時 |

### activities

| 列 | 内容 |
|---|---|
| activityId | 活動ID |
| participantId | 参加者ID |
| deviceId | 端末ID |
| date | 活動日 |
| steps | 歩数 |
| challenge | チャレンジ実施 |
| comment | ひとこと |
| createdAt | 登録日時 |
| version | アプリバージョン |
| savedAt | Sheets保存日時 |

### logs

| 列 | 内容 |
|---|---|
| loggedAt | ログ日時 |
| action | 処理名 |
| deviceId | 端末ID |
| participantId | 参加者ID |
| status | ok/ng |
| message | メッセージ |

### point_transactions

| 列 | 内容 |
|---|---|
| transactionId | 一意な取引ID |
| employeeId | 対象職員 |
| amount | 付与は正、交換は負 |
| type | 付与・交換の種類 |
| sourceId | 二重処理防止用の元イベントID |
| description | 履歴表示文 |
| createdAt | 発生日時 |
| createdBy | system・管理者・本人 |
| rewardId | ご褒美キー |
| metadataJson | 補足情報 |
| version | 保存時バージョン |

### app_settings のポイント設定

- `point.enabled`
- `point.rule.{ruleKey}.name`
- `point.rule.{ruleKey}.enabled`
- `point.rule.{ruleKey}.amount`
- `point.reward.{rewardKey}.name`
- `point.reward.{rewardKey}.enabled`
- `point.reward.{rewardKey}.cost`

初回セットアップで初期値を作成する。運用開始後に一部の設定行が欠損した場合は、安全のため該当項目を無効・0りんとして扱う。
