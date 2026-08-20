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
| SC-001 | Initial display and playlist ready state | Pass (all 3 browsers) | Verified no-media and select elements when no single playlist is selected; verified item listing when a playlist is selected |
| SC-002 | Play/pause toggle | Pass (all 3 browsers) | Added DOM signal waiting through `data-yt-phase` and `data-yt-seq` |
| SC-003 | Next/previous navigation | Pass (all 3 browsers) | Verified navigation after detecting the YouTube playback start signal |
| SC-004 | Volume slider operation | Pass (all 3 browsers) | Set the slider to 35 and verified the displayed value |
| SC-005 | Shuffle toggle | Pass (all 3 browsers) | Verified state change by clicking the `#toggle-shuffle` label |
| SC-006 | YouTube IFrame embed | Pass (all 3 browsers) | Verified embedded DOM after detecting the YouTube player creation signal |

---

## Investigation Notes

1. **baseURL correction:** The initial value was `http://localhost/dev2.ka2.org/amp/`, but the XAMPP VirtualHost configuration makes `http://dev2.ka2.org/amp/` the correct endpoint.
   - Action: Set `process.env.E2E_BASE_URL || 'http://dev2.ka2.org/amp/'` in `playwright.config.ts`.
2. **`page.goto('/')` issue:** Playwright resolves `baseURL + '/'` to `http://dev2.ka2.org/`, the domain root.
   - Action: Changed `AmbientPage.gotoHome()` to `page.goto('./')`.
3. **SC-005 Firefox failure:** `input.check({ force: true })` did not change state when clicked in Firefox.
   - Action: Clicked the `#toggle-shuffle` label directly.
4. **DOM signal wait strategy:**
   - Added `yt_phase`, `yt_seq`, and `yt_error` to `AMP_STATUS`.
   - Synchronized `data-yt-phase`, `data-yt-seq`, and `data-yt-error` as `body` attributes.
   - Added `waitForYouTubePhase()` to the Playwright fixture to reduce fixed-sleep dependency.
   - Used attribute names without an `e2e` prefix; collision avoidance is handled by the `yt-*` prefix.

---

## Known Risks

- The YouTube API remains an external dependency, so network loss can still fail with `data-yt-phase="api_error"`.
- `initStatus()` inside `getPlaylistData()` resets `yt_*` to `idle/0`; tests must capture the sequence before the action and then wait for sequence increase.

## Next Actions

- M3: Document the allowed `yt_phase` transition diagram as a state machine.
- M3: Clarify `initStatus()` reset behavior inside `getPlaylistData()` and standardize signal initialization rules.
- M3: Reflect this strategy as the standard approach in the combined TypeScript build and E2E validation report.
