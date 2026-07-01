# JavaScript Refactor Plan

## 目的

v番号付きファイルを一気に削除せず、既存動作を保ったまま役割別ファイルへ段階移行する。

## 現在の方針

v0.9.60 では、主要画面すべてに以下の共通基盤を組み込んだ。

- v135-sync.js: 差分同期、最終同期表示、保存後の状態反映
- v160-offline-queue.js: 通信失敗時の未送信キュー、自動再送
- v051-auth.js: ログイン、初回登録、プロフィール保存

## 移行後の構成

```text
js/
├── core/
│   ├── config.js
│   ├── storage.js
│   ├── api.js
│   ├── sync.js
│   └── offline-queue.js
├── features/
│   ├── auth.js
│   ├── activity.js
│   ├── thanks.js
│   ├── news.js
│   ├── mori.js
│   ├── mypage.js
│   └── admin.js
└── legacy/
    └── README.md
```

## 移行順

1. `sync.js` と `offline-queue.js` を core 化
2. `auth.js` を分離
3. `activity.js` を分離
4. `thanks.js` を分離
5. `news.js` を分離
6. `mypage.js` を分離
7. `mori.js` を分離
8. `admin.js` を分離
9. 旧v番号付きファイルを legacy 扱いへ変更

## 重要ルール

- 1回の変更で旧ファイル削除と新ファイル導入を同時にしない
- 画面ごとに1つずつ読み込みファイルを差し替える
- 動作確認後に旧ファイルを legacy へ移す
- GitHub Pages のキャッシュ対策として、画面HTMLの `?v=` は必ず更新する

## v1.0 までの完了条件

- 同期、API、オフライン再送の共通化
- ログイン、登録、歩数、ありがとう、通信、杜、マイページ、管理画面の役割別整理
- README と CHANGELOG の更新
- Apps Script 側の分割構成維持
