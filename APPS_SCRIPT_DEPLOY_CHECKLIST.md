# Apps Script v1.6.0 反映チェックリスト

この変更はまだ本番へ反映していない。コミット・Push・Apps Scriptデプロイは、差分確認後に実施する。

## 反映対象

Apps Scriptエディタへ `apps-script/` 内の全 `.gs` と `appsscript.json` を反映する。特に次のファイルはH制度で追加・更新されている。

| ファイル | 内容 |
|---|---|
| `Point.gs` | 設定、台帳、付与、交換、二重処理防止 |
| `Config.gs` | `point_transactions` と v1.6.0 |
| `Setup.gs` | 設定初期値と台帳シート作成 |
| `Settings.gs` | H設定の取得 |
| `Router.gs` | 付与・交換・管理API |
| `User.gs` | 利用者状態へHを追加 |
| `Cache.gs` | H変更時のキャッシュ無効化 |
| `Backup.gs` | 台帳をバックアップ対象へ追加 |

## スプレッドシート準備

1. 現在のスプレッドシートをバックアップする。
2. Apps Scriptへ全ファイルを反映して保存する。
3. Apps Scriptエディタから `setupProjectManual()` を1回実行する。
4. 次を確認する。

### `point_transactions`

```text
transactionId, employeeId, amount, type, sourceId, description,
createdAt, createdBy, rewardId, metadataJson, version
```

### `app_settings`

次の設定群が作成されていることを確認する。

```text
point.enabled
point.rule.*.name
point.rule.*.enabled
point.rule.*.amount
point.reward.*.name
point.reward.*.enabled
point.reward.*.cost
```

既存の `users`、`activities`、`thanks` は削除・初期化しない。

## 初期値確認

- 全体：ON
- 初回登録：50
- 日次利用：1
- 歩数同期：2
- 日次目標：5
- 週次目標：20
- ありがとう受信：50
- イベント参加：50
- 限定バッジ：100
- Hカフェ：500
- 限定りんちゃんグッズ：1,000
- 特別抽選応募：2,000

## Webアプリ反映

1. Apps Scriptを「新しいバージョン」としてデプロイする。
2. 実行ユーザーとアクセス範囲が既存設定から変わっていないことを確認する。
3. WebアプリURLは既存URLを継続利用する。
4. GitHub Pages側の更新を反映する。
5. ブラウザキャッシュを更新して、管理画面とパスポートを開く。

## 本番確認

テスト用職員で次を確認する。

1. 管理画面の「H・その他設定」を開く。
2. 全体ON、各初期値、ご褒美が表示される。
3. 1日初回の同期で1Hだけ増える。
4. 同じ日に再読み込みしても増えない。
5. 当日の歩数を保存し、歩数同期2Hが1回だけ増える。
6. 日次・週次目標達成時に設定値が1回だけ増える。
7. ありがとう受信は同日に複数件あっても50Hが1回だけ増える。
8. パスポートで残高、累計、直近5件、ご褒美が表示される。
9. 500H未満ではHカフェを交換できない。
10. 500H以上で交換すると、残高が500減り累計は変わらない。
11. 同じ月にHカフェを再交換できない。
12. 全体OFF中は新規付与・交換が止まり、休止中表示になる。
13. ONへ戻した後、OFF期間分が遡及されず、新しい行動から再開する。

## 障害時

H付与の失敗は、既存の登録・歩数・ありがとうを失敗させない。

- `error_logs`: `type=server_point`
- `logs`: `action=pointAwardError`

を確認する。原因を修正後、管理者API `adminRetryPointAward` に、ログで確認した `ruleKey`、対象職員、同じ `sourceId` を渡して再処理する。すでに付与済みの場合は二重付与されない。

全体OFF・個別OFFによるスキップは正常動作であり、再処理しない。
