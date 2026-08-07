# Codex Verify Scripts Inventory

Date: 2026-08-07
Status: completed
Source files:

- `.codex/verify_req3.cjs`
- `.codex/verify_req4.cjs`
- `.codex/verify_req5.cjs`
- `.codex/verify_req345.cjs`

## 1. Objective

Inventory the ad-hoc `.codex/verify_req*.cjs` scripts and either promote useful behavior into reusable test assets or remove obsolete scratch scripts.

## 2. Classification

| Source | Classification | Decision |
|---|---|---|
| `.codex/verify_req3.cjs` | Boot splash timing and centering probe | Promoted into `tests/e2e/utils/boot-trace.ts` and `sc-001-init.spec.ts`. |
| `.codex/verify_req4.cjs` | Local media upload, JSON save, and filepath fallback probe | Removed as scratch. Most behavior is covered by management/local-media E2E; fixed local paths and direct `debug.json` mutation are not suitable as reusable tests. |
| `.codex/verify_req5.cjs` | Media Edit required label/tooltip probe | Removed as scratch. Media Edit validation behavior is covered by `sc-015-media-edit.spec.ts`. |
| `.codex/verify_req345.cjs` | Combined v2.5.1 validation probe for requirements 3/4/5 | Removed as scratch after promoting only the reusable boot trace part. |

## 3. Promoted Assets

Added:

- `tests/e2e/utils/boot-trace.ts`

Updated:

- `tests/e2e/scenarios/sc-001-init.spec.ts`

The new utility installs a Playwright `addInitScript()` trace before page load and records:

- `data-boot` lifecycle samples
- splash class/display/opacity samples
- loader center delta from viewport center
- observed pending-to-transition and transition-to-ready timings when available

`sc-001-init.spec.ts` now asserts:

- boot starts from `pending`
- transition applies `app-boot-fadeout`
- boot reaches `ready`
- loader remains approximately centered within a small visual tolerance

## 4. Removed Scratch Files

Removed:

- `.codex/verify_req3.cjs`
- `.codex/verify_req4.cjs`
- `.codex/verify_req5.cjs`
- `.codex/verify_req345.cjs`

These scripts were fixed to a local URL and repository path, duplicated behavior now covered by maintained Playwright specs, and lived under ignored `.codex/` scratch space.

## 5. Validation

Executed validation:

```bash
npm run typecheck
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/run-e2e-env.ps1 -AmpEnv local -Port 8087 -PlaywrightArgs @('tests/e2e/scenarios/sc-001-init.spec.ts','--project=chrome')
```

Result:

- `npm run typecheck`: passed.
- `sc-001-init.spec.ts --project=chrome` in local mode: passed.

## 6. Open Risks

- The removed local media upload scratch script included direct `assets/debug.json` mutation and restore behavior. If exact local upload persistence coverage is required later, add a maintained Playwright scenario using isolated fixture files instead of reviving the scratch script.
- The boot trace assertion is intentionally small and focused. It is not a performance benchmark.
