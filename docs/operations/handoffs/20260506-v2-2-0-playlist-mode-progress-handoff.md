# Handoff: feature/v2.2.0 プレイリストモード 進捗申し送り

**Date:** 2026-05-06  
**Branch:** `feature/v2.2.0`  
**Status:** Slice A/B 実装済・未コミット UI 改善あり / Slice C 未着手  
**Author:** Orchestrator

---

## 1. Result Summary

`feature/v2.2.0` ブランチにて、プレイリストモード機能の Slice A（モード Shell）と Slice B（削除モード）を実装・コミット済み。コミット後に複数の UI 改善と不具合修正を実施しているが、これらはまだ未コミットのままである。

---

## 2. コミット済み変更

| Commit | 内容 |
|--------|------|
| `8f0e89c` | feat(v2.2.0): Slice A — モードシェル（ヘッダーボタン、ドロップダウン、インタラクションロック、クイック追加ゲート） |
| `f7c474e` | feat(v2.2.0): Slice B — 削除モード（チェックボックス UI、確認モーダル、選択状態管理、localStorage 永続化） |
| `868eb40` | docs(v2.2.0): 設計仕様書・実装ハンドオフ追加 |

ベースブランチとの差分:  
`feature/v2.2.0` は `origin/main`（v2.1.1）から 3 コミット先行。

---

## 3. 未コミット変更（要コミット）

以下は `git status --short` で確認された未ステージ・未コミットの変更。

### 変更ファイル

| ファイル | 内容 |
|----------|------|
| `views/drawer-left.php` | モードボタン UI ポリッシュ（ヘッダーを flex レイアウトに変更、ラベル truncate、モードボタンに最小幅・SVG アイコン・各ドロップダウン項目アイコン追加、ドロップダウンに shadow 追加） |
| `src/scripts/ambient.ts` | 以下の機能追加・修正を含む（後述） |
| `assets/lang-ja.json` | `"Mode Change": "モード変更"` キー追加 |
| `assets/lang.json` | `"Mode Change": ""` キー追加（英語訳空白） |
| `dist/scripts/ambient.js` | TypeScript コンパイル済み出力 |
| `dist/scripts/ambient.js.map` | ソースマップ更新 |
| `dist/scripts/ambient.d.ts.map` | 型定義マップ更新 |
| `dist/tailwindcss.min.css` | Tailwind ビルド済み（`opacity-50`, `cursor-not-allowed` クラスを追加使用） |

### `src/scripts/ambient.ts` の変更内容

1. **モードボタン UI 同期の改善**  
   - `$PLAYLIST_MODE_BUTTON_ICON` / `$PLAYLIST_MODE_BUTTON_LABEL` DOM 参照を追加  
   - `syncPlaylistModeButton(mode)` 関数：モード変更時にボタン内のアイコン・ラベルをドロップダウン項目から動的にスワップ  
   - `updatePlaylistModeUI()` でバッジを常に非表示にし `syncPlaylistModeButton` を呼ぶよう変更  

2. **削除モードのコミットフロー変更**  
   - 旧: 別のモードへ切り替えた時に確認モーダルを表示  
   - 新: 削除モード中にモードボタンを押した瞬間（選択あり → モーダル表示、選択なし → 通常モードへ即時復帰）  

3. **プレイリスト空時のモードボタン無効化**  
   - `updatePlaylist()` の `is_no_media` ブロックで `#btn-playlist-mode` を `disabled` + `opacity-50 cursor-not-allowed` に設定  
   - アイテムがある状態に戻ると自動で有効化  
   - アイテムなし時にモードメニューが開いていた場合は `closePlaylistModeMenu()` を呼んで強制クローズ  

4. **「＋ メディアを登録する」ボタン修正**  
   - クリックイベントに `evt.stopPropagation()` を追加（ドロップダウンバブリングによる操作阻害を解消）  
   - `clearPlaylist()` 内のクローン再アタッチ時も同様  

5. **`openMediaManagement()` モーダル開き方の修正**  
   - 旧: `$BUTTON_OPTIONS.click()` → イベントバブリングで Flowbite の click-outside ハンドラが発火し即時クローズされていた  
   - 新: `new window.Modal(modalEl).show()` で Flowbite Modal API を直接呼び出し  
   - `isAlreadyOpen` パスでも `setTimeout(expandMediaAccordion, 50)` を使用して同期コールスタック問題を回避  

### 未追跡ファイル

| ファイル | 内容 |
|----------|------|
| `tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts` | Slice A/B + メディア未登録時の登録ボタン動作を検証する E2E テストシナリオ（全 5 テスト） |

---

## 4. E2E テスト状況

### sc-011 (Chrome) テスト結果

| # | テスト名 | 結果 |
|---|----------|------|
| 1 | モードボタン位置・ドロップダウン幅 | ✅ Pass |
| 2 | 非通常モードでの再生ロック（Slice A） | ✅ Pass |
| 3 | 削除モードキャンセル・選択維持（Slice B） | ✅ Pass |
| 4 | 削除適用・localStorage 永続化（Slice B） | ✅ Pass |
| 5 | メディア未登録時「＋メディアを登録する」→ オプションモーダル展開 | ✅ Pass |

**実行コマンド:** `npx playwright test sc-011 --project=chrome`

---

## 5. 残課題（未実装 / 未着手）

### Slice C: 並び替えモード（v2.2.0 スコープ内）

| 項目 | 詳細 |
|------|------|
| **SortableJS 導入** | `npm install sortablejs @types/sortablejs` を実行してから実装開始 |
| **DnD UI** | 並び替えモード時にリストアイテムにドラッグハンドルを表示 |
| **作業コピー管理** | 並び替え開始時の順序スナップショットを保持 |
| **確認モーダル** | 「変更を適用しますか？」確認後に localStorage へ書き込み |
| **キャンセル処理** | スナップショットを復元して DOM に再反映 |
| **モバイル対応** | iOS Safari でドラッグがドロワースクロールと競合しないことを確認 |

設計詳細: `docs/architecture/design/20260506-v2-2-0-playlist-mode-design-spec.md` § 9 Slice C 参照。

### その他の未着手事項

| 項目 | 優先度 | 備考 |
|------|--------|------|
| 未コミット変更のコミット | **高** | 上記 §3 の変更をまとめてコミットする。コミットメッセージ案: `feat(v2.2.0): polish mode button UI, disable on empty playlist, fix register-media modal` |
| Slice D: 編集モード | 低 | v2.3.0 スコープ。Edit 項目は現状ドロップダウンに表示あり（無効化予定） |
| Firefox/iPad/iPhone E2E | 中 | sc-011 の他プロジェクトでの検証が未完了 |

---

## 6. 検証済み動作（手動確認ポイント）

- [x] プレイリストアイテムあり時: モードボタン活性化、ドロップダウン開閉正常
- [x] プレイリストアイテムなし時: モードボタングレーアウト・無効化
- [x] 削除モード選択 → アイテムをチェック → ボタン押下 → 確認モーダル表示
- [x] 確認モーダルの「キャンセル」: 削除モードへ戻り選択状態を維持
- [x] 確認モーダルの「適用」: アイテム削除 + localStorage 更新 + 通常モードへ復帰
- [x] メディア未登録時「＋メディアを登録する」クリック → オプションモーダルが「メディア管理」展開状態で表示
- [x] 左ドロワーを閉じずにモーダルが開く

---

## 7. 次に行うべきアクション（推奨順）

### Step 1: 未コミット変更のコミット

```bash
git add assets/lang-ja.json assets/lang.json \
        src/scripts/ambient.ts \
        dist/scripts/ambient.js dist/scripts/ambient.js.map dist/scripts/ambient.d.ts.map \
        dist/tailwindcss.min.css \
        views/drawer-left.php
git add tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts
git commit -m "feat(v2.2.0): polish mode button UI, disable on empty playlist, fix register-media modal

- sync mode button icon/label from dropdown items on mode change
- mode button disabled + grayed when playlist has no items
- delete mode commit flow: trigger on button press (not on mode switch)
- stopPropagation on btn-add-media-from-drawer to prevent bubble blocking
- fix openMediaManagement: use Flowbite Modal API to avoid click-outside instant close
- add E2E sc-011 covering Slice A/B + no-media register button flow"
```

### Step 2: SortableJS インストール

```bash
npm install sortablejs @types/sortablejs
```

### Step 3: Slice C 実装

設計仕様書 §9 Slice C に従い実装。  
対象ファイル:
- `src/scripts/ambient.ts` — SortableJS 初期化、作業コピー管理、確認モーダル流用
- `views/drawer-left.php` — 並び替えモード時のドラッグハンドル HTML 追加（条件なし、CSS で表示切替）

### Step 4: sc-011 に Slice C テスト追加

`tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts` に以下シナリオを追加:
- 並び替えモードで項目を移動 → 適用 → localStorage の順序変更を確認
- 並び替えモードで項目を移動 → キャンセル → 元の順序に戻ることを確認

---

## 8. Known Risks

| リスク | 影響 | 対応方針 |
|--------|------|----------|
| SortableJS の iOS ドラッグとドロワースクロールの競合 | 中 | `scroll: false` オプションや touch delay 調整で対応。実機 iOS Safari での手動確認必須 |
| `window.Modal` (Flowbite) への依存 | 低 | Flowbite が `window.Modal` をエクスポートしていることを前提としている。Flowbite バージョンアップ時に再確認が必要 |
| 並び替えモード中にプレイリスト外部変更 | 低 | `setPlaylistMode('normal')` を呼び出すタイミングで状態が整合するため現状は許容範囲 |

---

## 9. 参照ファイル

- 設計仕様書: `docs/architecture/design/20260506-v2-2-0-playlist-mode-design-spec.md`
- E2E テスト: `tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts`
- 実装本体: `src/scripts/ambient.ts`
- ドロワー UI: `views/drawer-left.php`
- 翻訳ファイル: `assets/lang-ja.json`, `assets/lang.json`
