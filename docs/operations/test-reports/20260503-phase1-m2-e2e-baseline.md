# Phase 1 M2 E2E Baseline Test Report

**Date:** 2026-05-03
**Task:** M2 Playwright Setup & Baseline Execution (SC-001 ~ SC-006)
**Environment:** XAMPP local, http://dev2.ka2.org/amp/

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Total Tests | 18 (6 scenarios × 3 browsers) |
| Passed | 18 |
| Skipped | 0 |
| Failed | 0 |
| Duration | ~1.9 min (`--workers=1`) |

## Browser Results

| Browser | Passed | Skipped | Failed |
|---------|--------|---------|--------|
| Chromium | 6 | 0 | 0 |
| Firefox | 6 | 0 | 0 |
| WebKit | 6 | 0 | 0 |

---

## Scenario Results

| ID | Scenario | Result | Notes |
|----|----------|--------|-------|
| SC-001 | 初期表示・プレイリスト準備状態 | ✅ Pass (all 3 browsers) | 単一プレイリスト未選択時: no-media + select 要素確認, 選択済時: アイテム列挙 |
| SC-002 | 再生/一時停止トグル | ✅ Pass (all 3 browsers) | `data-yt-phase` / `data-yt-seq` によるDOMシグナル待機を導入 |
| SC-003 | 次/前ナビゲーション | ✅ Pass (all 3 browsers) | YouTube再生開始シグナル検知後にナビゲーション検証 |
| SC-004 | ボリュームスライダー操作 | ✅ Pass (all 3 browsers) | スライダーを35に設定し表示値と一致確認 |
| SC-005 | シャッフルトグル | ✅ Pass (all 3 browsers) | `#toggle-shuffle` の label クリックで状態反転確認 |
| SC-006 | YouTube IFrame 埋め込み | ✅ Pass (all 3 browsers) | YouTubeプレイヤー生成シグナル検知後に埋め込みDOMを検証 |

---

## Investigation Notes

1. **baseURL 修正:** 当初 `http://localhost/dev2.ka2.org/amp/` を設定したが、XAMPPのVirtualHost設定により `http://dev2.ka2.org/amp/` が正しいエンドポイント。
   - 対応: `playwright.config.ts` に `process.env.E2E_BASE_URL || 'http://dev2.ka2.org/amp/'` を設定。
2. **page.goto('/') 問題:** Playwright の `baseURL + '/'` は `http://dev2.ka2.org/` (ドメインルート) に解決される。
   - 対応: `AmbientPage.gotoHome()` を `page.goto('./')` に修正。
3. **SC-005 Firefox失敗:** `input.check({ force: true })` がFirefoxでclickしても状態変更しない。
   - 対応: `#toggle-shuffle` (label) を直接 `.click({ force: true })` に変更。
4. **DOMシグナル検知型 Wait 戦略を導入:**
   - `AMP_STATUS` に `yt_phase` / `yt_seq` / `yt_error` を追加。
   - `body` 属性として `data-yt-phase` / `data-yt-seq` / `data-yt-error` を同期更新。
   - Playwright fixture 側で `waitForYouTubePhase()` を追加し、固定sleep依存を削減。
   - 属性名は `e2e` 接頭辞なしを採用（衝突回避は `yt-*` プレフィックスで担保）。

---

## Known Risks

- YouTube API自体の外部依存は残るため、ネットワーク断時は `data-yt-phase="api_error"` で失敗する。
- `getPlaylistData()` 内の `initStatus()` 呼び出しにより `yt_*` が `idle/0` に再初期化されるため、テストは必ず「操作前のseq採取」→「seq増加待ち」で扱う必要がある。

## Next Actions

- M3: `yt_phase` の許容遷移図（state machine）を docs に明文化。
- M3: `getPlaylistData()` の `initStatus()` 再初期化仕様を整理し、シグナル初期化ルールを統一。
- M3: TSビルド + E2E実行の総合検証レポートへ本方式を標準手順として反映。
