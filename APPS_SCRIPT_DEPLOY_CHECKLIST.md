# Apps Script 反映チェックリスト

## 対象バージョン

- Apps Script: v1.4.8
- 診断画面: v1.4.9

## 目的

`user_reads` シートへ、お知らせ既読IDとありがとうの花受け取り済みIDを確実に保存できるようにする。

## GitHubで追加・更新されたApps Scriptファイル

| ファイル | 内容 |
|---|---|
| `apps-script/UserReads.gs` | 既読・花受け取り状態の保存関数を追加 |
| `apps-script/Config.gs` | `VERSION` を `v1.4.8` に更新 |

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
4. 保存
5. `setupProjectManual()` を一度実行
6. Webアプリを新しいバージョンでデプロイ
7. 公開URLは既存のまま変えない

## デプロイ後の確認

りんちゃんの杜の診断画面を開く。

```text
管理画面 → 動作診断 → サーバー確認
```

以下を確認する。

| 確認項目 | 正常値 |
|---|---|
| Apps Script version | `v1.4.8` 以降 |
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

### 診断画面で `v1.4.8` が出ない

Apps Script側の再デプロイが未完了、または古いデプロイURLを見ている可能性がある。

### `userReads` が `なし`

`UserReads.gs` がApps Script側に反映されていない、または `getUserState()` から `userReads` が返っていない。

### 確認しても未読に戻る

`markNewsRead` が失敗している可能性がある。診断画面の端末エラーログと `user_reads` シートの該当社員番号行を確認する。

### 花を受け取っても通知が戻る

`markThanksRead` が失敗している可能性がある。`user_reads.readThanksFlowerIds` に対象の `thanksId` が入っているか確認する。
