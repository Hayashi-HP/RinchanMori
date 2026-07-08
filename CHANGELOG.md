# CHANGELOG

## v1.1.39
- トップページのヘッダーが表示されない問題を修正
- ホーム専用CSS `css/v1139-home-header-fix.css` を追加
- ヘッダーのりんちゃん顔、アプリ名、通信アイコン、通知バッジを強制表示するように調整
- ホーム関連ファイルのキャッシュを `1139` に更新

## v1.1.38
- 既読管理を端末内保存から `user_reads` シート中心のサーバー保存へ作り替え
- お知らせ確認は `markNewsRead` / `markRead` で `user_reads.readNewsIds` に保存
- ありがとうの花受け取りは `markThanksRead` で `user_reads.readThanksFlowerIds` に保存
- `getUserState` が `readNewsIds`、`readThanksFlowerIds`、`userReads` を返すように修正
- PCとスマホで既読・未読状態が同期されるように修正
- `user_reads` の列構成を `employeeId / readNewsIds / readThanksFlowerIds / updatedAt / version` に拡張
- ホーム、通信、マイページの関連JSキャッシュを `1138` に更新
- Apps Script版を `v1.1.38` に更新

## v1.1.37
- ログインしていない状態で、通知バッジに全員分のありがとう未受取数まで加算される問題を修正
- ゲスト状態の通知バッジは、お知らせ未読件数だけを表示するように変更
- 所属プルダウンの初期表示をスプレッドシート側と同じ並びに更新
- 古い所属候補が一瞬表示されないよう、所属候補の初期描画処理を調整
- 新規登録ページと通信ページの関連JSキャッシュを `1137` に更新

## v1.1.36
- マイページ「木の情報」の累計歩数ラベルが `累...` と省略される問題を修正
- 木の情報カードだけ、ラベルと数値を2段表示に変更
- 累計歩数の数値サイズと文字間を調整し、スマホ幅でも見切れにくく変更
- 専用CSS `css/v1136-tree-info-readable.css` を追加
