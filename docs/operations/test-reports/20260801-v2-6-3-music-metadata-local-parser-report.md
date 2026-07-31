# v2.6.3 Music Metadata Local Parser Report

Date: 2026-08-01

## Scope

Replace the browser-side hand-written ID3 parser with the `music-metadata` library while keeping local metadata extraction entirely in the frontend.

## Implementation Notes

- `music-metadata` is loaded with a dynamic `import('music-metadata')` only when a local media file is selected.
- The previous binary ID3 parser was removed.
- Local metadata extraction still runs against the selected browser `File`; PHP is not involved.
- The title fallback remains the selected media basename without extension.

## Field Mapping

Title:

- `metadata.common.title`
- `metadata.common.subtitle`
- Native fallback: `TIT2`, `TT2`, `TIT3`, `TT3`
- Final fallback: media file basename without extension

Artist:

- `metadata.common.artists`
- `metadata.common.artist`
- `metadata.common.albumartists`
- `metadata.common.albumartist`
- Native fallback: `TPE1`, `TP1`, `TPE2`, `TP2`, `TPE3`, `TP3`, `TPE4`, `TP4`, `TOPE`, `TOA`

Description:

- `metadata.common.comment`
- `metadata.common.grouping`
- Native fallback: `COMM`, `COM`, `TIT1`, `TT1`

## Validation

- `npm run typecheck`: Pass
- `npm run build`: Pass
- In-memory `music-metadata.parseBlob()` verification with generated ID3v2.3 title, artist, and comment tags: Pass

## Follow-Up

Manual verification should be repeated with the MP3 file whose Windows properties show "Participating artists", because that file is the regression target for this change.

## Regression Fix

After the initial `music-metadata` integration, selecting a valid local media file in the production build caused Ambient to initialize twice.

Root cause:

- `music-metadata` is loaded through a dynamic import.
- Vite emitted `dist/assets/core.js`, and that chunk imports `./ambient.js` for the Vite preload helper.
- PHP loaded the entry module as `./dist/assets/ambient.js?{filemtime}`.
- Browser module identity includes the query string, so `ambient.js?{filemtime}` and `ambient.js` were treated as different modules.
- When `core.js` imported `./ambient.js`, the Ambient entry module executed a second time, re-dispatching the initial notice and re-binding UI state.

Fix:

- Remove the `?filemtime` query from the production module script entry URL in `functions.php`.
- Keep the entry URL identical to the URL used by Vite-generated dynamic chunks.

Regression validation:

- Opened the options modal.
- Selected a valid MP3 from `assets/media`.
- Confirmed `music-metadata` extracted title and artist suggestion.
- Confirmed the initial notice was not dispatched a second time.
- Closed and reopened the options modal successfully after metadata extraction.
