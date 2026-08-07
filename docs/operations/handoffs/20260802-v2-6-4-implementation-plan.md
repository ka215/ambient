# v2.6.4 Implementation Plan

Date: 2026-08-02
Target release: v2.6.4
Scope: planning/design only in this phase. Do not update application code.

## 1. Objective

v2.6.4 adds URL-based registration for Local Media, fixes the cloud-mode regression where Local Media can be selected inconsistently, and fixes stale playlist/carousel thumbnails after local video thumbnail regeneration.

The intended behavior changes are:

1. Cloud mode can register externally hosted audio/video URLs as Local Media.
2. Cloud mode must not allow host-computer file upload registration.
3. Local mode keeps the existing file upload registration and adds URL registration as an alternate input method.
4. Media edit does not allow changing an existing external media URL.
5. When Media Edit regenerates or updates a local video thumbnail, playlist drawer and carousel images refresh without being blocked by browser cache.

## 2. Current State Summary

Relevant existing files:

- `views/collapse.php`
  - Owns the Media Management markup.
  - Currently renders `#media-type-local` as disabled when not local.
  - Existing local media UI is `#media-management-field-media-files`.
- `src/scripts/ui/forms/media-management.ts`
  - Owns Media Management event binding, validation state, metadata assistance, and submit handling.
  - Existing local file input validates with `isLikelyMediaFile()` and `getRelativeFilepath()`.
- `src/scripts/domain/media-management-data.ts`
  - Builds a `MediaItem` from submitted form data.
  - Already maps `media_filepath` into `MediaItem.file`.
- `src/scripts/ui/player/html-player-source.ts`
  - Already treats `http(s)://`, protocol-relative URLs, `blob:`, and `data:` paths as direct HTML media sources.
- `src/scripts/ui/player/player-setup.ts`
  - Chooses audio/video player from the extension of `MediaItem.file`.
- `src/scripts/ui/forms/cloud-edit-restrictions.ts`
  - Currently disables `media-type-local`, local file input, picker, and other form controls when the active playlist is read-only.
- Media Edit thumbnail and playlist/carousel rendering modules to inspect during implementation:
  - Thumbnail save/update flow should identify when `MediaItem.image` keeps the same asset path after regeneration.
  - Playlist drawer and carousel image rendering should resolve display URLs through a shared cache-busting helper instead of mutating persisted playlist data.

Key implication:

- URL-based local media can reuse `MediaItem.file` and the existing HTML player pipeline if validation confirms that the URL looks like an audio/video source and can load metadata in a browser media element.
- Thumbnail cache invalidation should be a presentation/runtime concern. Persisted `MediaItem.image` should remain the canonical asset path without timestamp query strings.

## 3. Implementation Phases

### Phase 1: Markup and UI Structure

Tasks:

1. Change Local Media radio policy:
   - Allow `#media-type-local` to be selectable in cloud mode.
   - Keep file-upload registration unavailable in cloud mode.
2. Replace the single local media file block with a local-media input mode container:
   - Add tab controls under Local Media:
     - Upload tab
     - URL tab
   - Local mode default tab: Upload.
   - Cloud mode default tab: URL.
   - Cloud mode Upload tab: disabled with a clear disabled state.
3. Add URL registration input group:
   - URL input field.
   - Connection check button joined as an input group.
   - Hidden `media_filepath` continues to receive the accepted URL.
   - Status notes for invalid URL, checking, playable, and failed states.

Acceptance criteria:

- Cloud users can select Local Media.
- Cloud users cannot use Upload tab controls.
- Local users can switch between Upload and URL tabs.
- Existing YouTube Media UI is not affected.

### Phase 2: Form State and Validation

Tasks:

1. Extend Media Management form binding to track local input mode:
   - `upload`
   - `url`
2. Add URL format validation:
   - Accept only `http://` and `https://`.
   - Reject empty, relative, `file:`, `javascript:`, `data:`, `blob:`, and protocol-relative URLs for registration.
   - Normalize harmless whitespace by trimming.
3. Add connection/playability check:
   - Enable check button only after valid URL format.
   - Create an off-DOM `audio` or `video` element based on URL extension.
   - Set `preload="metadata"` and wait for `loadedmetadata` or `canplay`.
   - Treat `error`, unsupported extension, unsupported `canPlayType`, and timeout as failure.
   - On success, write URL into hidden `media_filepath` and validate it.
4. Ensure submit button validation:
   - YouTube mode requires valid YouTube URL/video ID.
   - Local/upload mode requires validated relative file path.
   - Local/url mode requires connection-checked `media_filepath`.

Acceptance criteria:

- Add Media remains disabled until URL check succeeds.
- A previously checked URL is invalidated when the URL text changes.
- Switching tabs clears stale validation for the inactive local input mode.
- Switching YouTube/Local keeps the current category behavior introduced in v2.6.3.

### Phase 3: Domain Data Contract

Tasks:

1. Keep `MediaItem.file` as the storage location for external URLs.
2. Add a source marker only if needed after implementation inspection:
   - Preferred: no schema change.
   - Optional: `source?: 'local-file' | 'external-url'` only if UI restrictions cannot be inferred reliably.
3. Ensure `buildManagedMediaItem()` handles URL values from `media_filepath` without attempting relative path conversion.

Acceptance criteria:

- URL-registered items persist in JSON/localStorage with `file` populated.
- Existing local file playlist items remain compatible.
- Existing player setup selects audio/video from URL extension.

### Phase 4: Cloud/Local Edit Restrictions

Tasks:

1. Refine `applyCloudEditRestrictionsView()` so it distinguishes:
   - read-only playlist restriction
   - cloud host-file-upload restriction
2. Cloud mode with mutable MyPlaylist:
   - Enables YouTube Media and Local Media radio choices.
   - Enables Local Media URL tab/input/check.
   - Disables Upload tab/file picker/dropzone.
3. Cloud mode with JSON playlist:
   - Keeps all mutation controls disabled as read-only.
4. Local mode:
   - Enables both Upload and URL tabs for mutable JSON playlists.
   - Keeps mutation controls disabled when no valid playlist is selected.

Acceptance criteria:

- The original regression is fixed without re-blocking cloud URL registration.
- Read-only cloud JSON playlists remain protected.
- Local invalid-playlist protections from v2.6.3 remain intact.

### Phase 5: Media Edit Restriction

Tasks:

1. Identify how Media Edit currently renders source identity for local media.
2. Ensure `file`/external URL source is displayed read-only in Media Edit.
3. Do not add UI that changes `MediaItem.file` for external URLs.
4. Existing editable metadata fields remain editable.

Acceptance criteria:

- Editing a URL-registered item cannot change its URL.
- Save changes preserves the original `file` URL.
- Thumbnail, title, artist, description, timing, volume, and advanced applicable settings are unaffected.

### Phase 6: i18n, Tests, and Validation

Tasks:

1. Add required UI strings to all language resources.
2. Add/adjust focused E2E coverage:
   - cloud: Local Media radio selectable, Upload tab disabled, URL tab active.
   - cloud: checked playable URL enables Add Media.
   - local: Upload tab default, URL tab switch works.
   - edit: URL source cannot be changed.
3. Run validation:
   - `npm run typecheck`
   - `npm run build`
   - targeted Playwright scenarios
   - `npm run check:i18n`

Acceptance criteria:

- Typecheck and build pass.
- New behavior is covered in cloud and local mode.
- No untranslated UI string regressions.

### Phase 7: Thumbnail Cache Invalidation

Tasks:

1. Trace the local video thumbnail update flow:
   - Identify where the regenerated thumbnail path is committed to `MediaItem.image`.
   - Confirm whether regenerated thumbnails overwrite the same WebP/PNG path.
2. Add a runtime cache-busting strategy for media images:
   - Keep persisted `MediaItem.image` unchanged.
   - Add or reuse a helper that converts an image asset path to a display URL with a version query.
   - Use a deterministic version source where available, such as the update timestamp returned by the thumbnail save flow; otherwise use a per-update timestamp stored only in runtime UI state.
3. Apply the display URL helper to every stale-image surface:
   - playlist drawer media item thumbnails
   - carousel/current media thumbnail
   - any media edit preview that reuses the committed thumbnail path after save
4. After a successful Media Edit save:
   - Update the in-memory media item.
   - Refresh playlist drawer and carousel rendering with the new display URL version.
   - Preserve current playlist/category/media selection.
5. Avoid adding query parameters to external image URLs unless needed:
   - Prefer cache-busting only for local/static asset paths managed by Ambient.
   - Do not alter YouTube thumbnail URLs or externally hosted image URLs unless implementation inspection shows they share the same stale-cache problem.

Acceptance criteria:

- Regenerating a local video thumbnail updates the right drawer thumbnail without a page reload.
- The carousel/current media image updates without a page reload.
- The persisted JSON/localStorage playlist keeps the clean `image` path without cache-busting query parameters.
- Existing placeholder images and external thumbnail URLs continue to render normally.
- Current media, playlist, and category selection are not reset by the refresh.

## 4. Suggested Task Order

1. Update Media Management markup for tabs and URL input.
2. Add local input mode state and UI toggling.
3. Implement URL format validation and playability check helper.
4. Wire submit validation and hidden `media_filepath`.
5. Refine cloud/local control restrictions.
6. Confirm player pipeline with URL-backed `MediaItem.file`.
7. Lock Media Edit source field as read-only.
8. Add thumbnail image display URL cache-busting and post-save UI refresh.
9. Add i18n strings.
10. Add targeted tests.
11. Run full validation commands.

## 5. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Cross-origin media blocks metadata loading | Some valid URLs cannot be verified | Treat browser-load failure as non-registerable and show a clear message; avoid relying only on `HEAD`. |
| URLs without file extensions | Player type cannot be inferred reliably | v2.6.4 should reject extensionless URLs unless a later API-based content-type check is added. |
| Cloud read-only restriction conflicts with cloud URL registration | Local Media remains unusable in cloud | Split environment restrictions from playlist mutability restrictions. |
| Stale hidden `media_filepath` after URL edit/tab switch | Wrong media gets registered | Clear hidden field and validation whenever URL text or input mode changes. |
| Existing tests assume Local Media disabled in cloud | Test failures after intended behavior change | Update expectations to Upload disabled, Local Media selectable, URL tab active. |
| Cache-busting query strings are persisted into playlists | Playlist data churn and duplicate asset identities | Apply query strings only at render time; persist clean `image` paths. |
| Updating thumbnail UI resets current playback context | User loses current playlist/category/media selection | Re-render affected image surfaces in place and preserve current selection state. |

## 6. Definition of Done

v2.6.4 is ready when:

1. Cloud MyPlaylist can register external audio/video URLs.
2. Cloud file upload remains impossible.
3. Local mode supports both upload and URL registration.
4. Existing YouTube registration and local file registration still work.
5. URL-registered media plays through the HTML player.
6. Media Edit preserves external URL source and does not offer URL replacement.
7. Local video thumbnail regeneration refreshes playlist drawer and carousel images without requiring reload and without persisting cache-busting query strings.
8. Typecheck, build, i18n check, and targeted E2E pass.
