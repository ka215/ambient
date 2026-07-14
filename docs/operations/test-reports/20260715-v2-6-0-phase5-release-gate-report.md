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

## Key Fixes Covered by This Gate

- `.env` loading no longer overrides explicit process env such as `AMP_ENV`.
- Cloud E2E now runs under true cloud conditions instead of silently falling back to local mode.
- Cloud playlist tests no longer depend on hard-coded server playlist names.
- Local media playback E2E no longer depends on a shared `example.json` fixture existing in assets.
- Mobile local-media playback checks use fixture setup and interaction paths that match the current runtime behavior.

## Known Residual Notes

- `SC-011` still includes scenarios whose stability depends on broader playlist-mode assumptions and environment-specific fixture availability.
- A further cleanup attempt that pushed `playlist-ui` mutable state access through additional getters was evaluated and then intentionally reverted because it increased verification cost without improving the Phase 5 release gate.

## Release-Gate Judgment

Current judgment:

- Phase 5 release-critical quality gate: satisfied for the split cloud/local verification pack.
- Additional `ambient.ts` micro-cleanup is not required for release-gate completion unless a new regression appears.
