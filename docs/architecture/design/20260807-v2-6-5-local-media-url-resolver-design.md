# v2.6.5 Design

Date: 2026-08-07
Target release: v2.6.5
Design scope: Local Media URL resolver pipeline for registration, playback, and Media Edit preview.

## 1. Design Summary

v2.6.5 adds a shared Local Media URL resolver pipeline.

The resolver pipeline has two stages:

1. Ambient internal default resolver.
2. Existing user-customizable `localMediaUrl.beforeCheck` filter.

The same pipeline should be used when:

- checking a URL during Media Management registration
- preparing an HTML player source before playback
- preparing an HTML preview source in Media Edit

The key design rule is:

```text
Persist origin URL. Use resolved URL only at runtime.
```

## 2. Existing Baseline

Relevant v2.6.4 modules:

- `src/scripts/shared/ambient-hooks.ts`
  - Provides `applyAmbientFilter()`.
  - Defines `LocalMediaUrlBeforeCheckContext` with `source: 'media-management'` and `rawUrl`.
- `src/scripts/platform/external-media-url.ts`
  - Normalizes external URLs.
  - Checks browser playability using off-DOM media elements.
- `src/scripts/ui/forms/media-management.ts`
  - Calls `localMediaUrl.beforeCheck` before URL normalization and playability check.
  - Currently writes the resolved playable URL into `media_filepath`.
- `src/scripts/ui/player/player-setup.ts`
  - Resolves HTML player kind from `MediaItem.file` extension.
- `src/scripts/ui/player/html-player-source.ts`
  - Converts local relative paths into media asset paths.
  - Returns `http(s)` URLs directly.
- `src/scripts/ui/player/html-player-view.ts`
  - Creates `<audio>` / `<video>` and `<source>`.
- `src/scripts/ui/player/media-edit-preview.ts`
  - Resolves Media Edit preview source synchronously.

Current constraint:

- Playback setup is mostly synchronous.
- Resolver pipeline is asynchronous.
- Therefore, v2.6.5 must introduce an async boundary before HTML playback setup.

## 3. Proposed Module Design

### 3.1 New shared resolver module

Suggested file:

```text
src/scripts/platform/local-media-url-resolver.ts
```

Responsibilities:

1. Normalize origin and current URL values.
2. Run Ambient internal default resolver.
3. Run user `localMediaUrl.beforeCheck` filter.
4. Return a structured resolver result.
5. Manage short-lived runtime cache.

Suggested types:

```ts
export type LocalMediaUrlResolveSource =
  | 'media-management'
  | 'html-playback'
  | 'media-edit-preview';

export type LocalMediaUrlResolvePhase =
  | 'check'
  | 'playback'
  | 'preview';

export interface LocalMediaUrlResolveContext {
  source: LocalMediaUrlResolveSource;
  phase: LocalMediaUrlResolvePhase;
  rawUrl: string;
  currentUrl: string;
  defaultResolved: boolean;
  defaultResolverName?: string;
}

export interface LocalMediaUrlResolveResult {
  originUrl: string;
  url: string;
  resolved: boolean;
  defaultResolved: boolean;
  resolverName?: string;
  error?: string;
}
```

Public function:

```ts
export async function resolveLocalMediaUrl(options: {
  url: string;
  source: LocalMediaUrlResolveSource;
  phase: LocalMediaUrlResolvePhase;
  useCache?: boolean;
  refreshCache?: boolean;
}): Promise<LocalMediaUrlResolveResult>;
```

### 3.2 Ambient internal default resolver

Suggested shape:

```ts
async function applyDefaultLocalMediaUrlResolver(url: string): Promise<{
  url: string;
  resolved: boolean;
  resolverName?: string;
}> {
  return {
    url,
    resolved: false,
  };
}
```

Initial implementation can be conservative:

- Normalize supported `http(s)` URL format.
- No server-side fetch.
- No custom extension point.
- Leave actual HTML scraping to user custom resolvers for now.

This still establishes the pipeline and context contract for future Ambient-core resolver logic.

### 3.3 User custom resolver compatibility

Existing user code may return only a string:

```js
window.AmbientHooks.addFilter('localMediaUrl.beforeCheck', async function (url, context) {
  return url;
});
```

The pipeline should continue accepting this.

Future-compatible option:

```js
return {
  url: resolvedUrl,
  resolved: true,
  resolverName: 'custom-html-scraper'
};
```

If implementing object returns in v2.6.5, the parser should accept both string and object results:

```ts
type LocalMediaUrlFilterReturn = string | Partial<LocalMediaUrlResolveResult>;
```

### 3.4 Hook visibility

The default resolver is not a public hook.

Do not expose:

```js
AmbientHooks.addFilter('localMediaUrl.defaultResolver', ...)
```

Instead, keep it as an imported internal function used by `resolveLocalMediaUrl()`.

Rationale:

- Users already have `localMediaUrl.beforeCheck`.
- The default resolver is Ambient core behavior and should stay deterministic across installations.
- This avoids users accidentally bypassing core safety rules.

## 4. Registration Flow Design

Current v2.6.4 flow:

```text
input URL
  -> beforeCheck
  -> normalize
  -> checkExternalMediaUrlPlayable
  -> hidden media_filepath = checked URL
  -> save checked URL
```

v2.6.5 flow:

```text
input origin URL
  -> resolveLocalMediaUrl({ source: 'media-management', phase: 'check', refreshCache: true })
  -> checkExternalMediaUrlPlayable(resolved.url)
  -> mark input valid
  -> keep runtime checked state:
       originUrl
       resolvedUrl
       resolved flag
  -> hidden media_filepath = origin URL
  -> save origin URL
```

Implementation note:

- `media_filepath` remains the existing field mapped into `MediaItem.file`.
- If `media_filepath` stores origin URL, Add Media validation must rely on runtime checked state, not only on hidden value existence.
- Input change must clear runtime checked state.

Suggested runtime state in `media-management.ts`:

```ts
let localMediaUrlCheckState: {
  originUrl: string;
  resolvedUrl: string;
  resolved: boolean;
  playable: boolean;
} | null = null;
```

Validation rule:

```text
Local/url mode is valid when:
  localMediaUrlCheckState.playable === true
  and localMediaUrlCheckState.originUrl === normalizeExternalMediaUrl(localMediaUrlInput.value)
```

## 5. Playback Flow Design

Current v2.6.4 playback kind resolution depends on `MediaItem.file` extension.

v2.6.5 must resolve external origin URLs before kind detection.

Preferred approach:

1. Identify selected `MediaItem`.
2. If `MediaItem.file` is an external `http(s)` URL, call resolver pipeline.
3. Create a runtime-only media item copy:

```ts
const playbackMediaItem = {
  ...mediaItem,
  file: resolved.url,
};
```

4. Use `playbackMediaItem` for:
   - `resolvePlaybackSetupPlan()`
   - `createManagedHtmlPlayback()`
   - `<source src>`
5. Keep original `mediaItem` in playlist state unchanged.

### 5.1 Async boundary

Candidate implementation points:

- Before `resolvePlaybackInvocation()` returns a plan.
- Or immediately before `setupPlayer()` receives HTML playback data.

Recommended:

Add an async orchestration wrapper around playback invocation:

```ts
async function resolvePlaybackInvocationWithMediaUrl(options): Promise<PlaybackInvocation | null> {
  const invocation = resolvePlaybackInvocation(options);
  if (!invocation) return null;

  if (isExternalLocalMediaUrl(invocation.mediaData.file)) {
    const resolved = await resolveLocalMediaUrl({
      url: invocation.mediaData.file,
      source: 'html-playback',
      phase: 'playback',
      useCache: true,
    });
    const mediaData = {
      ...invocation.mediaData,
      file: resolved.url,
    };
    return {
      ...invocation,
      mediaData,
      playbackPlan: resolvePlaybackSetupPlan({ mediaData, getExtension: options.getExtension }),
    };
  }

  return invocation;
}
```

This minimizes changes to player view creation.

### 5.2 Local file paths

Local relative paths should skip resolver pipeline.

Resolver applies only when:

```ts
normalizeExternalMediaUrl(mediaItem.file) !== null
```

This keeps existing local file behavior stable.

## 6. Media Edit Preview Design

Current preview source resolution is synchronous in `resolveMediaEditPreviewSource()`.

Options:

1. Make `resolveMediaEditPreviewSource()` async.
2. Add a new async wrapper for URL-backed items and leave the existing function for direct/sync cases.

Recommended:

```ts
export async function resolveMediaEditPreviewSourceAsync(mediaItem: MediaItem): Promise<MediaEditPreviewSource>
```

Behavior:

1. YouTube: unchanged.
2. Local relative file: unchanged.
3. External URL:
   - Run resolver pipeline with `{ source: 'media-edit-preview', phase: 'preview' }`.
   - Use resolved URL for preview source path, tag name, and MIME type.
   - Keep original item unchanged.

## 7. Cache Design

Suggested cache location:

```text
src/scripts/platform/local-media-url-resolver.ts
```

Suggested implementation:

```ts
const resolverCache = new Map<string, {
  result: LocalMediaUrlResolveResult;
  expiresAt: number;
}>();
```

Cache key:

```text
v1::{originUrl}
```

Default TTL:

```ts
const DEFAULT_RESOLVER_CACHE_TTL_MS = 5 * 60 * 1000;
```

Rules:

- Use cache for playback and preview by default.
- Refresh cache during explicit registration Check.
- Do not cache invalid URL parse failures longer than the current call unless needed.

## 8. Error Handling

Registration:

- If resolver returns invalid URL, show existing invalid URL message.
- If resolved URL fails playability check, show existing playability failure message.
- Keep origin input unchanged so user can fix it.

Playback:

- If resolver fails, attempt existing direct playback only if the origin URL itself is a valid external media URL.
- Otherwise report `unsupported_file_format` or a new resolver-specific issue.

Suggested new issue reason if needed:

```ts
'media_url_resolver_failed'
```

Preview:

- Show preview error instead of mutating saved data.

## 9. E2E Design

Extend the existing resolver fixture approach:

- `tests/e2e/fixtures/custom-media-url-resolver.php`
- `tests/e2e/scenarios/sc-022-local-media-url-hook.spec.ts`

Suggested additions:

1. Registration persists origin URL:
   - Input `HTML_PAGE_URL`.
   - Check resolves to `RESOLVED_MEDIA_URL`.
   - Add Media.
   - Assert playlist JSON/localStorage item `file === HTML_PAGE_URL`.
2. Playback uses resolved URL:
   - Select added item.
   - Assert `#html-player source[src] === RESOLVED_MEDIA_URL`.
3. Custom resolver skip:
   - Add custom hook that records context.
   - Assert `context.defaultResolved` is passed.
4. Preview:
   - Open Media Edit for the URL-backed item.
   - Assert preview source uses resolved URL.

## 10. Risks and Mitigations

### Risk: Async playback setup race

Users may click another item before resolver completes.

Mitigation:

- Use request sequence IDs similar to `localMediaUrlRequestSeq`.
- Ignore stale resolver results.

### Risk: Resolver changes player kind

Origin URL may be extensionless or HTML, resolved URL may be audio/video.

Mitigation:

- Resolve before `resolvePlaybackSetupPlan()`.
- Recompute extension and player kind from resolved URL.

### Risk: Cache returns stale signed URL

Mitigation:

- Keep TTL short.
- Allow explicit Check to refresh cache.

### Risk: Custom hooks perform slow network work

Mitigation:

- Keep UI loading state during Check.
- For playback, optionally show existing loading/transition state while resolving.
- Add timeout only if implementation finds no existing suitable boundary.

## 11. Suggested Implementation Order

1. Add `local-media-url-resolver.ts` with types, default resolver stub, cache, and pipeline.
2. Update `ambient-hooks.ts` context types for resolver status.
3. Update Media Management Check to use the new pipeline while saving origin URL.
4. Add focused unit-like tests or E2E assertions for pipeline context.
5. Add async playback resolver wrapper before HTML setup plan resolution.
6. Add Media Edit preview async resolver path.
7. Extend SC-022 E2E for origin persistence and playback source resolution.
8. Run typecheck, build, i18n, and targeted E2E.

## 12. Local-Only Range Proxy Extension

Some external URL-backed media providers allow registration and playback but do not provide efficient byte-range delivery. For v2.6.5, Ambient may add a local-only opt-in Range Proxy for those media items.

### 12.1 Scope

- Applies only in local mode.
- Cloud mode must not expose the proxy endpoint.
- The feature is opt-in per media item through `rangeProxy: true`.
- The stored `file` value remains the origin URL.
- The playback source may be replaced with a local proxy URL at runtime.
- The MVP applies only when the stored origin URL itself is the media URL. If the resolver changes an HTML/page URL into a different media URL, Range Proxy is skipped because the PHP endpoint cannot execute browser-side custom resolver hooks.

### 12.2 Media Item Contract

```ts
interface MediaItem {
  file?: string;
  rangeProxy?: boolean | string;
}
```

The field defaults to false when absent.

### 12.3 Server Endpoint

Recommended endpoint:

```text
GET local-media-proxy?playlist=<playlist.json>&media=<amId>
```

The endpoint must not accept arbitrary remote URLs directly. It should:

1. Run only when `is_local()` is true.
2. Resolve the playlist and media item server-side.
3. Recompute `amId` from playlist order because persisted playlist JSON does not store runtime IDs.
4. Confirm the target item has `rangeProxy: true`.
5. Validate that the stored origin URL is the direct media URL intended for caching.
6. Validate the origin URL with the same SSRF protections used by server-side media URL checking.
7. Cache the upstream media outside normal web assets.
8. Serve the cached file with `Accept-Ranges: bytes` and correct `206 Partial Content` responses.

### 12.4 Cache Strategy

The MVP uses a file cache under:

```text
.cache/media-proxy/
```

The default cache key is `sha256(originUrl)`.

Because a non-Range upstream cannot satisfy arbitrary seeks until Ambient has the file locally, the MVP downloads the upstream file fully on first proxy access, then serves subsequent requests from the local cache. More advanced progressive sparse caching is out of scope for v2.6.5.

### 12.5 Risks And Mitigations

- Large upstream files can consume disk space. Mitigate with a configurable max byte limit.
- Multiple requests may race on first cache creation. Mitigate with lock files.
- SSRF risk exists for any server-side URL fetch. Mitigate by blocking localhost, private, reserved, and invalid IP targets on the original URL and redirects.
- First playback may still be slow because the full file must be cached before efficient seeking is possible.
