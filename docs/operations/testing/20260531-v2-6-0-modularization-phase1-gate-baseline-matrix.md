# 20260531 v2.6.0 Modularization Phase 1 Gate Baseline Verification Matrix

## Objective
Establish pre-Phase 1 baseline and parity checkpoints so the team can decide Go/No-Go for modularization extraction.

## Inputs
- docs/architecture/design/20260531-v2-6-0-modularization-detailed-design.md
- docs/operations/handoffs/20260531-v2-6-0-modularization-orchestrator-handoff.md
- AGENTS.md

## Scope
- Baseline behavior parity before Phase 1 extraction.
- Storage compatibility checks for AmbientUserData and AmbientMyPlaylist.
- Cross-player parity checks for YouTube, video, and audio.
- Focused regression and gate readiness evidence.

## Preconditions
1. Branch: feature/v2.5.3.
2. Test URL available (example: http://127.0.0.1:8099/).
3. Local storage can be read from browser devtools.
4. Existing E2E environment is runnable.

## Execution Commands
- Static gate:
  - npm run typecheck
  - npm run build
- E2E gate:
  - npm run test:e2e
- Focused E2E rerun (if triage needed):
  - E2E_BASE_URL=http://127.0.0.1:8099/ npx playwright test --project=chrome

## Baseline Verification Matrix
| ID | Scenario | Steps (concise) | Checkpoints | Evidence to Capture | Pass Criteria |
|---|---|---|---|---|---|
| B-01 | Baseline boot and initial render | Start app and open top page in cloud mode and local mode. | App boots without fatal error, playlist area renders, player area renders. | Screenshot of initial UI, console log snapshot. | No boot failure in both modes. |
| B-02 | Playlist/category switch and resume context | Switch playlist and category, reload page, verify restored context. | Previous context is restored without mismatch. | Before/after screenshots, localStorage snapshot. | Same behavior as pre-modularization baseline. |
| S-01 | Storage key presence and shape | After boot and interaction, inspect localStorage keys. | AmbientUserData exists and is valid JSON. AmbientMyPlaylist behavior matches mode policy. | Devtools storage export or copied key/value. | Keys and payloads are backward compatible. |
| S-02 | MyPlaylist load/save compatibility | Select MyPlaylist, add minimal change, reload. | MyPlaylist persistence remains stable and readable. | Storage diff before/after, UI screenshot. | No schema drift or unreadable payload. |
| P-01 | Player parity: play/pause/ended | For YouTube/video/audio, run play, pause, resume, ended transition. | State transitions are equivalent across all three players. | Per-player short log table. | No player-specific drift in core transitions. |
| P-02 | Player parity: seek/fader | For YouTube/video/audio, test startSec/endSec and fade in/out boundaries. | Seek/fader timing behavior is equivalent and stable. | Timer behavior notes, capture of boundary timestamps. | No early/late transition regression. |
| P-03 | Player parity: volume/error reflection | For YouTube/video/audio, change volume and trigger recoverable error path. | Volume UI/state matches actual output. Error state is reflected consistently. | UI screenshot + console excerpt for each player. | Volume and error reflection parity is maintained. |
| R-01 | Existing regression smoke | Run existing critical E2E suite. | Critical scenarios remain green. | Playwright summary output and failing test links if any. | No new critical regression introduced. |
| G-01 | Gate decision synthesis | Summarize B/S/P/R results and classify blockers. | Go/No-Go decision is explicit with rationale. | Filled test report template. | Decision is auditable and reproducible. |

## Checkpoint Rules
1. Any FAIL in S-01, S-02, or P-01 to P-03 is No-Go.
2. Any build/typecheck failure is No-Go.
3. R-01 may be conditional only when failure is proven unrelated; record rationale.
4. Unknown or missing evidence is treated as FAIL until reproduced.

## Evidence Packaging
- Store final report under docs/operations/test-reports/ with date prefix 20260531.
- Include command lines, PASS/FAIL per scenario, and artifact links/paths.
- Separate observed facts from root cause notes.
