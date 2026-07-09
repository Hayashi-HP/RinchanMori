# Apps Script 反映チェックリスト

## 対象バージョン

- Apps Script: v1.4.10
- 診断画面: v1.4.9

## 目的

`user_reads` シートへ、お知らせ既読IDとありがとうの花受け取り済みIDを確実に保存できるようにする。

## GitHubで追加・更新されたApps Scriptファイル

| ファイル | 内容 |
|---|---|
| `apps-script/UserReads.gs` | 既読・花受け取り状態の保存関数を追加 |
| `apps-script/Config.gs` | `VERSION` を `v1.4.10` に更新 |
| `apps-script/Code.gs` | `testUserReadsManual()` を追加 |

## 反映前の確認

Googleスプレッドシートに以下のシートがあることを確認する。

- `user_reads`

ヘッダーは以下。

```text
employeeId, readNewsIds, readThanksFlowerIds, updatedAt, version
```

なければ、Apps Scriptの `setupProjectManual()` を実行する。

## 反映手順

1. Google Apps Scriptを開く
2. GitHubの `apps-script/UserReads.gs` を新規ファイルとして追加
3. GitHubの `apps-script/Config.gs` の内容をApps Script側へ反映
4. GitHubの `apps-script/Code.gs` の内容をApps Script側へ反映
5. 保存
6. `setupProjectManual()` を一度実行
7. `testUserReadsManual()` を一度実行
8. 実行ログに `ok: true` が出ることを確認
9. スプレッドシートの `user_reads` に社員番号 `2110401` の行が追加・更新されていることを確認
10. Webアプリを新しいバージョンでデプロイ
11. 公開URLは既存のまま変えない

## Apps Scriptエディタでの単体テスト

`testUserReadsManual()` を実行すると、以下をテスト保存します。

- `manual-test-news-日時`
- `manual-test-thanks-日時`

正常なら、ログに以下のような結果が出る。

```json
{
  "ok": true,
  "version": "v1.4.10",
  "employeeId": "2110401",
  "userReads": {
    "employeeId": "2110401",
    "readNewsIds": ["manual-test-news-..."],
    "readThanksFlowerIds": ["manual-test-thanks-..."]
  }
}
```

## デプロイ後の確認

りんちゃんの杜の診断画面を開く。

```text
管理画面 → 動作診断 → サーバー確認
```

以下を確認する。

| 確認項目 | 正常値 |
|---|---|
| Apps Script version | `v1.4.10` 以降 |
| getUserState | 成功 |
| userReads | あり |
| readNewsIds | 件数表示あり |
| readThanksFlowerIds | 件数表示あり |

## 実機確認

1. 通信画面で未読のお知らせを確認する
2. ホームへ戻る
3. 通信画面を再度開く
4. 既読に戻らないことを確認
5. マイページでありがとうの花を受け取る
6. ホームへ戻る
7. 花通知が消えることを確認
8. Safariを閉じて再度開く
9. 既読と花受け取り状態が戻らないことを確認

## 失敗時の見方

### 診断画面で `v1.4.10` が出ない

Apps Script側の再デプロイが未完了、または古いデプロイURLを見ている可能性がある。

### `testUserReadsManual()` が失敗する

`UserReads.gs` が未反映、または `getUserState()` / `rowToObject()` / `findRowByValue()` など既存共通関数との接続に問題がある。

### `userReads` が `なし`

`UserReads.gs` がApps Script側に反映されていない、または `getUserState()` から `userReads` が返っていない。

### 確認しても未読に戻る

`markNewsRead` が失敗している可能性がある。診断画面の端末エラーログと `user_reads` シートの該当社員番号行を確認する。

### 花を受け取っても通知が戻る

`markThanksRead` が失敗している可能性がある。`user_reads.readThanksFlowerIds` に対象の `thanksId` が入っているか確認する。
