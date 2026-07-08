# TECH_DEBT

## 目的

りんちゃんの杜を長期運用できる状態にするため、技術的負債を見える化し、優先順位をつけて段階的に解消します。

## High

### CSS HotFixの乱立

状態:

- `v081` から `v1200` まで多数のCSSが存在
- 読み込み順への依存が強い
- 同じ指定が複数ファイルに分散している可能性がある

対応:

- すぐ削除しない
- Cleanupフェーズで分類・統合
- 画面単位で検証しながら整理

### キャッシュ番号の混在

状態:

- ホーム、杜、通信、歩数記録、マイページで番号が異なる

対応:

- 修正対象画面だけ更新
- Cleanupフェーズで一括統一を検討

### HTML内の読み込み過多

状態:

- 各HTMLで多数のCSS / JSを直接読み込んでいる

対応:

- 将来的に画面別bootファイルへ整理
- Core / Feature / World の責務を明確化

## Medium

### ありがとう機能の責務分散

状態:

- ホーム、杜、通信、マイページにありがとう関連UIが存在

対応:

- 現状は維持
- 将来的にThanks系モジュールの責務表をコードにも反映

### World系JSの重複リスク

状態:

- `mori-world.js`
- `mori-world-engine.js`
- `season-engine.js`
- `creature-engine.js`

が近い責務を持ち始めている。

対応:

- Phase2中は分離維持
- CleanupでWorldEngine構成へ再整理

### Boot / Patch系JS

状態:

- `v1138-home-boot.js`
- `v1138-mypage-boot.js`
- `v108-mypage-popup-fix.js`
- `v1027-mypage-optimistic.js`

などが存在。

対応:

- 動作確認後、Feature側へ統合候補

## Low

### インラインCSS / インラインJS

状態:

- 一部HTMLに直接styleやscriptが残っている

対応:

- 見た目・動作が安定した画面から外部ファイル化

### Apps Script構成の可視性不足

状態:

- GitHub上でApps Script全体構成が把握しにくい

対応:

- `ARCHITECTURE.md` に構成を追記
- 将来的にApps Scriptも機能別に整理

## 優先順位

1. キャッシュ番号の監査
2. HotFix CSSの分類
3. Boot系JSの役割確認
4. World系JSの責務整理
5. CSS統合
6. HTML読み込み整理

## 完了条件

- 画面ごとの読み込みファイルが把握できる
- Core / Feature / World の責務が明確
- 不要なHotFixを安全に削除または統合できる
- README / CHANGELOG / ROADMAP / ARCHITECTURE が最新状態を保っている
