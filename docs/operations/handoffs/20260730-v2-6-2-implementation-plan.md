# v2.6.2 Implementation Plan Draft

Date: 2026-07-30
Target release: v2.6.2
Source requirement: `.codex/memo.md`
Scope: planning/design only. Do not update application source code in this step.

## 1. Scope Summary

v2.6.2 adds YouTube Data API based metadata assistance to the existing media registration flow.

Primary goals:

1. When a YouTube URL is entered in Options modal > Media Management, fetch YouTube video metadata and use it to assist media registration.
2. Enable this feature only when valid YouTube Data API configuration exists.
3. Track monthly API usage count on the server side.
4. Disable metadata fetching when the configured monthly limit is exceeded by default.
5. Allow an environment flag to keep using the API even after the configured limit is exceeded.
6. Store the usage counter at a server-side path configurable by environment variable.
7. Map YouTube metadata to Ambient fields:
   - YouTube `snippet.title` -> Ambient media title
   - YouTube `snippet.channelTitle` -> Ambient artist
   - YouTube `snippet.description` -> Ambient desc

Out of scope for this planning slice:

- Actual code implementation.
- Changing playback behavior.
- Changing playlist persistence semantics.
- Exposing the YouTube Data API key to browser JavaScript.

## 2. Current Architecture Observations

Relevant current files:

- Server API routing: `src/Ambient.php`
- Server API handlers and playlist sanitization: `src/api.php`
- Environment loading helpers: `config/bootstrap.php`
- Frontend runtime composition root: `src/scripts/ambient.ts`
- Fetch wrapper: `src/scripts/platform/fetch-data.ts`
- Runtime AmbientData access: `src/scripts/platform/ambient-data.ts`
- Media registration UI binding: `src/scripts/ui/forms/media-management.ts`
- Media item construction: `src/scripts/domain/media-management-data.ts`
- Media registration markup: `views/collapse.php`
- E2E scenarios around media management and cloud MyPlaylist: `tests/e2e/scenarios/sc-007-management.spec.ts`, `tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts`

Current constraints:

- `MEDIA_TITLE_MAX_LENGTH = 100`
- `MEDIA_ARTIST_MAX_LENGTH = 100`
- `MEDIA_DESC_MAX_LENGTH = 500`
- YouTube URL input already validates `youtube.com` / `music.youtube.com` style hostnames and writes `#youtube-videoid`.
- Existing `fetchData()` sends URL encoded request bodies for non-GET requests.
- Existing PHP API routing is path based and already supports GET/POST/DELETE handlers.

## 3. Proposed Release Decisions

### 3.1 Description Length

Recommended initial decision:

- Increase Ambient description max length from `500` to `1000`.
- Add a configurable environment value only if later releases need operational tuning.
- Truncate YouTube descriptions server-side to the same max length before returning them to the browser.

Reasoning:

- The user requirement explicitly identifies `800-1000` as a reasonable range.
- `1000` is still bounded and supports lyric-style use cases better than `500`.
- One shared limit avoids browser/server drift.

### 3.2 Autocomplete vs Direct Assignment

Recommended behavior:

- Title: direct assignment only when the title field is empty or still contains a previous API suggestion.
- Artist and description: suggestion-assisted assignment with a small inline "Apply" / "Dismiss" suggestion block, not unconditional overwrite.
- If the user has typed in a field manually, do not overwrite it automatically.

Reasoning:

- The title is required and usually expected to match the YouTube video title.
- Artist and description are more editorial fields, so user control matters.
- Tracking "last applied suggestion" avoids clobbering user edits when the URL changes.

### 3.3 Server-Side API Key Handling

Do not pass the YouTube Data API key through `AmbientData`.

The browser should call an internal Ambient endpoint with only the extracted video id. PHP should call YouTube Data API server-side.

Recommended endpoint:

- `GET /youtube-metadata/{videoId}`

Alternative if route ambiguity becomes a concern:

- `GET /metadata/youtube/{videoId}`

## 4. Environment Variables

Add to `.env.example` during implementation:

| Variable | Default | Purpose |
|---|---:|---|
| `YOUTUBE_DATA_API_KEY` | empty | Enables metadata fetch when non-empty. |
| `YOUTUBE_METADATA_MONTHLY_LIMIT` | `10000` | Maximum counted metadata API requests per calendar month. |
| `YOUTUBE_METADATA_ALLOW_OVER_LIMIT` | `false` | If true, continue API calls after monthly limit is exceeded. |
| `YOUTUBE_METADATA_COUNTER_PATH` | `logs/youtube-metadata-usage.json` | Server-side JSON file used for usage count. |
| `YOUTUBE_METADATA_TIMEOUT_MS` | `5000` | Server-side HTTP request timeout. |

Notes:

- Counter path should be resolved with the existing `amp_resolve_dir()` pattern when directory-like, or a new safe file-path resolver when file-like.
- Production deployments should set `YOUTUBE_METADATA_COUNTER_PATH` above the document root.
- The browser should receive only capability metadata such as `youtubeMetadata.enabled`, not the API key.

## 5. Implementation Slices

### Slice A: Server Configuration and Capability

1. Add env parsing helpers for:
   - API key presence.
   - monthly limit.
   - allow-over-limit flag.
   - counter path.
   - timeout.
2. Add `AmbientData.youtubeMetadata` capability:
   - `enabled: boolean`
   - `monthlyLimit: number | null`
   - `allowOverLimit: boolean`
   - no secret values.
3. Feature is enabled only when `YOUTUBE_DATA_API_KEY` is non-empty.

Acceptance criteria:

- Without API key, frontend metadata UI remains hidden/disabled.
- With API key, frontend can show metadata fetch state.
- API key is absent from page source and `window.AmbientData`.

### Slice B: Server YouTube Metadata Endpoint

1. Add route in `src/Ambient.php`.
2. Add handler in `src/api.php`.
3. Validate video id with a conservative YouTube id pattern.
4. Enforce usage counter before calling YouTube API unless `YOUTUBE_METADATA_ALLOW_OVER_LIMIT=true`.
5. Call YouTube Data API `videos.list` with `part=snippet&id={videoId}`.
6. Normalize response to:

```json
{
  "title": "...",
  "artist": "...",
  "desc": "...",
  "videoId": "...",
  "source": "youtube-data-api",
  "usage": {
    "month": "2026-07",
    "count": 123,
    "limit": 10000,
    "limited": false
  }
}
```

Acceptance criteria:

- Invalid video id returns `400`.
- Missing API key returns capability/error state without upstream request.
- No YouTube item returns `404`.
- Over-limit default returns `429` and does not call upstream API.
- Successful request increments the current month count exactly once.

### Slice C: Usage Counter Persistence

1. Add a small counter abstraction in PHP, likely inside `src/api.php` or a new PHP helper trait/file if the codebase already has an appropriate pattern.
2. JSON shape:

```json
{
  "version": 1,
  "months": {
    "2026-07": {
      "youtubeMetadataRequests": 123,
      "updatedAt": "2026-07-30T14:00:00+09:00"
    }
  }
}
```

3. Use `LOCK_EX` on writes.
4. Treat unreadable/corrupt counter file as server error unless implementation chooses a backup-and-reset policy.
5. Keep old months in the file for now; pruning can be added later.

Acceptance criteria:

- Counter file is created if missing.
- Counter increments only after a successful upstream response, or immediately before upstream call if strict quota reservation is selected in detailed design.
- Current calendar month is based on server local date/time.
- Counter path outside app root works.

### Slice D: Frontend Metadata Client

1. Add a small platform/domain client module:
   - Recommended: `src/scripts/domain/youtube-metadata.ts`
   - Alternative: `src/scripts/platform/youtube-metadata-api.ts`
2. Use existing `fetchData()` or a JSON-specific wrapper.
3. Add request cancellation or stale-response guard for rapid URL changes.
4. Cache metadata results in memory by `videoId` for the current page session.

Acceptance criteria:

- Same video id in one page session does not trigger duplicate server calls.
- Stale response from an older URL does not update fields after the user changes URL.
- Network/API errors show a non-blocking inline message or toast.

### Slice E: Media Management UI Integration

1. Extend `views/collapse.php` with a compact metadata suggestion area below YouTube URL.
2. Add UI states:
   - disabled/not configured
   - idle
   - loading
   - suggestions available
   - applied
   - failed
   - monthly limit reached
3. Bind URL input in `src/scripts/ui/forms/media-management.ts`:
   - after valid `videoId` extraction, debounce metadata fetch.
   - fill title directly only if safe.
   - show artist/description suggestions with apply controls.
4. Keep existing validation flow:
   - title still validates on input/change.
   - add-media button activation continues to depend on URL/category/title.

Acceptance criteria:

- Metadata assistance never blocks manual registration.
- Manual edits are not overwritten.
- Applying a suggestion dispatches `input` and `change` events so existing validation and sanitization run.
- Cloud JSON playlist restrictions still disable metadata UI with the rest of media registration controls.

### Slice F: i18n, Documentation, and Release Gates

1. Add new i18n keys to all files under `assets/langs/`.
2. Update README / README-ja environment variable documentation.
3. Update `.env.example`.
4. Add targeted E2E tests and PHP/manual API checks.

Acceptance criteria:

- `npm run check:i18n` passes.
- TypeScript typecheck and build pass.
- New endpoint behavior is covered by focused tests or documented manual validation.

## 6. Suggested UI Copy Keys

Add English origin keys and translations:

- `Fetch YouTube metadata`
- `Fetching YouTube metadata...`
- `YouTube metadata found.`
- `Apply title`
- `Apply artist`
- `Apply description`
- `Apply all suggestions`
- `Dismiss YouTube metadata suggestions`
- `YouTube metadata assistance is not configured.`
- `YouTube metadata could not be fetched.`
- `YouTube metadata monthly limit has been reached.`
- `This suggestion will not overwrite text you have already entered.`

## 7. Test Plan

Required automated checks after implementation:

- `npm run typecheck`
- `npm run build`
- `npm run check:i18n`
- `npm run test:e2e:cloud:chrome`
- `npm run test:e2e:local:chrome`

Targeted E2E scenarios to add:

1. Metadata UI hidden/idle when API key is not configured.
2. Valid YouTube URL fetches metadata and fills empty title.
3. Artist and description suggestions can be applied.
4. Manual title/artist/description edits are not overwritten by later metadata responses.
5. Over-limit endpoint response displays a non-blocking warning and still allows manual media registration.
6. Cloud JSON playlist keeps media fields and metadata controls disabled.

Server/API validation:

1. Missing key.
2. Invalid video id.
3. Successful metadata fetch.
4. Counter increment.
5. Limit reached with `YOUTUBE_METADATA_ALLOW_OVER_LIMIT=false`.
6. Limit reached with `YOUTUBE_METADATA_ALLOW_OVER_LIMIT=true`.
7. Counter path outside document root.

## 8. Risks and Mitigations

Risk: API key leaks to browser.
Mitigation: keep all YouTube API calls in PHP and never serialize the key into `AmbientData`.

Risk: YouTube quota is consumed by typing or repeated URL changes.
Mitigation: debounce valid URL input, cache by `videoId`, and use a stale-response guard.

Risk: Description length change creates schema drift.
Mitigation: update all sanitizers, input `maxlength`, PHP normalization, import normalization, and tests in the same slice.

Risk: User-entered fields are overwritten.
Mitigation: track field dirtiness and last applied suggestion per field.

Risk: Counter file is web-accessible.
Mitigation: support `YOUTUBE_METADATA_COUNTER_PATH` outside document root and document that as production recommendation.

Risk: Server environments do not allow outbound HTTP.
Mitigation: return a clear API error and keep manual registration available.

## 9. Open Questions

1. Should the description max length be `800` or `1000`? Draft recommendation is `1000`.
2. Should the monthly limit default mirror YouTube quota units or a conservative lower request count? Draft recommendation is request count with default `10000`.
3. Should metadata be fetched automatically after debounce, or only via an explicit button? Draft recommendation is automatic after a valid URL plus an explicit retry/apply UI.
4. Should descriptions preserve newlines in media registration? Current add form uses a one-line input; richer descriptions may justify changing it to `textarea`.

## 10. Definition of Done

1. Feature is disabled cleanly without API key.
2. API key remains server-only.
3. Metadata endpoint handles success, invalid input, missing config, and quota states.
4. Monthly usage counter is persisted at configured path.
5. Media registration UI supports suggestions without blocking manual entry.
6. Description length policy is applied consistently.
7. i18n, README, `.env.example`, typecheck, build, and targeted tests are complete.
