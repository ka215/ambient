# v2.6.3 Detailed Design Draft

Date: 2026-07-31
Target release: v2.6.3
Feature set: media management safeguards, local metadata assist, ffmpeg thumbnails, media edit UX, YouTube player parameters
Source requirement: `.codex/memo.md`
Status: draft for review

## 1. Design Objective

Implement v2.6.3 without disturbing the v2.6 modular boundaries.

The design must:

- Prevent invalid local playlist mutations before in-memory state changes.
- Reuse the v2.6.2 metadata suggestion pattern for local files.
- Keep ffmpeg execution server-side, local-only, path-safe, and disabled by default.
- Store generated thumbnails only when the user commits the media edit.
- Extend YouTube per-media player options without forcing overrides when a setting is unchecked.
- Keep secrets and local filesystem paths out of browser-visible configuration.

## 2. Layer Ownership

| Layer | Ownership |
|---|---|
| `src/Ambient.php` | public non-secret capabilities, route registration |
| `src/api.php` | ffmpeg thumbnail endpoint, playlist/item schema sanitization |
| `views/collapse.php` | About link, static edit modal controls |
| `src/scripts/platform/*` | internal API clients, browser file metadata adapter |
| `src/scripts/domain/*` | item construction, edit draft storage shape, save pipeline |
| `src/scripts/ui/*` | form bindings, suggestion UI, media edit controls, auto-resize behavior |
| `src/scripts/ui/player/*` | YouTube `playerVars` normalization |
| i18n files | user-facing strings |
| tests/docs | E2E/manual verification reports |

Forbidden:

- Direct browser access to `YOUTUBE_DATA_API_KEY`.
- Browser access to ffmpeg path or absolute local filesystem paths.
- Shell-string command construction for ffmpeg.
- ffmpeg generation for arbitrary URLs.
- In-memory playlist mutation before local playlist validity is confirmed.

## 3. Public Capabilities

### 3.1 Existing YouTube Metadata Capability

Reuse the v2.6.2 shape:

```ts
interface YouTubeMetadataCapability {
  enabled: boolean;
  monthlyLimit: number | null;
  allowOverLimit: boolean;
}
```

The About link should key off this server-built capability.

### 3.2 New Thumbnail Generation Capability

Add:

```ts
interface ThumbnailGenerationCapability {
  enabled: boolean;
  outputFormat: 'webp' | 'png';
  maxSourceBytes?: number;
}

interface AmbientDataGlobal {
  thumbnailGeneration?: ThumbnailGenerationCapability;
}
```

Rules:

1. `enabled` is true only in local mode and only when configured ffmpeg path is executable.
2. The browser receives only capability booleans and output format, not `FFMPEG_PATH`.
3. If WebP support cannot be cheaply detected at boot, expose `webp` as the intended format and let the endpoint return a clear error if the ffmpeg build cannot encode it.

## 4. Environment Configuration

### 4.1 Variable

Recommended initial variable:

```dotenv
FFMPEG_PATH=
```

Alternative:

```dotenv
AMBIENT_FFMPEG_PATH=
```

Recommendation:

- Use `FFMPEG_PATH` because it matches the requirement and is clear.
- Internally allow `AMBIENT_FFMPEG_PATH` as a fallback only if project maintainers want namespacing.

### 4.2 Parsing Rules

- Trim value.
- Empty means disabled.
- Resolve relative values from `APP_ROOT` only for development convenience.
- Absolute paths are allowed.
- Validate with `is_file()` and `is_executable()` where supported. On Windows, also accept existing `.exe` paths even if `is_executable()` is unreliable.
- Do not serialize the resolved path.

## 5. About Ambient Link

Current location:

- `views/collapse.php` About accordion technology list.

Design:

```php
<?php if ( $this->get_youtube_metadata_capability()['enabled'] ?? false ) : ?>
  <li><a href="https://developers.google.com/youtube/v3" ...><?= __( 'YouTube Data API' ) ?></a></li>
<?php endif; ?>
```

Implementation should avoid calling a private method directly from a view if the project prefers render helpers. If needed, expose a small `is_youtube_metadata_enabled()` helper on the render/utils side.

## 6. Local Playlist Mutation Guard

### 6.1 Problem

In local mode, when the current playlist is missing or invalid, media registration can still update in-memory playlist state before persistence fails. This creates a session-only phantom playlist item.

### 6.2 Mutation Eligibility

Create or consolidate:

```ts
interface PlaylistMutationContext {
  isCloud: boolean;
  playlistName: string | null;
  availablePlaylists?: Record<string, string>;
  statusPlaylist?: string | null;
  mediaItems?: unknown[] | null;
  categories?: unknown[] | null;
}

function canMutatePlaylist(context: PlaylistMutationContext): boolean;
```

Rules:

1. Cloud mode follows existing MyPlaylist/localStorage rules.
2. Local mode requires:
   - `playlistName` is non-empty.
   - `availablePlaylists[playlistName]` exists.
   - `statusPlaylist === playlistName`.
   - current media collection is an array.
   - categories are null or an array depending on current project convention, but invalid non-array values fail.
3. If invalid, UI disables mutation controls and shows a localized error.

### 6.3 Call Sites

Apply before:

- Add media click handler in `ui/forms/media-management.ts`.
- Opening edit modal in playlist edit mode.
- Save changes in media edit pipeline.
- Thumbnail generation requests, because they depend on a real local media item.

Important ordering:

1. Validate mutation context.
2. Validate form fields.
3. Build next media item or edit draft.
4. Mutate in-memory state.
5. Persist.

The current add flow should move the guard before `addMediaData()` and before `updatePlaylist()`.

## 7. Local Media Metadata Assistance

### 7.1 Data Contract

```ts
interface LocalMediaMetadataPayload {
  title: string;
  artist: string;
  desc: string;
  source: 'local-file-metadata';
  format?: 'id3v2' | 'mp4' | 'unknown';
}

interface LocalMediaMetadataResult {
  ok: boolean;
  data?: LocalMediaMetadataPayload;
  reason?: 'unsupported-format' | 'not-found' | 'parse-error';
}
```

### 7.2 Extraction Strategy

Initial implementation options:

1. Dependency-backed parser:
   - More robust for MP3/M4A/FLAC/Ogg.
   - Adds bundle size and license review.
2. Narrow built-in ID3v2 parser:
   - Smaller and no dependency.
   - Supports only the most valuable near-term fields.

Recommendation:

- Start with a narrow, isolated built-in ID3v2 parser for `TIT2`, `TPE1`, and `COMM`.
- Keep the module boundary generic so a library can replace the parser later without changing UI bindings.

### 7.3 UI Behavior

Reuse the YouTube metadata assist pattern but use local labels:

- Status: "Local metadata found."
- Apply all
- Apply title
- Apply artist
- Apply description
- Dismiss

Behavior:

1. When a valid local file is selected, attempt metadata extraction after file validation succeeds.
2. If metadata exists:
   - title applies automatically only if title is empty or still equals the previous auto value.
   - artist/description display as suggestions.
3. If metadata does not exist:
   - title fallback remains `basename(file.name)`.
4. If user edits a field, late metadata cannot overwrite it.

### 7.4 Sanitization

Use existing frontend sanitizers:

- title: `sanitizeMediaTextInput(value, mediaTitleMaxLength)`
- artist: `sanitizeMediaTextInput(value, mediaArtistMaxLength)`
- desc: `sanitizeMediaDescInputLive(value, mediaDescMaxLength)`

Server-side playlist save sanitization remains the final enforcement layer.

## 8. ffmpeg Thumbnail Generation

### 8.1 Endpoint

Recommended route:

```http
POST /thumbnail-generate
Content-Type: application/json
```

Request:

```ts
interface ThumbnailGenerateRequest {
  file: string;
  seekTime: number;
  outputFormat?: 'webp' | 'png';
}
```

Success:

```ts
interface ThumbnailGenerateSuccess {
  state: 'ok';
  code: 200;
  data: {
    filename: string;
    mime: 'image/webp' | 'image/png';
    content: string;
    dataUrl: string;
  };
}
```

Error reasons:

```ts
type ThumbnailGenerateErrorReason =
  | 'not-local-mode'
  | 'not-configured'
  | 'invalid-media'
  | 'unsupported-media'
  | 'invalid-seek-time'
  | 'ffmpeg-failed'
  | 'read-failed';
```

### 8.2 Path Safety

Rules:

1. Accept only media item `file` values already present in the current playlist item.
2. Normalize separators and reject `..`, absolute paths, URL schemes, and null bytes.
3. Resolve under `MEDIA_DIR`.
4. Verify the resolved path remains within `MEDIA_DIR`.
5. Allow only known local video extensions:
   - `mp4`, `webm`, `mov`, `m4v`, `ogv`, `avi`, `mkv`
6. Do not accept YouTube video IDs or remote URLs.

### 8.3 Process Execution

Use `proc_open()` or equivalent with argument arrays.

Conceptual command:

```text
ffmpeg -y -ss {seekTime} -i {inputPath} -frames:v 1 -vf scale=640:-1 -f image2 -vcodec libwebp {tempOutput}
```

Fallback for PNG:

```text
ffmpeg -y -ss {seekTime} -i {inputPath} -frames:v 1 -vf scale=640:-1 {tempOutput.png}
```

Implementation notes:

- Use a temp output file under a server temp directory.
- Limit process timeout if feasible.
- Capture stderr for server logs, not browser response.
- Delete temp files after reading.

### 8.4 Filename

Generated final filename:

```text
sha1(basename_without_extension(file)).webp
```

If the implementation wants collision resistance across same basename in different folders, use:

```text
sha1(normalized_relative_file_path).webp
```

Recommendation:

- Use normalized relative file path hash. It still satisfies the basename intent better than random names and avoids collisions for `folderA/video.mp4` and `folderB/video.mp4`.

### 8.5 Commit Semantics

Generation result updates draft only:

```ts
draft.thumbnailMode = 'upload';
draft.thumbnailName = generatedFilename;
draft.thumbnailMime = generatedMime;
draft.thumbnailDataUrl = generatedDataUrl;
```

Existing `uploadMediaEditThumbnailIfNeeded()` persists the image on Save changes.

This preserves the requirement that generated thumbnails are in-memory until commit.

## 9. Media Edit Thumbnail Drag and Drop

Design:

- Keep the hidden file input and pick button.
- Make the thumbnail preview area a dropzone.
- Reuse `bindFileDropzone()` where possible; otherwise extract a shared file validation helper.
- Valid files update the same draft fields as the picker.

Validation:

- MIME starts with `image/`.
- Filename extension is allowed by existing PHP `sanitize_thumbnail_filename()`.
- Data URL read succeeds.

Accessibility:

- Pick button remains focusable.
- Dropzone state changes are visual, not the only signal.
- Error toast/message is localized.

## 10. Description Auto-Resize

Design:

```ts
function autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}
```

Apply on:

- modal bind/open
- `input`
- programmatic draft updates

CSS:

- `overflow-y: hidden`
- `resize: none` or `resize: vertical` depending on desired manual control. Recommendation: `resize: none` for predictable modal layout.
- `min-height` equivalent to 5 rows.

## 11. YouTube Advanced Settings

### 11.1 Media Item Schema

Extend:

```ts
interface MediaItem {
  cc?: boolean | string;
  fs?: boolean | string;
  controls?: boolean | string;
  disablekb?: boolean | string;
}
```

Server sanitizer:

```php
foreach ( [ 'fs', 'cc', 'controls', 'disablekb' ] as $key ) {
  ...
}
```

Playlist import sanitizer should mirror this list.

### 11.2 Draft Shape

Add structured override fields instead of relying on raw booleans:

```ts
interface YouTubeAdvancedSettingDraft {
  enabled: boolean;
  value: boolean;
}

interface MediaEditDraft {
  youtubeAdvanced?: {
    cc: YouTubeAdvancedSettingDraft;
    fs: YouTubeAdvancedSettingDraft;
    controls: YouTubeAdvancedSettingDraft;
    disablekb: YouTubeAdvancedSettingDraft;
  };
}
```

Save mapping:

- `enabled=true` writes `value`.
- `enabled=false` deletes the property from the item.

### 11.3 UI Placement

Location:

- Edit modal, after Default playback volume.

Visibility:

- Show only when `mediaItem.videoid` is non-empty.

Responsive layout:

- `md` and wider: button appears next to Default playback volume where layout allows.
- `sm` and narrower: button stacks below.
- Collapse content spans the row below the volume/advanced-button row.

Controls:

- One button toggles the advanced section.
- Each row:
  - checkbox: include override
  - label
  - toggle switch: ON/OFF value
  - disabled when include override is unchecked

### 11.4 PlayerVars Mapping

Current `buildYouTubePlayerOptions()` already maps playlist options and some media-level overrides.

Update mapping:

```ts
playerOptions.playsinline = 1;

if (mediaData has controls) {
  playerOptions.controls = Number(Boolean(mediaData.controls));
}

if (mediaData has disablekb) {
  playerOptions.disablekb = Number(Boolean(mediaData.disablekb));
}

if (mediaData has fs) {
  playerOptions.fs = Number(Boolean(mediaData.fs));
}

if (mediaData has cc) {
  playerOptions.cc_load_policy = Number(Boolean(mediaData.cc));
  if (mediaData.cc === true) {
    playerOptions.cc_lang_pref = currentIso6391Language;
  }
}
```

Language source:

- Use existing Ambient current language where available.
- Normalize to first two lowercase letters.
- Fallback to `en` only when UI language is unknown and captions are forced on.

Important:

- `cc_lang_pref` is only useful with or without `cc_load_policy`, but the requirement says to add it when `cc_load_policy=1`; follow that narrower behavior.

## 12. YouTube Player Parameter References

Official docs confirm:

- `playsinline=1` requests inline playback on iOS mobile browsers and eligible WebViews.
- `cc_lang_pref` takes an ISO 639-1 two-letter language code and works with `cc_load_policy=1`.
- `controls=0/1`, `fs=0/1`, and `disablekb=1` are supported player parameters.
- The IFrame API exposes `onAutoplayBlocked`; unmuted autoplay can be blocked by browser policy.

Reference pages:

- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/iframe_api_reference

## 13. Autoplay/Mute Investigation Design

Do not change production default yet.

Investigation scenario:

1. Add temporary or test-only variant with playerVars:
   - `autoplay=1`
   - `mute=1`
   - `playsinline=1`
2. On `PLAYING`, call:
   - `unMute()` if available in local type definition.
   - `setVolume(configuredVolume)`.
3. Listen for `onAutoplayBlocked` when supported.
4. Test active tab vs background tab in Chrome, Safari/iOS if available.

Expected conclusion:

- Muted autoplay may improve initial start in active contexts.
- Unmuting without user gesture is still likely policy-constrained.
- Background/inactive tab autoplay remains unreliable and should not be a release guarantee.

## 14. Validation Matrix

| Area | Validation |
|---|---|
| About link | env on/off render check |
| Local invalid playlist | E2E local mode with stale `AmbientUserData.playlistContext.playlist` |
| Registration guard | assert no in-memory item append when invalid |
| Edit guard | edit controls disabled or toast when invalid |
| Local metadata | fixture MP3 with ID3 tags plus no-tag fallback |
| Thumbnail DnD | image accepted, text/json rejected |
| ffmpeg endpoint | disabled config, invalid path, valid video, path traversal attempt |
| Save pipeline | generated thumbnail persists only after Save changes |
| YouTube advanced settings | properties write/delete and playerVars mapping |
| iOS inline | `playsinline=1` present in YouTube playerVars |
| i18n | `npm run check:i18n` |
| build | `npm run typecheck`, `npm run build` |

## 15. File-Level Change Map for Implementation

Expected source files:

- `src/Ambient.php`
  - add thumbnail capability
  - add thumbnail generation route
  - expose helper for About link if needed
- `src/api.php`
  - add thumbnail generation endpoint
  - extend sanitizer for `controls` and `disablekb`
- `views/collapse.php`
  - About link
  - edit modal advanced settings controls
  - thumbnail dropzone affordance
  - description textarea markup if needed
- `src/scripts/types/ambient.ts`
  - extend `MediaItem`
  - add thumbnail generation and local metadata types
- `src/scripts/types/youtube.ts`
  - add `playsinline`, `disablekb`, `cc_lang_pref`
  - optionally add `mute` and `onAutoplayBlocked` for investigation
- `src/scripts/ui/forms/media-management.ts`
  - local metadata extraction flow
  - stronger invalid playlist guard
- `src/scripts/platform/local-media-metadata.ts`
  - new local metadata adapter/parser
- `src/scripts/platform/thumbnail-generation-api.ts`
  - new endpoint client
- `src/scripts/ui/media-edit/*`
  - element bindings, draft rendering, advanced controls, auto-resize
- `src/scripts/domain/media-edit/*`
  - draft/save mapping for advanced settings
- `src/scripts/ui/player/player-config.ts`
  - playerVars mapping
- i18n resources
  - new labels/messages
- tests
  - targeted local/cloud E2E and API tests

## 16. Rollback and Failure Behavior

- If ffmpeg is not configured or fails, hide/disable generation and keep existing manual thumbnail upload.
- If local metadata parsing fails, silently fall back to filename plus optional debug log.
- If YouTube advanced setting values are absent, existing playlist-level/default behavior remains.
- If invalid playlist is detected, fail closed for mutations and guide the user to select/import a valid playlist.

## 17. Review Notes

Must Fix before implementation is considered complete:

- No mutation before local playlist validity check.
- No ffmpeg path or API key in frontend data.
- ffmpeg path traversal tests pass.
- Unchecked YouTube advanced settings delete media item properties rather than saving false by default.
- `playsinline=1` is always present in YouTube IFrame playerVars.

Should Fix:

- Shared metadata suggestion component to avoid duplicating YouTube/local suggestion logic.
- Dedicated test fixture for ID3 metadata.
- Separate test report for autoplay investigation.

Nice to Have:

- MP4/M4A metadata extraction if parser support is low-cost.
- WebP support detection at capability generation time.
