# H制度 仕様書 v1.1

## 目的

Hは、アプリを開くだけのゲームではなく、健康行動と職員同士の感謝を続けるきっかけとして使う。

H＝5H Values・Hayashi・Hayashinableを表すシンボル。

## 初期設定

### 付与条件

| キー | 名称 | 初期値 | 上限 |
|---|---|---:|---|
| `initial_registration` | 初回登録 | 50H | 初回のみ |
| `daily_open` | デイリーチェックイン | 1H | 当日の最初の有効通信で1回 |
| `activity_sync` | 歩数同期 | 2H | 1日1回 |
| `daily_step_goal` | 今日の歩数目標達成 | 5H | 1日1回 |
| `weekly_step_goal` | 週間歩数目標達成 | 20H | 週1回 |
| `thanks_received` | ありがとう受信 | 50H | 1日最大1回分 |
| `event_participation` | イベント参加 | 50H | イベントごとに1回 |

日次歩数目標は、本人が明示的に設定した `dailyStepGoal` を使用する。空欄、0、負数、小数、数値以外、1,000未満、100,000超は無効で、日次目標Hを付与しない。週間目標や標準週間目標を日次へ自動換算しない。

共通の日次目標は管理画面から明示的にONにした場合だけ使用する。初期値はOFF。

歩数の付与は当日の記録だけを対象とする。過去日付の入力・修正を後から行っても遡及付与しない。

### ご褒美

| キー | 名称 | 初期値 | 制限 |
|---|---|---:|---|
| `limited_badge` | 限定バッジ（Hサポーター） | 100H | 1人1回 |
| `rin_cafe` | Hカフェ | 500H | 1人月1回 |
| `rinchan_goods` | 限定りんちゃんグッズ | 1,000H | なし |
| `special_lottery` | 特別抽選応募 | 2,000H | なし |

Hカフェは「理事長とおごり自販機で飲み物1本＋5〜10分の雑談」を想定する。

## ON/OFF

- `point.enabled` が制度全体のスイッチ。
- OFF中は新規付与とご褒美交換を行わない。
- OFFにしても `point_transactions` の残高・累計・履歴は変更しない。
- 再度ONにした後は、その時点以降に発生した行動から付与する。
- OFF期間に発生した通常行動の自動遡及付与は行わない。
- 各付与条件と各ご褒美にも個別スイッチを持つ。

設定行が欠損した場合、全体または該当項目を無効・0Hとして扱う。初回セットアップ時に限り、初期設定を一括作成する。

## データ

`point_transactions` を正本とする。残高列を利用者シートに重複保持しない。

| 列 | 内容 |
|---|---|
| `transactionId` | 一意な取引ID |
| `employeeId` | 対象職員 |
| `amount` | 付与は正、交換は負 |
| `type` | `earn:*` または `reward:*` |
| `sourceId` | 元イベントの一意キー |
| `description` | 利用者向け説明 |
| `createdAt` | 発生日時 |
| `createdBy` | system、管理者、本人 |
| `rewardId` | ご褒美キー |
| `metadataJson` | 補足情報 |
| `version` | 保存時バージョン |
| `inputSource` | shortcut、manual、app、admin、system |
| `relatedRecordId` | 関連する活動・ありがとう・交換要求のID |

計算式：

```text
所持H = amount の全合計
累計獲得H = amount が正の取引だけの合計
```

交換は負の取引を追加する。過去取引を削除・上書きしない。

## 二重付与・二重交換防止

`employeeId + type + sourceId` の組み合わせを台帳内で確認してから追記する。確認と追記は Apps Script のスクリプトロック内で行う。

主な `sourceId`：

- 初回登録：`registration:{employeeId}`
- デイリーチェックイン：`daily_checkin:{employeeId}:{yyyy-mm-dd}`
- 歩数同期：`step_sync:{employeeId}:{yyyy-mm-dd}`
- 日次目標：`daily_goal:{employeeId}:{yyyy-mm-dd}`
- 週次目標：`weekly_step_goal:{週の月曜日}`
- ありがとう受信：`thanks_received:{employeeId}:{yyyy-mm-dd}`
- イベント参加：`event:{eventId}`
- ご褒美交換：`reward:{rewardKey}:{requestId}`

## 既存機能との整合性

H付与は、利用者登録・歩数保存・ありがとう保存が成功した後の副処理として行う。

H処理だけが失敗した場合：

1. 登録・歩数・ありがとうの本処理は成功のまま返す。
2. `error_logs` に `type=server_point`、`logs` に `action=pointAwardError` を記録する。
3. 管理者が原因を解消後、`adminRetryPointAward` を同じ `ruleKey`・`targetEmployeeId`・`sourceId` で実行する。
4. すでに付与済みなら二重付与せず `point_duplicate` で終了する。

OFFによるスキップはエラーではなく、再処理対象にしない。

## API

| action | 用途 |
|---|---|
| `getUserState` | デイリーチェックイン判定、今日の歩数・目標・付与状況・H状態取得 |
| `redeemPointReward` | 本人のご褒美交換 |
| `adminSettings` | 管理設定取得 |
| `adminSavePointSettings` | H設定保存 |
| `adminAwardEventPoints` | 管理者によるイベント参加付与 |
| `adminRetryPointAward` | 失敗した付与の管理者再処理 |

付与条件の判定、残高不足、月1回制限はすべてサーバー側で検証する。

## 管理画面

`管理画面 → H・その他設定` で以下を変更できる。

- 制度全体のON/OFF
- 各付与条件の名称、ON/OFF、付与H
- 各ご褒美の名称、ON/OFF、必要H
- 共通日次目標の使用、歩数、個人目標優先、未設定時のみ使用

付与Hは0〜100,000、ご褒美は1〜10,000,000の整数に制限する。負数や範囲外は保存しない。

## 一般画面

パスポートに以下を表示する。

- 所持H
- 累計獲得H
- 有効なご褒美
- 交換可否と不足H
- 直近5件の履歴

制度OFF中は「現在休止中」と表示し、H・ご褒美の操作を隠す。
