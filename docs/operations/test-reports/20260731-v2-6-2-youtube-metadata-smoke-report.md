# v2.6.2 YouTube Metadata Smoke Test Report

Date: 2026-07-31
Target: v2.6.2 YouTube Data API metadata assistance
Environment: `feature/v2.6.2`, `https://dev-amp.ka2.org/`
Reporter: User manual smoke + Codex implementation follow-up

## Summary

The v2.6.2 YouTube metadata assistance was manually smoke-tested with a valid `YOUTUBE_DATA_API_KEY`.

The core server-side requirements were confirmed:

1. The internal metadata endpoint can call the real YouTube Data API.
2. The server-side usage counter file is created.
3. `youtubeMetadataRequests` increments.
4. Monthly limit enforcement blocks metadata fetch with `429 quota-exceeded`.
5. `YOUTUBE_METADATA_ALLOW_OVER_LIMIT=true` allows metadata fetch after the limit is reached.
6. `YOUTUBE_METADATA_COUNTER_PATH` accepts an absolute server path and creates/counts the counter file there.

## Manual Smoke Evidence

### 1. Real API request and response

Input:

- URL: `https://dev-amp.ka2.org/youtube-metadata/Jo9qHqHkIqI`
- `YOUTUBE_DATA_API_KEY`: valid key configured

Observed console log:

```text
[2026/07/31 01:57:22] fetchData::after: Response
status: 200
statusText: "OK"
type: "basic"
url: "https://dev-amp.ka2.org/youtube-metadata/Jo9qHqHkIqI"
```

Result:

- Pass.
- The internal API endpoint returned `200 OK`.

### 2. Usage counter file creation

Observed:

- `logs/youtube-metadata-usage.json` was created.

Result:

- Pass.

### 3. Usage count increment

Observed:

- `youtubeMetadataRequests` incremented from `1` to `2`.

Result:

- Pass.

### 4. Monthly limit enforcement

Setup:

- `YOUTUBE_METADATA_MONTHLY_LIMIT=2`
- Existing counter count: `2`

Observed UI:

- Metadata assistance UI displayed:
  - `YouTube metadata monthly limit has been reached.`

Observed console log:

```text
[2026/07/31 02:15:40] fetchData::after:2:
{state: 'error', code: 429, data: {…}}
code: 429
data: {
  message: 'YouTube metadata monthly limit has been reached.',
  reason: 'quota-exceeded',
  usage: {…}
}
state: "error"
```

Result:

- Pass.
- Default behavior blocks metadata fetch after the monthly limit is reached.

### 5. Over-limit opt-in

Setup:

- `YOUTUBE_METADATA_ALLOW_OVER_LIMIT=true`
- Counter count remains at or above the configured monthly limit

Observed:

- Real API metadata fetch succeeded after the limit was reached.

Result:

- Pass.

### 6. Counter path override with absolute server path

Setup:

- `YOUTUBE_METADATA_COUNTER_PATH=C:\xampp\htdocs\youtube-metadata-usage.json`
- `YOUTUBE_DATA_API_KEY`: valid key configured
- Real YouTube Data API request executed through the internal metadata endpoint

Observed:

- Metadata was fetched successfully.
- `C:\xampp\htdocs\youtube-metadata-usage.json` was newly created.
- Since this was the first request counted at that path, `youtubeMetadataRequests` was recorded as `1`.

Result:

- Pass.
- Absolute counter path override works, including file creation and first-count persistence.

## Automated Coverage Before Follow-up

Already implemented before this report:

- Mocked UI E2E:
  - Metadata assistance remains hidden when not configured.
  - Metadata suggestions are displayed from a mocked internal endpoint response.
  - Manual title input is not overwritten by metadata.
  - Artist and description suggestions can be applied.
- Cloud MyPlaylist regression E2E:
  - Adding media to the selected MyPlaylist category still works after the metadata UI changes.
- Static/compile gates:
  - PHP syntax check
  - TypeScript typecheck
  - i18n coverage
  - Vite build

## Follow-up Automation Scope

Implemented follow-up automation:

1. PHP internal API smoke tests that do not call the real YouTube API:
   - invalid video id -> `400 invalid-video-id`
   - pre-seeded monthly limit -> `429 quota-exceeded`
2. UI E2E for non-success metadata responses:
   - mocked `429 quota-exceeded` renders the monthly limit message.
   - mocked upstream failure renders a non-blocking error while keeping manual input possible.

Notes:

- Missing API key behavior is covered at the frontend capability level by verifying the metadata assistance UI remains hidden when `AmbientData.youtubeMetadata.enabled` is not true.
- A server-level missing-key test is intentionally not included in the automated script because local `.env` values are loaded when the process env value is empty, making a deterministic "no key" state awkward in a developer machine with a valid key configured.

Deferred from automation:

- Real YouTube Data API live smoke.
- Live `YOUTUBE_METADATA_COUNTER_PATH` smoke against an alternate absolute path.

Reason:

- These checks depend on environment secrets, outbound network availability, server filesystem policy, and production-like path setup. Manual smoke evidence is sufficient for release validation, while deterministic automated tests should avoid consuming real API quota.
- The absolute-path counter override was manually verified with `C:\xampp\htdocs\youtube-metadata-usage.json`.

## Result

Manual smoke status: Pass.

Automated follow-up status: Pass.

Commands:

```bash
npm run test:youtube-metadata-api
npx playwright test tests/e2e/scenarios/sc-007-management.spec.ts --project=chrome --grep "YouTube metadata"
```

Remaining risk:

- Real upstream YouTube API behavior can still vary by quota state, network, or Google API response shape. The implemented automated tests should focus on Ambient's deterministic handling of validated inputs, configuration, quota guard behavior, and UI fallback states.
