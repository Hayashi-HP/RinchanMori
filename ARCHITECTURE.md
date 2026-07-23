# ARCHITECTURE

## 目的

りんちゃんの杜は、職員の健康づくりと職場内コミュニケーションを促進するWebアプリです。
歩数記録、杜の成長、ありがとう、通信、マイページを通じて、毎日開きたくなる院内健康アプリを目指します。

## 現在バージョン

v1.2.0

## 基本構成

```text
GitHub Pages
  ↓
HTML / CSS / JavaScript
  ↓
Apps Script Web API
  ↓
Google Sheets
```

## 画面構成

| 画面 | ファイル | 役割 |
|---|---|---|
| ホーム | `index.html` | 今日の状態、花通知、歩数導線、杜だより |
| 杜 | `pages/mori.html` | 部署マップ、杜の成長、世界観表示 |
| 歩数記録 | `pages/activity.html` | 歩数入力、最近の記録 |
| 通信 | `pages/news.html` | 今日のまとめ、お知らせ、ありがとうの広がり |
| マイページ | `pages/mypage.html` | プロフィール、花受け取り、ありがとう履歴、目標 |
| ログイン | `pages/login.html` | 既存ユーザーログイン |
| 新規登録 | `pages/register.html` | 初回登録 |
| 管理 | `pages/admin.html` | 管理機能 |

## JavaScript構成

### Core

| ファイル | 役割 |
|---|---|
| `js/core/storage.js` | localStorage読み書き、端末ID、参加者情報 |
| `js/core/api.js` | Apps Script API通信 |
| `js/core/sync.js` | サーバー同期、状態反映、同期ステータス |
| `js/core/offline-queue.js` | 通信失敗時の未送信キュー |
| `js/core/error-log.js` | エラーログ |
| `js/core/rinchan-modal.js` | りんちゃんモーダル |

### Features

| ファイル | 役割 |
|---|---|
| `js/features/auth.js` | 認証・ログイン状態 |
| `js/features/activity.js` | 歩数記録 |
| `js/features/news.js` | 通信・お知らせ・まとめ |
| `js/features/mypage.js` | マイページ描画 |
| `js/features/thanks.js` | ありがとう送信、受信、履歴、既読同期 |
| `js/features/thanks-home-notice.js` | ホームの花通知 |
| `js/features/points.js` | 所持りん・履歴・ご褒美・交換 |
| `js/features/flower-receive-effect.js` | 花受け取り演出 |
| `js/features/mori.js` | 杜マップ・部署カード |
| `js/features/mori-thanks-confirm.js` | ありがとう送信時の相手確認UI |
| `js/features/mori-world.js` | ありがとうの花、ちょうちょ、小鳥、杜だより |
| `js/features/mori-world-engine.js` | 時間・季節・雲・葉っぱ・星の世界エンジン |
| `js/features/season-engine.js` | 季節メッセージ |
| `js/features/growth.js` | 木の成長 |
| `js/features/chart.js` | 歩数チャート |
| `js/features/voice.js` | りんちゃんの言葉 |

## CSS構成

現在は段階的なHotFixファイルが多く存在します。
当面は削除せず、安定運用を優先します。

### 主な分類

| 分類 | 例 | 方針 |
|---|---|---|
| Core | `style.css`, `ui-v042.css` | 基本UI |
| Page Fix | `v097-home-fixes.css`, `v113-mori-groups.css` | 画面別調整 |
| HotFix | `v1013-hotfix.css`, `v1014-hotfix.css` | 既存不具合修正。後日統合候補 |
| World | `v1067-mori-world.css`, `v1200-mori-world-engine.css` | 杜の世界観 |
| Responsive | `v128-mobile-polish.css`, `v1140-desktop-layout-fix.css` | スマホ・PC調整 |

## データ方針

正式データは Google Sheets を正とします。
ブラウザの localStorage は即時表示とオフライン補助のためのキャッシュです。

## 主なlocalStorageキー

| キー | 内容 |
|---|---|
| `rinchanParticipant` | ログイン中ユーザー |
| `rinchanActivities` | 自分の歩数記録 |
| `rinchanAllActivities` | 全体の歩数記録 |
| `rinchanMoriMembers` | 杜に表示するメンバー |
| `rinchanDepartments` | 部署一覧 |
| `rinchanSentThanks` | 送ったありがとう |
| `rinchanReceivedThanks` | 受け取ったありがとう |
| `rinchanGoodTimeline` | 公開ありがとうタイムライン |
| `rinchanReadNewsIds` | 既読お知らせID |
| `rinchanReadThanksFlowerIds` | 受け取り済み花ID |
| `rinchanUserReads` | 既読情報一式 |
| `rinchanThanksStats` | ありがとう統計 |
| `rinchanForestSummary` | 今日の杜まとめ |
| `rinchanPendingQueue` | 未送信キュー |

## Apps Script / Sheets想定構成

| データ | 用途 |
|---|---|
| participants | 参加者・プロフィール |
| activities | 歩数記録 |
| thanks | ありがとう送受信 |
| notices | お知らせ |
| user_reads | お知らせ・花の既読同期 |
| departments | 部署一覧 |
| settings | 運用設定 |
| point_transactions | ポイント付与・交換の追記専用台帳 |
| error_logs | エラー記録 |

## 同期フロー

```text
アプリ起動
  ↓
localStorageで即時表示
  ↓
RinchanSync.sync()
  ↓
Apps Script getUserState
  ↓
Google Sheetsから最新状態取得
  ↓
RinchanSync.applyState()
  ↓
各画面を再描画
```

## ありがとう機能の責務

| 場所 | 役割 |
|---|---|
| 杜 | 相手を選んでありがとうを送る |
| ホーム | 未受取の花通知 |
| マイページ | 花を受け取る、履歴を見る |
| 通信 | ありがとうの広がりを全体表示 |

### 重要ルール

- 自分が送ったありがとうは、自分宛の花として表示しない
- 花を受け取れるのは受信者本人のみ
- 既読・受け取り状態は `user_reads` を正とする
- ありがとう送信時のみ、本名を補助表示して誤送信を防ぐ
- ありがとうは1日2人まで送信できる
- 同じ相手へは送信日から7日後に再送できる
- 自分自身には送信できない
- 送信制限は画面表示だけでなく Apps Script 側でも判定する

## Phase2 世界観の責務

| モジュール | 役割 |
|---|---|
| `mori-world.js` | ありがとうに応じた花・ちょうちょ・小鳥・杜だより |
| `mori-world-engine.js` | 時間帯・季節・雲・葉っぱ・星 |
| `season-engine.js` | 季節メッセージ |

今後は World 系モジュールを整理し、重複を減らす予定です。

## バージョン管理ルール

- READMEの現在バージョンを必ず更新する
- CHANGELOGへ変更内容を必ず追記する
- ROADMAPへ進捗変更を反映する
- 設計に影響する変更は ARCHITECTURE へ反映する
- キャッシュ番号は原則として現在バージョンに合わせる
- 同じファイルをPC・スマホ別チャットで同時更新しない

## 品質ゲート

新機能を完成扱いにする前に、以下を確認します。

- スマホ表示
- PC表示
- フッターナビ
- ゲスト表示
- ログイン後表示
- 同期前表示
- 同期後表示
- README更新
- CHANGELOG更新
- 必要に応じてROADMAP / ARCHITECTURE更新

## 技術的負債

現時点で認識している負債は以下です。

- HotFix CSSが多い
- 画面ごとにキャッシュ番号が異なる
- 一部のHTMLにインラインCSS・インラインJSが多い
- World系JSの責務が今後重複しやすい
- Apps Script側の構成がREADMEから把握しにくい

これらは機能を止めずに、段階的に整理します。
