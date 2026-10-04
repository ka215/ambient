# v2.6.6 Handoff: Cloud YouTube Media Add Fix

Branch: `feature/v2.6.6`

## Symptom

With `AMP_ENV=cloud`, adding a YouTube media item (valid URL, metadata applied, category selected) and pressing "Add New Media" showed no toast and left the button disabled. `AMP_ENV=local` worked.

## Root Cause

- The add button click handler in `src/scripts/ui/forms/media-management.ts` branched on `getAddType() !== 'youtube'`.
- `status.addtype` is `null` until the media-type radio is toggled, so the default YouTube case was treated as local media.
- In cloud mode local upload is disabled, so the local input mode is `url`. The handler then ran the local URL check, set an inline status message, and returned silently without a toast.
- In local mode the input mode defaults to `upload`, so this branch was never entered.
- The YouTube URL filter and the metadata flow were not involved.

## Fix

- Treat an unset add type as YouTube: `(getAddType() ?? 'youtube') === 'youtube'`.
- The same value is used for the artwork thumbnail branch.

## Changed Files

- `src/scripts/ui/forms/media-management.ts`
- `tests/e2e/scenarios/sc-023-cloud-youtube-add-default-type.spec.ts` (new regression test)
- `dist/assets/ambient.js` (rebuilt with `npm run build`; the previous build was stale from 2026-08-22)

## Validation

- Reproduced in cloud mode (PHP built-in server, mocked metadata API): no toast before the fix.
- SC-023 fails before the fix and passes after it.
- `npm run typecheck` passes.
- SC-010 (cloud MyPlaylist regressions): 17/17 passed on one full run.
- A second full run had 1 failure, and an earlier run failed a different test. Each failing test passes when run alone.
- All failures were ~48s timeouts on different tests, so they are treated as unrelated flakiness.

## Known Risks / Open Items

- The root cause of the SC-010 timeout flakiness (cloud-mode PHP built-in server) is not identified.
- Version bump is not part of this change; it is left to the release workflow.
