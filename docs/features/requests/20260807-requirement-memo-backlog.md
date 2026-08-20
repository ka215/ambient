# Requirement Memo Backlog

Date: 2026-08-07
Source: `.codex/memo.md`
Inventory scope: current, future, and carryover candidates only.

## 1. Current: v2.6.5

The following items remain relevant to the current v2.6.5 branch:

- Inventory `.codex/` files and define Git management rules.
- Extend the media URL resolver hook/pipeline.
- Triage any newly found defects during v2.6.5 implementation.

Notes:

- The `.codex/` inventory task has already started and produced tracked documentation candidates under `docs/`.
- The media URL resolver work has been promoted to:
  - `docs/architecture/design/20260807-v2-6-5-local-media-url-resolver-design.md`
  - `docs/operations/handoffs/20260807-v2-6-5-local-media-url-resolver-handoff-requirements.md`

## 2. Future: v2.7.0

### View Transitions API / UI Motion

Use the View Transitions API and related UI motion work to improve Ambient's UX.

Candidate ideas:

- Cross-fade reload-like flows such as restart and language switching instead of full visual redraws.
- Animate option modal accordion open/close behavior.
- When opening one accordion item, close other open items while transitioning into the new active item.
- Rotate the right-side caret indicator by 180 degrees during accordion state changes.
- Reduce closed accordion item height so the active accordion content has more available space.
- Add modal show/hide animations.
- Animate modal containers with fade plus center-origin scale in/out.
- Animate modal backdrops with shorter fade plus blur.
- Add richer carousel thumbnail transitions for previous/next navigation.

Reference:

- Basic design work was handled in v2.3.4, but implementation was deferred.

## 3. Undefined Future Requirements

### GitHub Star / Watch UI

Add UI under About Ambient to star/watch the GitHub repository via GitHub REST API.

Initial notes:

- Requires a personal access token with `public_repo` or `repo` scope.
- Candidate endpoints:
  - Star: `PUT /user/starred/{owner}/{repo}`
  - Unstar: `DELETE /user/starred/{owner}/{repo}`
  - Watch: `PUT /repos/{owner}/{repo}/subscription` with `subscribed: true`
  - Unwatch: `DELETE /repos/{owner}/{repo}/subscription`

Open concerns:

- Token entry/storage must be designed before implementation.
- This may be inappropriate for default Ambient core if it creates security or UX burden.

### Playlist Display Label

Add optional playlist display names via `options.label`.

Expected behavior:

- If `options.label` is a non-empty string, playlist dropdowns display that label instead of the JSON filename.
- If `options.label` is `null`, undefined, or an empty string, retain current filename display behavior.

Open concerns:

- Confirm whether label editing belongs in Playlist Management.
- Confirm localization expectations for labels stored in playlist JSON.

### Custom Audio Player

Replace or extend the native `<audio>` player with a custom player styled like a Flowbite card with image.

Expected direction:

- Show thumbnail artwork/image at the top.
- Place player controls below the image.
- Align light/dark mode styling with existing Ambient player surfaces.

Open concerns:

- Browser media controls accessibility and platform behavior need review before replacing native controls.
- This may overlap with the v2.7.0 UI motion/UX work.

## 4. Carryover Candidates From Released Sections

These items appeared under already released sections but should not be silently discarded because they are marked partially done, lack an explicit completion marker, or look like deferred work.

### Inline SVG Static Asset Expansion

Source sections:

- v2.3.1: `[partially-done]` static asset conversion for inline SVG resources.
- v2.3.2: `[partially-done]` broader fixed-UI inline SVG cleanup.

Recommended status:

- Carry forward only if current source still contains meaningful repeated inline SVG debt.
- Otherwise archive as historical refactor background.

### Web Storage Capacity Research

Source section:

- v2.4.0: future investigation into moving cloud playlist persistence from `localStorage` to IndexedDB or related Web Storage alternatives.

Recommended status:

- Keep as future research unless cloud playlist size limits become a near-term issue.

### Local Media Metadata Autocomplete

Source section:

- v2.6.3: local media registration autocomplete from ID3/media metadata.

Candidate behavior:

- Title: metadata title/subtitle, falling back to media filename basename.
- Artist: participating artist or album artist metadata when available.
- Description: comment or content group description metadata when available.
- Match the v2.6.2 YouTube Data API autocomplete UX where practical.

Recommended status:

- Keep as a future feature candidate.
- This is distinct from v2.6.5 URL resolver work and should not be bundled into the current branch unless explicitly requested.

### Media Edit Description Auto-Resize

Source section:

- v2.6.3: auto-resize the Media Edit Description textarea beyond `rows="5"` without a vertical scrollbar.

Recommended status:

- Verify current implementation before deciding.
- If already fixed as part of later v2.6.3 work, archive.
- If still missing, keep as a small UX backlog item.

### YouTube Advanced Media Item Schema Fields

Source section:

- v2.6.3: advanced YouTube settings mention potential schema additions for `controls` and `disablekb`.

Recommended status:

- Verify current playlist schema and player parameter handling.
- If implemented, archive.
- If not, keep as schema/compatibility backlog before exposing more YouTube options.

## 5. Archive Policy

Already released sections should not be migrated wholesale.

Archive by default:

- Items marked `[done]`, `[fix]`, or `[reject]`.
- Requirements that are already represented in GitHub Releases.
- Detailed historical discussion that has no active implementation or design consequence.

Retain only:

- Current branch requirements.
- Future version candidates.
- Partially done work.
- Released-section notes that clearly describe deferred or unresolved behavior.
