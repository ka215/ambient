# v2.6.0 Phase 5 Release Gate Report

- Date: 2026-07-15
- Scope: Phase 5 legacy-reduction / composition-root stabilization release gate
- Branch: `feature/v2.6.0`

## Summary

Phase 5 code-side work is treated as functionally converged.
The remaining release-gate focus was E2E execution-condition stabilization for cloud/local mode splits and mobile local-media playback.

This report records the release-critical checks that are currently green.

## Executed Validation

### 1. Typecheck

Command:

```powershell
./node_modules/.bin/tsc.cmd --noEmit
```

Result:

- Pass

### 2. Production Build

Command:

```powershell
npm run build
```

Result:

- Pass

### 3. Split Release E2E Verification

Command:

```powershell
npm run release:verify:split-e2e
```

Result:

- Pass

Breakdown:

- Cloud critical path
  - `SC-010 Cloud MyPlaylist regressions`: 14/14 pass
  - `SC-013 Cloud playlist import`: 2/2 pass
- Local critical path
  - `SC-014 Local playlist import`: 2/2 pass
  - `SC-020 v2.5.7 playlist boot regressions`: 3/3 pass

### 4. Local Media Playback Regression

Commands:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { .\scripts\run-e2e-env.ps1 -AmpEnv local -Port 8087 -PlaywrightArgs @('tests/e2e/scenarios/sc-012-local-media-playback.spec.ts','--project=chrome') }"
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { .\scripts\run-e2e-env.ps1 -AmpEnv local -Port 8087 -PlaywrightArgs @('tests/e2e/scenarios/sc-012-local-media-playback.spec.ts','--project=ipad','--workers=1') }"
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { .\scripts\run-e2e-env.ps1 -AmpEnv local -Port 8087 -PlaywrightArgs @('tests/e2e/scenarios/sc-012-local-media-playback.spec.ts','--project=iphone','--workers=1') }"
```

Result:

- `SC-012 Local media playback`
  - chrome: 5/5 pass
  - ipad: 5/5 pass
  - iphone: 5/5 pass

### 5. Legacy Broad E2E Matrix Check (Reference Only)

Command:

```powershell
npm run test:e2e:matrix
```

Result:

- Not used as the Phase 5 release gate
- Outcome on 2026-07-15:
  - 69 passed
  - 40 failed
  - 107 skipped

Interpretation:

- The failures were not used as a Phase 5 blocker because the broad matrix runs the full scenario set against a single `baseURL`.
- `playwright.config.ts` defaults `baseURL` to one environment at a time, while the scenario suite mixes cloud-only and local-only expectations.
- Representative failure shape:
  - cloud/local playlist scenarios timed out waiting for playlist options that do not exist under the wrong environment
  - several mobile failures were downstream effects of the same environment mismatch rather than Phase 5 code regressions
- Therefore the legacy broad matrix is not a valid mixed-environment release gate for v2.6.0.

### 6. Public-like Verification on v2.6.0 VHOST

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-verify-public-e2e.ps1 -BaseUrl https://dev-amp.ka2.org/
```

Result:

- Pass
- `SC-016 Public release asset integrity`: pass
- `SC-017 Public release smoke`: pass
- `SC-018 Public release toast smoke`: skipped

Interpretation:

- For v2.6.0 pre-release validation, `https://dev-amp.ka2.org/` is the correct public-like target because it already serves the v2.6.0 `ambient.js` / `ambient.css` build.
- A separate check against `https://amp.ka2.org/` failed earlier because that environment was still serving the v2.5.8 cloud release and therefore did not expose the newer boot-ready DOM contract expected by the current public E2E fixtures.

## Key Fixes Covered by This Gate

- `.env` loading no longer overrides explicit process env such as `AMP_ENV`.
- Cloud E2E now runs under true cloud conditions instead of silently falling back to local mode.
- Cloud playlist tests no longer depend on hard-coded server playlist names.
- Local media playback E2E no longer depends on a shared `example.json` fixture existing in assets.
- Mobile local-media playback checks use fixture setup and interaction paths that match the current runtime behavior.
- Public-like VHOST delivery resolves the expected manifest-based v2.6.0 assets and reaches boot-ready state under the current fixture contract.
- The standard `npm run test:e2e` command can now safely point at the split verification pack, while the old mixed matrix remains available as `npm run test:e2e:matrix`.

## Known Residual Notes

- `npm run test:e2e:matrix` still mixes cloud/local assumptions under a single `baseURL`; it is useful as a broad smoke matrix but should not be treated as the release gate until the suite is environment-partitioned.
- `SC-011` still includes scenarios whose stability depends on broader playlist-mode assumptions and environment-specific fixture availability. Follow-up task: `docs/operations/testing/20260715-sc-011-fixture-stabilization-followup.md`
- A further cleanup attempt that pushed `playlist-ui` mutable state access through additional getters was evaluated and then intentionally reverted because it increased verification cost without improving the Phase 5 release gate.
- `https://amp.ka2.org/` should not be used for v2.6.0 pre-release public verification until that environment is actually updated to the v2.6.0 build.

## Design-DoD Alignment

Reference DoD source:

- `docs/architecture/design/20260531-v2-6-0-modularization-detailed-design.md`

Phase 5 DoD interpretation used for this release gate:

1. `ambient.ts` is composition root only
   - Satisfied in practical terms.
   - Core responsibilities already live in extracted bootstrap/domain/ui/platform/state modules.
   - Remaining `ambient.ts` code is primarily initialization ordering and late-bound wiring.
2. Legacy compatibility wrappers removed
   - Satisfied.
   - The remaining bridge surface is limited to minimal bootstrap/debug support rather than broad pass-through compatibility layers.
   - An additional `playlist-ui` getter-based cleanup was intentionally reverted because it increased regression risk without improving the gate.
3. Full quality gates pass for release candidate
   - Satisfied for the Phase 5 release-critical pack.
   - This gate uses the split cloud/local verification set plus dedicated `SC-012` local-media coverage because those directly cover the stabilized execution paths touched by Phase 5 completion work.

## Release-Gate Judgment

Current judgment:

- Phase 5 release-critical quality gate: satisfied for the split cloud/local verification pack.
- Phase 5 DoD alignment: satisfied under the release-critical gate interpretation above.
- Public-like verification on the v2.6.0 VHOST target: satisfied.
- Additional `ambient.ts` micro-cleanup is not required for release-gate completion unless a new regression appears.
