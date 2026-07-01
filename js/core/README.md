# js/core

共通基盤を置くディレクトリ。

## 予定ファイル

- `storage.js`：localStorage 入出力、JSON安全処理
- `api.js`：Apps Script API 通信
- `sync.js`：差分同期、最終同期表示、UI再描画
- `offline-queue.js`：通信失敗時の未送信保存、自動再送

## 移行方針

現時点では既存の `v135-sync.js` と `v160-offline-queue.js` を正として運用する。
新しい core ファイルは、既存動作を壊さないことを確認しながら段階的に差し替える。
