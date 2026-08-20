# v2.6.3 Implementation Plan Draft

Date: 2026-07-31
Target release: v2.6.3
Source requirement: `.codex/memo.md`
Scope: planning/design only. Do not update application source code in this step.

## 1. Scope Summary

v2.6.3 is a mixed feature and bug-fix release around media management, media edit UX, local media metadata, thumbnail generation, and YouTube IFrame Player parameter control.

Primary goals:

1. Show a YouTube Data API technology link in About Ambient only when `YOUTUBE_DATA_API_KEY` enables the v2.6.2 metadata capability.
2. In local mode, block media registration and media editing when the selected playlist is missing, empty, or no longer valid.
3. Extend local media registration metadata assistance from filename fallback to embedded metadata where available.
4. Add optional ffmpeg-based thumbnail generation from the current seek time of a local video preview.
5. Improve the media edit modal:
   - thumbnail drag and drop
   - auto-growing description textarea
   - YouTube advanced settings for `cc`, `fs`, `controls`, and `disablekb`
6. Ensure YouTube playback uses `playsinline=1`.
7. Investigate the autoplay-with-muted-start hypothesis without changing default playback behavior until verified.

Out of scope for this planning slice:

- Actual application source changes.
- Package version bump. Per repository policy, version updates are release-workflow only.
- YouTube thumbnail generation through ffmpeg. Treat YouTube videos as unsupported unless a later proof shows a safe direct source URL workflow.
- Guaranteeing autoplay in inactive tabs. Browser autoplay policy remains authoritative.

## 2. Current Architecture Observations

Relevant current files:

- Server routing and public capabilities: `src/Ambient.php`
- Server API handlers, playlist validation, thumbnail upload/delete, YouTube metadata endpoint: `src/api.php`
- About accordion and form/modal markup: `views/collapse.php`
- Frontend composition root: `src/scripts/ambient.ts`
- Media registration binding: `src/scripts/ui/forms/media-management.ts`
- Media registration item construction: `src/scripts/domain/media-management-data.ts`
- YouTube metadata client: `src/scripts/platform/youtube-metadata-api.ts`
- Media edit modal elements/view/bindings:
  - `src/scripts/ui/media-edit/elements.ts`
  - `src/scripts/ui/media-edit/form-view.ts`
  - `src/scripts/ui/media-edit/controls.ts`
  - `src/scripts/bootstrap/media-edit-controls-runtime-init.ts`
  - `src/scripts/domain/media-edit/draft.ts`
  - `src/scripts/domain/media-edit/save.ts`
- Thumbnail persistence client: `src/scripts/platform/media-edit-persistence.ts`
- YouTube playback config and view:
  - `src/scripts/ui/player/player-config.ts`
  - `src/scripts/ui/player/youtube-player-view.ts`
  - `src/scripts/types/youtube.ts`
  - `src/scripts/types/ambient.ts`

Existing behavior that affects this release:

- v2.6.2 already exposes `AmbientData.youtubeMetadata.enabled`.
- v2.6.2 already increased media description handling to `1000` characters in observed registration and sanitization paths.
- Media registration already calls `canMutateCurrentPlaylist()` before add.
- `persistMediaEditForCurrentPlaylist()` already rejects empty local playlist names, but registration currently can still mutate in-memory data before persistence failure.
- Thumbnail upload currently accepts base64 image data and saves it to `IMAGES_DIR`.
- Server-side thumbnail APIs are local-mode only.
- `MediaItem` already supports `cc` and `fs`; `controls` exists in TS types but should be normalized consistently server-side; `disablekb` is not yet modeled.

## 3. Implementation Slices

### Slice A: About Ambient YouTube Data API Link

Tasks:

1. Add a server-side display condition derived from existing `get_youtube_metadata_capability()`.
2. In `views/collapse.php`, insert `YouTube Data API` under `YouTube IFrame Player API` only when the capability is enabled.
3. Add i18n key coverage for the label if translation files require explicit entries.

Acceptance criteria:

- With no `YOUTUBE_DATA_API_KEY`, the About technology list is unchanged.
- With `YOUTUBE_DATA_API_KEY`, the list includes `YouTube Data API` linking to `https://developers.google.com/youtube/v3`.
- The API key itself is never rendered into page HTML or `AmbientData`.

### Slice B: Local Playlist Validity Gate for Registration and Editing

Tasks:

1. Define one frontend predicate for playlist mutation eligibility:
   - cloud mode: current localStorage MyPlaylist rules remain unchanged.
   - local mode: current playlist name must be non-empty and exist in `AmbientData.playlists`.
   - loaded status must reference the same playlist and have valid media/category structures.
2. Use that predicate before media registration performs any in-memory mutation.
3. Use the same predicate before opening or saving media edit modal actions.
4. Disable add/edit controls and show a localized error toast when invalid.
5. Ensure deleted JSON playlist cache in `AmbientUserData.playlistContext.playlist` falls back to a valid state during startup or selector sync.

Acceptance criteria:

- In local mode with no valid playlist, Add Media cannot mutate in-memory playlist data.
- In local mode with an invalid cached playlist, media registration and media edit are unavailable with a clear toast.
- Existing cloud MyPlaylist behavior is unchanged.
- Switching to a valid JSON playlist restores normal registration/edit behavior.

### Slice C: Local Media Metadata Assistance

Tasks:

1. Add a local metadata extraction module for selected `File` objects.
2. Extract, where available:
   - title -> Ambient title
   - artist -> Ambient artist
   - description/comment -> Ambient desc
3. Reuse the v2.6.2 suggestion UI model:
   - title may be applied automatically only when the field is empty or still contains the previous auto value.
   - artist/description remain user-applied suggestions.
4. Keep filename basename as fallback when metadata is absent or parsing fails.
5. Sanitize all values through existing media text/description sanitizers.

Recommended initial support:

- ID3v2 text frames for MP3-like audio files:
  - `TIT2` title
  - `TPE1` artist
  - `COMM` comment/description
- Optional follow-up for MP4/M4A atoms if the selected parser/library handles them cleanly.

Decision point for implementation:

- Prefer a small, isolated parser/library if bundle impact is acceptable.
- If avoiding a dependency, implement a narrow ID3v2 parser limited to the frames above and document unsupported formats.

Acceptance criteria:

- A local media file with title/artist/comment metadata shows suggestions.
- A file without supported metadata still fills title from basename.
- User-edited title/artist/description are not overwritten by late metadata results.
- Invalid media files do not trigger metadata suggestions.

### Slice D: ffmpeg Thumbnail Generation Capability and Endpoint

Tasks:

1. Add env variable parsing:
   - `FFMPEG_PATH` or final agreed name `AMBIENT_FFMPEG_PATH`.
2. Expose a non-secret capability in `AmbientData`, for example:
   - `thumbnailGeneration.enabled`
   - `thumbnailGeneration.formats`
3. Add a local-mode-only API endpoint:
   - recommended: `POST /thumbnail-generate`
4. Validate:
   - ffmpeg path exists and is executable.
   - requested media file resolves under `MEDIA_DIR`.
   - media extension is an Ambient-supported local video extension.
   - seek time is a non-negative number.
5. Execute ffmpeg with argument-array process creation, never shell-string concatenation.
6. Return generated image as data URL or base64 payload without writing final file yet.
7. On media edit save, reuse existing thumbnail upload pipeline to persist the generated data as `<hash>.webp`.

Acceptance criteria:

- With no valid ffmpeg path, the UI button is hidden/disabled.
- For YouTube media, the generation button is hidden/disabled.
- For local audio media, the generation button is hidden/disabled.
- For local video media with preview and ffmpeg enabled, clicking the button creates an in-memory thumbnail from the current preview seek time.
- Save changes persists the thumbnail into `<ASSETS_DIR>/images/`.
- Failed ffmpeg execution shows an error toast and leaves the existing thumbnail unchanged.

### Slice E: Media Edit Thumbnail Drag and Drop

Tasks:

1. Reuse the existing `file-dropzone` pattern where possible.
2. Convert the thumbnail upload area into a drop target while keeping the existing pick button for accessibility and keyboard users.
3. Accept only image MIME types and existing allowed extensions: `png`, `jpeg`, `jpg`, `gif`, `webp`.
4. Update draft state using the current `thumbnailMode: 'upload'` path.

Acceptance criteria:

- Dragging an image file updates thumbnail preview and draft state.
- Dragging a non-image file is rejected with visual invalid state and a localized toast/message.
- Existing choose-image behavior still works.
- Thumbnail is not uploaded until Save changes.

### Slice F: Media Edit Description Auto-Resize

Tasks:

1. Convert the description field in the edit modal to an auto-growing textarea if it is not already one.
2. Keep initial visual height equivalent to `rows="5"`.
3. On input and form binding, update height to `scrollHeight`.
4. Use CSS to hide vertical scrollbar in normal state while preserving resize behavior.

Acceptance criteria:

- Long descriptions grow the field vertically without an inner scrollbar.
- Modal layout remains usable on mobile.
- Existing max length and sanitization remain unchanged.

### Slice G: YouTube Advanced Settings in Media Edit

Tasks:

1. Add a YouTube-only Advanced Settings collapse after Default playback volume.
2. For each setting, use an "include this override" checkbox plus a boolean toggle:
   - `cc` -> `cc_load_policy`
   - `fs` -> `fs`
   - `controls` -> `controls`
   - `disablekb` -> `disablekb`
3. Extend `MediaItem` schema/types and PHP sanitizer for `controls` and `disablekb`.
4. On save:
   - checked setting writes true/false to the media item.
   - unchecked setting deletes the property so playlist-level or YouTube origin defaults apply.
5. Player config:
   - map checked `cc=true` to `cc_load_policy=1`.
   - map checked `cc=false` to `cc_load_policy=0`.
   - when `cc_load_policy=1`, add `cc_lang_pref` from current Ambient language normalized to ISO 639-1.
   - map `fs`, `controls`, `disablekb` to `1`/`0`.
   - always include `playsinline=1`.

Acceptance criteria:

- Advanced Settings appear only for YouTube media in the edit modal.
- Unchecked override properties are removed from the saved item.
- Saved properties affect YouTube IFrame `playerVars`.
- `playsinline=1` is present for all YouTube IFrame players.

### Slice H: Autoplay/Mute Investigation

Tasks:

1. Add a manual or Playwright-assisted investigation scenario, not a default behavior change.
2. Test whether starting with `autoplay=1&mute=1`, then unmuting and setting volume after `onReady` or `PLAYING`, improves autoplay success.
3. Observe `onAutoplayBlocked` when available.
4. Document browser-specific results.

Acceptance criteria:

- A short report records tested browsers and outcomes.
- No default mute/unmute behavior is changed unless the result is clearly beneficial and non-regressive.

## 4. Suggested Delivery Order

1. Slice A: low-risk About link.
2. Slice B: local playlist validity gate bug fix.
3. Slice G: schema and player parameter foundation, including `playsinline`.
4. Slice E and F: media edit UI improvements.
5. Slice C: local metadata suggestions.
6. Slice D: ffmpeg thumbnail endpoint and UI.
7. Slice H: autoplay investigation and report.

Reasoning:

- The playlist gate prevents known invalid mutation before adding more edit surfaces.
- YouTube schema/player changes should land before the advanced UI save behavior.
- ffmpeg is the highest-risk slice because it crosses UI, PHP process execution, filesystem safety, and image persistence.

## 5. Test and Validation Plan

Run after implementation:

```powershell
npm run typecheck
npm run build
npm run check:i18n
npm run test:e2e:local:chrome
npm run test:e2e:cloud:chrome
```

Targeted manual checks:

1. About link appears only when `YOUTUBE_DATA_API_KEY` is set.
2. Local mode with deleted cached playlist cannot add/edit media.
3. Local file with ID3 metadata suggests title/artist/description.
4. Local file without metadata falls back to basename.
5. Thumbnail drag/drop accepts images and rejects non-images.
6. ffmpeg thumbnail generation works at multiple seek times and does not write until Save changes.
7. YouTube advanced settings round-trip through edit/save/reload.
8. iPhone/iPad project verifies inline YouTube playback parameter.

## 6. Documentation Updates During Implementation

Update these docs when code is implemented:

- `.env.example`: ffmpeg variable and any capability notes.
- `docs/operations/command-catalog.md`: add ffmpeg/manual verification command if introduced.
- `docs/operations/testing/`: add v2.6.3 scenario notes.
- `docs/operations/test-reports/`: record ffmpeg and autoplay investigation results.

## 7. Open Risks and Questions

1. `FFMPEG_PATH` name is marked tentative in the requirement. Recommendation: use `FFMPEG_PATH` for simplicity unless project env names should be namespaced as `AMBIENT_FFMPEG_PATH`.
2. Browser-side local metadata extraction may need a parser dependency for robust non-ID3 formats. A narrow ID3-only parser is smaller but less complete.
3. ffmpeg output format should default to WebP. PNG is a fallback only if WebP generation fails or ffmpeg build lacks WebP support.
4. Autoplay in inactive tabs is browser-policy constrained. Treat any mute-then-unmute workaround as experimental until verified.
5. The About link condition should reuse server capability, not duplicate env parsing in the view.

## 8. Handoff Contract

Context:

- v2.6.3 requirements were added to `.codex/memo.md`.
- This step intentionally creates planning/design docs only.

Task:

- Implement the slices above in a later code-change step.

Constraints:

- Do not bump `package.json` version manually.
- Do not expose API keys or filesystem paths to the browser.
- Keep cloud/local behavior differences intact.
- Use existing modular TS boundaries introduced in v2.6.0.

Acceptance criteria:

- All slice-level acceptance criteria pass.
- No in-memory mutation happens when local current playlist is invalid.
- ffmpeg cannot access paths outside configured media/assets directories.

Deliverables:

- Source changes, tests, and a validation report in the implementation step.
