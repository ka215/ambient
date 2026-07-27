# SC-011 Fixture / Environment Stabilization Follow-up

- Date: 2026-07-15
- Scope: `SC-011` playlist-mode slice と関連 fixture 依存シナリオの安定化
- Owner: test/debug follow-up

## Context

v2.6.0 の modularization / Phase 5 release gate では、release-critical pack を split cloud/local verification に限定し、`SC-011` 系は blocking から外した。

その判断自体は妥当だが、`SC-011` は次の理由で回帰解析コストを押し上げる。

1. playlist-mode の UI 変化が reorder / delete / quick-add / confirm modal の複数状態にまたがる
2. シナリオが fixture 可用性と DOM 状態の両方に依存しやすい
3. 単一 `baseURL` 実行時の environment mismatch が downstream failure を増幅しやすい

そのため、release gate 外であっても、追跡対象を明示して別タスク化しておく。

## Current Risk Shape

確認済みの論点:

- reorder mode 中に quick add が正しく隠れないケースがあった
- reorder handle / delete selector の表示が期待どおりに反映されないケースがあった
- reorder confirm modal の表示待ちが不安定になるケースがあった
- fixture の playlist 内容や UI 初期状態が変わると、playlist-mode 前提の観測点が崩れやすい

## Follow-up Tasks

1. `SC-011` を environment 前提つきで再分類する
- cloud/local のどちらで成立するシナリオかを明記する
- 単一 `baseURL` 依存のまま残すケースをなくす

2. playlist-mode fixture を専用化する
- reorder / delete / quick-add の前提を満たす最小 playlist fixture を scenario 専用に持つ
- server playlist 名や既存 asset 状態への暗黙依存を減らす

3. DOM readiness 観測点を固定する
- mode 切替後に観測すべき dataset / class / button visibility を統一する
- confirm modal は click 成功ではなく open state で待つ

4. split 実行導線を整える
- `npm run test:e2e:matrix` とは別に、必要なら playlist-mode 専用コマンドを追加する
- release gate へ戻す条件を事前に定義する

## Suggested Acceptance Criteria

次を満たしたら follow-up 完了とみなす。

1. `SC-011` が実行環境前提を明示した状態で再編されている
2. fixture が既存 playlist 実データに依存せずに self-contained になっている
3. reorder / delete / confirm modal の待機条件が DOM-ready ベースで安定している
4. 少なくとも chrome で連続再実行して安定通過する

## Recommended Commands

```powershell
npm run test:e2e:matrix
```

```powershell
./node_modules/.bin/playwright.cmd test tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts --project=chrome --workers=1
```

必要に応じて `run-e2e-env.ps1` を使い、environment を固定して切り分ける。

## Related Documents

- `docs/operations/test-reports/20260715-v2-6-0-phase5-release-gate-report.md`
- `docs/operations/handoffs/20260715-v2-6-0-modularization-completion-handoff.md`
- `docs/architecture/v2_6_0-system-summary.md`
