# Review Report: Ambient v2.2.0 → v2.2.x パッチ候補

**Date:** 2026-05-07  
**Reviewer:** Review Agent  
**Target:** v2.2.0 リリース済み実装  
**Purpose:** v2.2.x パッチアップで対応すべき改善課題・残存不具合の洗い出し

---

## Executive Summary

v2.2.0（Slice A/B/C）の実装は設計仕様に概ね準拠しており、E2E シナリオ（sc-011）も主要フローをカバーしている。ただし、**モードボタンのスコープ制御漏れ**（非 MyPlaylist プレイリスト選択中でも削除・並び替えモードが動作し、in-memory 状態を無言で破壊する）と、**SortableJS のドラッグビジュアルフィードバック用 CSS 未定義**の 2 点が機能的リスクとして Must Fix に分類される。翻訳欠落・モーダル外クリック未実装・定数重複宣言・テストカバレッジ不足が Should Fix に続く。

---

## 発見事項

### Must Fix（必須修正）

| # | 分類 | 対象ファイル | 問題内容 | 根拠 |
|---|------|------------|---------|------|
| M-1 | 機能的正確性 | `src/scripts/ambient.ts` / `views/drawer-left.php` | **モードボタンが非 MyPlaylist プレイリスト選択中も有効**。クラウドモードで JSON ファイルプレイリストに切り替えた後もモードボタンが enabled のまま操作可能。`applyDeleteSelections()` / `applyReorderChanges()` は `AMP_STATUS.media` をメモリ上で書き換えるが、`persistMyPlaylistIfNeeded()` は `AMP_STATUS.playlist !== 'MyPlaylist.json'` の場合 no-op で true を返す。結果として UI 上はアイテムが消えたように見えるが、ページリロードで元に戻り、ユーザーを誤解させる。モードボタンは非 MyPlaylist 時に `hidden` または `disabled` にすべき。 | 設計仕様 §3「Target playlist for mutable operations remains cloud `MyPlaylist` only」 |
| M-2 | UI/UX品質 | `src/scripts/ambient.ts` / CSS ファイル全体 | **SortableJS ドラッグ用 CSS クラスが未定義**。SortableJS に `ghostClass: 'playlist-reorder-ghost'`・`chosenClass: 'playlist-reorder-chosen'`・`dragClass: 'playlist-reorder-drag'` を指定しているが、`src/styles/ambient.scss` / `views/css/ambient.css` いずれにも対応するルールが存在しない。ドラッグ中のゴースト要素が通常アイテムと視覚的に区別できず、並び替え操作の視認性が著しく低い。 | SortableJS 公式ドキュメント: ghostClass 等は CSS で別途スタイルを当てる必要がある |

---

### Should Fix（推奨修正）

| # | 分類 | 対象ファイル | 問題内容 | 根拠 |
|---|------|------------|---------|------|
| S-1 | 翻訳 | `assets/lang.json` | **英語翻訳ファイルに `"Register media"` キーが存在しない**。`lang-ja.json` には `"Register media": "メディアを登録する"` が定義済みだが、`lang.json` には当該キー自体が欠落している。 | `lang-ja.json` との非対称 |
| S-2 | 翻訳 | `assets/lang-ja.json` | **日本語翻訳が空白のまま**。`"This section provides various tools to manage your playlists."` の値が `""` のまま。 | `lang-ja.json` line 91 |
| S-3 | UI/UX品質 | `views/drawer-left.php` / `src/scripts/ambient.ts` | **確認モーダル（`modal-playlist-confirm`）の外側クリックで閉じない**。オプションモーダルは外側クリック対応済みだが、`#modal-playlist-confirm` にはオーバーレイ外クリックのイベントハンドラが未実装。操作途中のユーザーが誤ってモーダル外をタップした際にキャンセルできない。 | UX 一貫性（オプションモーダルとの非対称） |
| S-4 | コード品質 | `src/scripts/ambient.ts` | **`MYPLAYLIST_NAME` 定数の二重宣言**。モジュールスコープと `applyCloudEditRestrictions()` 内部で同名定数が宣言されており、後者が前者をシャドーイングしている。値は同一だが将来の変更時に片方だけ更新するミスが生じやすい。 | コードの保守性 |
| S-5 | テストカバレッジ | `tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts` | **JSON プレイリスト選択中のモードボタン無効化が E2E で未検証**。M-1 の修正後、非 MyPlaylist 時にモードボタンが非活性になることの回帰テストが必要。Firefox・Safari での検証もゼロ。 | ハンドオフ既知リスク |
| S-6 | 機能的正確性 | `views/drawer-left.php` / `src/scripts/ambient.ts` | **ローカル（非クラウド）環境でもモードボタンが表示される**。`drawer-left.php` にはモードボタンを cloud 限定で出す PHP 条件分岐が存在しない。非クラウド環境では削除・並び替えがメモリ上のみで反映されてリロードで消える。M-1 対応時に合わせて対処が望ましい。 | 設計仕様 §3 |

---

### Nice to Have（改善提案）

| # | 分類 | 対象ファイル | 問題内容 | 根拠 |
|---|------|------------|---------|------|
| N-1 | コード品質 | `src/scripts/ambient.ts` | **`(window as any).AmbientData` が 10 箇所以上に散在**。モジュール先頭で一度だけキャプチャするか、ヘルパー関数に統一するとメンテが楽になる。 | コードの重複削減 |
| N-2 | アクセシビリティ | `views/drawer-left.php` | **`#btn-playlist-mode` に `aria-label` がない**。スクリーンリーダー向けに適切な `aria-label` を付与するとよい。 | WCAG 2.1 SC 4.1.2 |
| N-3 | UI/UX品質 | `src/scripts/ambient.ts` | **SortableJS `forceFallback: true` がデスクトップでも有効**。タッチデバイス判定で分岐することで PC 体験を向上できる。 | Known Risk への対処と PC 体験のトレードオフ |
| N-4 | テストカバレッジ | `tests/e2e/scenarios/` | **並び替えモードの E2E が DOM 操作ベースのみ**。SortableJS の実際のドラッグイベント（`onEnd`）を経由していない。Playwright の mouse drag API を使った実 DnD シナリオを 1 件以上追加することを推奨。 | テスト信頼性 |

---

## リリース準備評価

**v2.2.1 最小パッチとして推奨するスコープ（優先順）:**

1. **M-1 + S-6 対応**: `updatePlaylist()` 等で非 MyPlaylist 時 / ローカル環境時にモードボタンを `hidden` または `disabled` にするガードを追加。
2. **M-2 対応**: `src/styles/ambient.scss` に `playlist-reorder-ghost` / `playlist-reorder-chosen` / `playlist-reorder-drag` の CSS ルールを追加。
3. **S-1 / S-2 対応**: `lang.json` に `"Register media": ""` を追加、`lang-ja.json` の空白翻訳を補完。
4. **S-3 対応**: `modal-playlist-confirm` のオーバーレイにクリックイベントを追加してキャンセル動作に統一。
5. **S-4 対応**: `applyCloudEditRestrictions()` 内の `MYPLAYLIST_NAME` 再宣言を削除してモジュールスコープ定数を参照させる。

N-1〜N-4 は v2.3.0 前の品質底上げとして積み残しタスク化を推奨。

---

## Known Risks（未解決リスク）

| リスク | 深刻度 | 対策状況 |
|--------|--------|---------|
| iOS Safari でのドラッグ操作とドロワースクロールの競合 | 中（実機未確認） | `forceFallback: true` で一定軽減されているが手動実機確認が未完了 |
| Flowbite の `window.Modal` API 依存（バージョンアップ時の破壊的変更リスク） | 低〜中 | `modal-playlist-confirm` は独自実装済みのため現状影響なし |
| sc-011 E2E が Firefox / iPad / iPhone で未実行 | 中 | Chromium のみ検証済み |
| `applyReorderChanges()` の `reorderCategoryId` 境界条件 | 低 | カテゴリー切替で自動リセットされるため現状リスクは低い |
