# v2.6.5 Handoff Requirements

Date: 2026-08-07
Target release: v2.6.5
Status: handoff for next development branch/chat
Source release baseline: v2.6.4

## 1. Background

v2.6.4 introduced Local Media URL registration, `localMediaUrl.beforeCheck`, a custom resolver sample, and E2E coverage for resolving an HTML page URL into an extensionless media URL before browser playability validation.

The v2.6.4 behavior resolves the entered URL during registration and stores the resolved media URL in `MediaItem.file`. This works for direct media URLs and simple resolver use cases, but it loses the original URL entered by the user when the URL points to a pure HTML page that must be resolved into a media file.

v2.6.5 should extend the resolver model so Ambient can preserve the origin URL in the playlist while resolving it only when a playable media source is needed.

## 2. Objective

Add an Ambient-core internal default resolver before the existing user-customizable `localMediaUrl.beforeCheck` hook, and apply the same resolver pipeline at all points where an HTML media URL must be converted into a playable source.

The intended outcome is:

1. Ambient can keep the origin URL in playlist data.
2. Ambient can resolve that origin URL into a playable media URL at registration check time.
3. Ambient can resolve the origin URL again immediately before HTML playback.
4. Ambient can resolve the origin URL for Media Edit preview.
5. User custom resolvers can skip work when the core default resolver has already resolved the URL.

## 3. Functional Requirements

### 3.1 Resolver pipeline

Add a shared resolver pipeline for Local Media URL values:

```text
origin URL
  -> Ambient core default resolver
  -> user custom beforeCheck filter
  -> normalized resolved URL
```

Requirements:

1. The Ambient core default resolver runs before `localMediaUrl.beforeCheck`.
2. The Ambient core default resolver is internal only.
3. Users must not be able to register or override the default resolver through `custom.php`.
4. `localMediaUrl.beforeCheck` remains user-customizable through `window.AmbientHooks.addFilter()`.
5. The user hook receives the URL value and context including whether the default resolver already resolved it.
6. The pipeline must support asynchronous resolver work.
7. Resolver failures should fall back to the prior URL value unless the caller explicitly treats failure as invalid.

### 3.2 Default resolver status context

The context passed to `localMediaUrl.beforeCheck` must include enough information for custom resolvers to avoid duplicate filtering.

Minimum context fields:

```ts
{
  source: 'media-management' | 'html-playback' | 'media-edit-preview';
  phase: 'check' | 'playback' | 'preview';
  rawUrl: string;
  currentUrl: string;
  defaultResolved: boolean;
  defaultResolverName?: string;
}
```

Acceptance criteria:

- A custom resolver can read `context.defaultResolved === true` and return the current URL unchanged.
- A custom resolver can still run when `defaultResolved === false`.
- Existing simple `beforeCheck(url) => string` style callbacks continue to work.

### 3.3 Registration check behavior

When a user enters a Local Media URL and presses Check:

1. The input value is treated as the origin URL.
2. The resolver pipeline produces a candidate playable URL.
3. Browser playability validation runs against the resolved candidate URL.
4. On success, the UI indicates that the URL is playable.
5. The playlist save value should preserve the origin URL, not the resolved candidate URL.
6. The resolved candidate URL may be kept in runtime-only state for immediate UI validation.

Acceptance criteria:

- An HTML page URL can pass Check when a resolver extracts a playable media URL.
- The playlist item stores the original HTML page URL in `file`.
- The Add Media button can become enabled based on the resolved URL check result.
- Editing or re-checking the input invalidates stale runtime resolved state.
- Server-side check failures preserve actionable upstream HTTP status context:
  - `401`: authentication required.
  - `403`: access forbidden, including restricted Google Drive shares.
  - `404`: media URL not found.
  - `5xx`: upstream host server error.
- The Media Management URL status text displays the status-specific message and keeps Add Media disabled.

### 3.4 Playback-time behavior

Before an HTML player source is created:

1. Read the stored `MediaItem.file` value as the origin URL/path.
2. If the value is an external `http(s)` URL, run the resolver pipeline.
3. Use the resolved URL for player kind detection and `<source src>`.
4. Do not mutate the persisted playlist item.
5. Report playback issues using both origin and resolved URL where useful.

Acceptance criteria:

- A playlist item whose `file` is an HTML page URL can play if the resolver returns a playable media URL.
- The DOM `<source src>` receives the resolved URL.
- The in-memory/persisted `MediaItem.file` remains the origin URL.
- Existing local relative file paths continue to play without resolver overhead or behavior change.

### 3.5 Media Edit preview behavior

Media Edit preview should use the resolver pipeline before creating an HTML preview player.

Acceptance criteria:

- A URL-backed item displays the origin URL as its stored source.
- The preview player source uses the resolved URL.
- Saving metadata preserves the origin `file` URL.
- No UI is added to edit the URL itself unless a later requirement explicitly asks for it.

### 3.6 Caching

Add a small runtime cache for resolver results.

Requirements:

1. Cache key should include the origin URL and resolver pipeline version or equivalent invalidation token.
2. Cache value should include:
   - origin URL
   - resolved URL
   - `resolved` flag
   - resolver name or source when available
   - expiry time
3. Default TTL should be short enough for dynamic URLs.
4. Custom resolver results should be cacheable only by Ambient runtime policy unless a later API explicitly exposes custom TTL.

Suggested default TTL:

- 5 minutes for v2.6.5 unless implementation shows a better value.

Acceptance criteria:

- Repeated playback of the same URL does not repeatedly call the same resolver within the TTL.
- Input changes and explicit re-checks can bypass or refresh stale cache.
- Cache data is not persisted to playlist JSON/localStorage.

### 3.7 Local-only Range Proxy

Add an opt-in local-only Range Proxy for external URL-backed HTML media that does not provide efficient Range delivery.

Requirements:

1. Add an optional media item field:

```ts
rangeProxy?: boolean | string
```

2. Treat the field as false when absent.
3. Use the proxy only when:
   - Ambient is running in local mode,
   - the media item has `rangeProxy: true`,
   - the media item has an external `http(s)` `file` URL,
   - the stored origin URL is directly proxyable or can be resolved by Ambient PHP core resolver into the same direct media URL,
   - playback or preview is preparing an HTML media source.
4. The proxy endpoint must not accept arbitrary remote URLs from the browser.
5. The proxy endpoint must resolve `playlist` and `media` server-side and confirm the persisted media item has `rangeProxy: true`.
6. The proxy endpoint must run the PHP core local media URL resolver against the persisted origin URL before upstream fetches.
7. Cloud mode must return an error for the proxy endpoint.
8. The server should cache the upstream media outside `assets/` and serve byte ranges from the cached file.
9. The proxy cache should carry a configurable TTL and should be cleaned during Ambient initialization, on proxy endpoint access, and after playlist saves that remove cached `rangeProxy` items.

Initial core provider resolvers:

- Dropbox shared URLs resolved to `dl.dropboxusercontent.com`.
- Google Drive shared URLs resolved to `drive.google.com/uc?export=download&id=<id>`.

Acceptance criteria:

- A manually authored playlist item with `file: "<external media URL>"` and `rangeProxy: true` uses `local-media-proxy` as the runtime `<source src>` in local mode.
- A manually authored playlist item with `file: "<Dropbox shared URL>"` and `rangeProxy: true` can use `local-media-proxy` after Ambient core resolves it to the direct Dropbox URL.
- The persisted `file` URL remains the origin URL.
- A browser-only custom hook transformed page URL does not use Range Proxy unless that resolution is also implemented in PHP core.
- A proxy request for an item without `rangeProxy: true` is rejected.
- Cloud mode does not expose usable Range Proxy behavior.
- The proxy responds with `Accept-Ranges: bytes` and `206 Partial Content` for valid Range requests once the file is cached.
- Expired proxy cache files are removed no more than once per day by routine cleanup.
- When a playlist save removes a `rangeProxy` media URL, Ambient deletes that URL's proxy cache files.

### 3.8 Range Proxy toggle UI

After a Local Media URL check succeeds, show a Range Proxy toggle only when:

1. Ambient is running in local mode.
2. The current playlist can be saved.
3. The check result came from the server.
4. The checked media is `audio` or `video`.
5. The resolved media URL does not advertise `Accept-Ranges: bytes`, or it was resolved by `ambient-google-drive-shared-url`.
6. `Content-Length` is known.
7. `0 < Content-Length <= AMBIENT_LOCAL_MEDIA_PROXY_MAX_BYTES`.

Default behavior:

- Google Drive URLs resolved by `ambient-google-drive-shared-url` default the toggle to on, including cases where the final URL advertises byte-range support but is still unreliable as a direct browser media source.
- Other eligible non-Range URLs default the toggle to off.
- Dropbox URLs that resolve to byte-range-capable `dl.dropboxusercontent.com` do not show the toggle.

Acceptance criteria:

- An eligible Google Drive URL shows the toggle checked by default after Check.
- Saving that media item persists `rangeProxy: true`.
- Ineligible URLs do not persist `rangeProxy`; Range-capable Google Drive URLs may persist `rangeProxy` because browser direct playback is unreliable.

### 3.9 Checked media type hints

When a Local Media URL check succeeds, persist lightweight playback hints from the server check result.

Requirements:

1. Persist `mediaKind: "audio" | "video"` when the server check classifies the URL as audio or video.
2. Persist `mediaMime` when the server check returns a safe `audio/*` or `video/*` MIME value.
3. Use `mediaKind` as a runtime player-kind hint when the resolved playback URL has no explicit file extension.
4. Use `mediaMime` as the preferred `<source type>` when it matches the selected HTML player kind.
5. Keep `file` as the origin URL; do not replace it with the resolved URL.

Acceptance criteria:

- A Google Drive shared URL that resolves to an extensionless `uc?export=download` URL can be registered as video when the check result reports `video/mp4`.
- Playback and Media Edit preview create a `<video>` source for that item, even though the resolved URL path has no `.mp4` extension.
- Range-capable providers still do not show or persist `rangeProxy` solely because the URL is extensionless, except for Google Drive URLs resolved by Ambient core.

## 4. Non-Functional Requirements

1. Preserve v2.6.4 playlist compatibility.
2. Avoid schema migration unless absolutely required.
3. Keep resolver implementation isolated from UI-specific form logic.
4. Keep user-customizable hooks clearly separated from Ambient internal hooks.
5. Keep server-side fetching limited to explicitly designed endpoints with SSRF protections.
6. Maintain existing TypeScript strictness and module boundaries.
7. Keep E2E tests independent of Git-ignored `custom.php`.

## 5. Out of Scope

1. Adding a public PHP server-side resolver to Ambient core.
2. Allowing users to override Ambient default resolver internals.
3. Persisting resolved URL beside origin URL in playlist schema.
4. Adding URL editing UI in Media Edit.
5. Supporting non-http(s) registration URLs.
6. Supporting Range Proxy in cloud mode.
7. Implementing sparse/progressive upstream caching for non-Range providers.

## 6. Suggested E2E Coverage

Add or extend targeted Playwright coverage:

1. Registration:
   - Input HTML page URL.
   - Resolver returns extensionless media URL.
   - Check succeeds.
   - Add Media saves origin URL in playlist data.
2. Playback:
   - Stored origin URL is resolved before HTML player source creation.
   - `<source src>` equals resolved media URL.
3. Media Edit preview:
   - Stored origin URL remains visible/read-only.
   - Preview player source equals resolved media URL.
4. Resolver skip:
   - Default resolver marks `defaultResolved: true`.
   - Custom `beforeCheck` sees the flag and does not re-resolve.
5. Cache:
   - Repeated playback uses cached resolver result within TTL.

## 7. Validation Commands

Run at minimum:

```bash
npm run typecheck
npm run build
npm run check:i18n
powershell -NoProfile -ExecutionPolicy Bypass -Command "& ./scripts/run-e2e-env.ps1 -AmpEnv local -Port 8087 -PlaywrightArgs @('tests/e2e/scenarios/sc-022-local-media-url-hook.spec.ts','--project=chrome')"
```

Add new targeted E2E files as required by implementation.

## 8. Handoff Notes

- v2.6.4 is considered complete at the current commit boundary.
- v2.6.5 work should start from a new branch after the v2.6.4 release workflow is complete.
- The next implementation should first refactor resolver handling into a shared service/module before changing registration or playback behavior.

## 9. Initial Repository Operations Task

Before starting feature implementation, review how `.codex/` content should be managed in Git.

Background:

- `.codex/` is currently ignored by `.gitignore`.
- The workspace now contains development-operational assets under `.codex/`, including version handoff documents, implementation/design plans, verification scripts, and project-local skills.
- Some of these files are valuable team/project knowledge and may deserve Git tracking.
- Other files may remain personal, generated, temporary, or workspace-specific and should stay ignored.

Tasks:

1. Inventory `.codex/` content and classify each file/directory:
   - project knowledge to track
   - release/development skills to track
   - generated or temporary files to ignore
   - personal/local configuration to ignore
2. Propose a `.gitignore` / `.git/info/exclude` strategy:
   - avoid blindly tracking all `.codex/`
   - allowlist stable project docs/skills if appropriate
   - keep local config and temporary release note drafts ignored
3. Decide whether version handoff/design documents should move from `.codex/` to `docs/` or remain under a tracked `.codex/` allowlist.
4. Decide whether `.codex/skills/release-notes/SKILL.md` should become a tracked project skill.
5. If tracking is approved, implement the ignore-rule changes and commit the selected files before feature implementation.

Acceptance criteria:

- A clear policy exists for which `.codex/` assets are project-managed.
- Personal/local files remain untracked.
- Future release/handoff knowledge is not lost between workspaces or branches.
