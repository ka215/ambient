# Phase 1 M2 E2E Baseline Test Report

**Date:** 2026-05-03
**Task:** M2 Playwright Setup & Baseline Execution (SC-001 ~ SC-006)
**Environment:** XAMPP local, http://dev2.ka2.org/amp/

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Total Tests | 18 (6 scenarios × 3 browsers) |
| Passed | 9 |
| Skipped | 9 |
| Failed | 0 |
| Duration | ~4.3 min |

## Browser Results

| Browser | Passed | Skipped | Failed |
|---------|--------|---------|--------|
| Chromium | 3 | 3 | 0 |
| Firefox | 3 | 3 | 0 |
| WebKit | 3 | 3 | 0 |

---

## Scenario Results

| ID | Scenario | Result | Notes |
|----|----------|--------|-------|
| SC-001 | 初期表示・プレイリスト準備状態 | ✅ Pass (all 3 browsers) | 単一プレイリスト未選択時: no-media + select 要素確認, 選択済時: アイテム列挙 |
| SC-002 | 再生/一時停止トグル | ⏭ Skip (all 3 browsers) | プレイリスト選択なし: `test.skip` 条件発動。XAMPP起動・プレイリスト選択後に再実行要 |
| SC-003 | 次/前ナビゲーション | ⏭ Skip (all 3 browsers) | SC-002 と同様、プレイリスト2件以上の選択状態が必要 |
| SC-004 | ボリュームスライダー操作 | ✅ Pass (all 3 browsers) | スライダーを35に設定し表示値と一致確認 |
| SC-005 | シャッフルトグル | ✅ Pass (all 3 browsers) | `#toggle-shuffle` の label クリックで状態反転確認 |
| SC-006 | YouTube IFrame 埋め込み | ⏭ Skip (all 3 browsers) | YouTube動画IDを持つプレイリスト項目が必要 |

---

## Investigation Notes

1. **baseURL 修正:** 当初 `http://localhost/dev2.ka2.org/amp/` を設定したが、XAMPPのVirtualHost設定により `http://dev2.ka2.org/amp/` が正しいエンドポイント。
   - 対応: `playwright.config.ts` に `process.env.E2E_BASE_URL || 'http://dev2.ka2.org/amp/'` を設定。
2. **page.goto('/') 問題:** Playwright の `baseURL + '/'` は `http://dev2.ka2.org/` (ドメインルート) に解決される。
   - 対応: `AmbientPage.gotoHome()` を `page.goto('./')` に修正。
3. **SC-005 Firefox失敗:** `input.check({ force: true })` がFirefoxでclickしても状態変更しない。
   - 対応: `#toggle-shuffle` (label) を直接 `.click({ force: true })` に変更。

---

## Known Risks

- SC-002/003/006 は実行前にプレイリスト選択状態が必要。自動化するには fixture でプレイリストを事前選択するか、URLパラメータ渡しの仕組みが必要。
- YouTube シナリオ（SC-006）はネットワーク接続と該当プレイリストデータが必要。

## Next Actions

- M3: プレイリスト選択をfixture内で行い、SC-002/003/006のスキップ解消。
- M3: git commit で現状をバージョン管理に記録。
- M3: TSビルド + E2E実行の合わせた総合検証レポート作成。
