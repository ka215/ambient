# Review Report: v2.3.0 First-Stage Vite Migration

Date: 2026-05-10  
Branch: `feature/v2.3.0-vite`  
Reviewer: Review Agent

## Findings

### Should Fix

1. `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md` が現実装と不整合
   - `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md:28-33` では、`src/styles/app.css` が `views/css/ambient.css` を取り込む前提のまま残っていますが、現状の実装は `src/styles/app.css` で `src/styles/tailwind.css` と `src/styles/ambient.scss` だけを取り込みます。
   - `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md:292-299` でも `views/css/ambient.css` を Vite bundle 入力として扱っていますが、現在は legacy fallback 専用です。
   - `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md:326-330` の「次の推奨作業」も更新前の内容が残っており、日本語版ランブックで整理済みの完了状況と一致していません。
   - 影響:
     - 実装自体の動作には影響しません。
     - ただし Vite 導入後の正本 CSS と fallback CSS の責務を誤認しやすく、次の保守作業で `views/css/ambient.css` を再編集してしまうリスクがあります。

### Nice to Have

1. HMR websocket 安定化は未完了
   - Apache reverse proxy 配下で websocket が時間経過後に切断される既知事象があります。
   - 現時点では、JS/CSS 読込、dev/build 切替、商用ビルド確認、主要 UI 動作に blocker ではありません。
   - 位置付けとしては、v2.3.0 の release blocker ではなく、後続の開発効率改善タスクです。

## Result Summary

- Vite による asset pipeline 導入本体は成立しています。
- PHP 側の dev/build 切替、`dist/manifest.json` と `dist/assets/*` を使った build 配信、`src/styles/*` への CSS 正本移管、legacy fallback の明示化は一貫しています。
- 既知の残件である HMR websocket 不安定は、現時点では blocker ではありません。
- ただし、英語ランブック 1 件だけ実装追従が遅れているため、**release readiness は「進行可。ただしドキュメント同期を先に済ませるのが望ましい」** です。

## Changed Files / Areas Reviewed

- `functions.php`
- `vite.config.mts`
- `package.json`
- `tsconfig.json`
- `src/scripts/ambient.ts`
- `src/styles/app.css`
- `src/styles/ambient.scss`
- `src/styles/tailwind.css`
- `views/css/ambient.css`
- `README.md`
- `README-ja.md`
- `.env.example`
- `nginx-sample.conf`
- `AGENTS.md`
- `docs/architecture/design/20260510-v2-3-0-vite-asset-pipeline-design-spec.md`
- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md`
- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook-ja.md`
- E2E/検証結果に関する会話上の実績

## Validation Executed

- コードレビュー:
  - `functions.php` の asset mode 切替と manifest 解決
  - `vite.config.mts` の dev/build 設定
  - `src/styles/app.css` と `src/styles/ambient.scss` の CSS 正本構成
  - `views/css/ambient.css` の legacy fallback 明示
- ドキュメントレビュー:
  - 設計書
  - 日本語ランブック
  - 英語ランブック
  - README / README-ja / `.env.example` / `nginx-sample.conf` / `AGENTS.md`
- 検証コマンド再実行:
  - `npm run typecheck`
  - `npm run build`
  - いずれもこのレビュー環境では `bash.exe: CreateFileMapping ... Win32 error 5` により再実行不能
- 参考にした既存検証実績:
  - dev/build の視覚確認済み
  - build モードのローカル確認済み
  - E2E は主要シナリオ通過、全件では teardown/timeouts の flaky のみ既知

## Known Risks

- 英語ランブックが古いままだと、CSS の正本が `src/styles/*` であることが伝わりにくい
- HMR websocket は未安定で、長時間の開発セッションではホットリロードが途切れる可能性がある
- レビュー環境上は `npm run typecheck` / `npm run build` を再実行できていないため、この報告の検証根拠は実コード確認と既存の検証実績に依存している

## Next Recommended Action

1. `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md` を日本語版ランブックの現状に合わせて同期する
2. その後、`feature/v2.3.0-vite` は **v2.3.0 へ進行可** と判断してよい
3. HMR websocket 安定化は別タスクとして切り出し、release blocker 扱いはしない
