# 20260531 v2.5.2 Ticket D Test Plan

## Objective
Verify the v2.5.2 Ticket C’ fix that bootstraps cloud MyPlaylist in localStorage when no saved MyPlaylist exists.

## Scope
- Cloud boot with empty localStorage.
- Automatic MyPlaylist seed creation.
- MyPlaylist selection availability after boot.
- Media management usability after boot.
- Focused regression coverage for the existing cloud MyPlaylist suite.

## Test Cases
1. Clear localStorage before app boot in cloud mode.
2. Confirm the app creates an empty MyPlaylist seed in localStorage.
3. Confirm the current playlist resolves to MyPlaylist after boot.
4. Open media management and confirm the Add Media flow is usable after the bootstrap seed exists.
5. Confirm the seed persists as an empty playlist object with options only.

## Execution
- Playwright spec: tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts
- Case: bootstraps an empty MyPlaylist in cloud when localStorage is missing
- Browser project: chrome

## Acceptance Criteria
- MyPlaylist is created automatically when cloud boots without an existing localStorage playlist.
- The UI can switch to MyPlaylist and continue with media management.
- The new regression scenario passes on the local verification environment.
