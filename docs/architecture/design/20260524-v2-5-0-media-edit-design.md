# v2.5.0 Media Item Edit Design Spec

Date: 2026-05-24  
Target version: v2.5.0  
Target branch: `feature/v2.5.0`

## 1. Purpose

Add a dedicated media item edit flow for playlist items while preserving the current playlist mode model and cloud/local environment split.

The edit flow must be safe by default:
- cloud mode: only `MyPlaylist` is editable
- local mode: all playlists are editable
- editing uses a fullscreen modal with no backdrop
- the playlist drawer and other UI must remain blocked while the edit modal is open

## 2. Confirmed Requirements

### 2.1 Entry point
- The existing playlist drawer mode switch already exposes `Edit` as a placeholder.
- Selecting `Edit` puts the playlist into edit mode.
- Clicking a playlist item in edit mode opens the media edit modal for that item.

### 2.2 Modal behavior
- Fullscreen modal
- No backdrop interaction
- Header left: localized Media Edit label / `Media Edit`
- Header right: close button (`✕`) that cancels editing and closes the modal
- `Esc` closes the modal
- `Cancel` closes the modal and discards changes
- `Save` commits changes and closes the modal on success

### 2.3 Editable scope
- cloud: only localStorage-backed `MyPlaylist`
- local: all JSON playlists
- cloud existing JSON playlists remain read-only
- cloud `Edit` must be disabled if `MyPlaylist` does not exist

### 2.4 Editable fields
Ordered fields:
1. Category
2. Media title
3. Artist name
4. Description
5. Default volume
6. Custom thumbnail image, local only
7. Media preview
8. Seek start/end
9. Fade-in end / fade-out start
10. Cancel / Save

### 2.5 Media type badge
- No media-type radio buttons in edit mode
- Show a badge indicating the immutable source type:
  - YouTube media: YouTube icon + localized media label
  - local video: generic video icon + localized local media label
  - local audio: generic audio icon + localized local media label
- Headline must show the full title and the badge
- Under the headline, show either YouTube URL or local file path

### 2.6 Validation rules
- Category is required and cannot be empty
- No empty-category fallback is allowed
- Time inputs are integer seconds only
- Time relations must be validated:
  - start <= end
  - start <= fade-in end
  - fade-out start <= end
  - fade-in end <= fade-out start
- Title / artist / description validation should reuse existing media-management rules
- Local thumbnail upload allows png/jpeg/gif/webp only
- Uploaded thumbnail keeps the original file name and overwrites on collision

### 2.7 Local thumbnail removal
- When a thumbnail exists, show a small preview with an overlaid `✕` button
- Deleting the thumbnail requires a confirmation dialog

### 2.8 Preview synchronization
- YouTube preview uses the iframe player current time
- local preview uses the HTML audio/video current time
- When a sync button is pressed, the current time is captured and copied into the relevant input
- If the returned value contains decimals, truncate to an integer second

### 2.9 Edit session retention
- Unsaved values persist within the same session only
- A session-scoped in-memory draft store is acceptable; `sessionStorage` is also acceptable if needed
- Drafts reset on successful save
- Drafts are keyed by playlist + media identity

### 2.10 Confirmation behavior
- If the user switches away from edit mode while an unsaved edit exists, show a discard confirmation dialog
- If no unsaved edit exists, switching is immediate
- The same rule applies when leaving edit mode, closing the modal, or changing the edited item

## 3. Architecture Decisions

### 3.1 State model
Use a dedicated edit state layered on top of the existing playlist mode state.

Proposed states:
- `normal`
- `edit`
- `edit_pending_save`
- `edit_dirty`

The modal state must be independently tracked from the playlist mode state so that closing the modal can restore the mode safely.

### 3.2 Draft store
Use an in-memory draft map first.

Recommended draft key:
- `playlistKey + mediaIdentity`

Identity priority:
1. stable internal ID if present
2. source file + video id + title fallback tuple

The implementation should avoid relying only on render-order indexes because playlist reorder/import can move items.

### 3.3 Save persistence
- cloud: persist MyPlaylist to browser storage
- local: persist the edited JSON playlist through a new save API

The local save path is a new API, separate from the import API.

### 3.4 Immediate UI refresh
After save, refresh:
- playlist list UI
- current media metadata UI
- if safe, the active player state

If direct player state refresh would be risky, fall back to UI refresh only and keep playback continuity unchanged.

## 4. UI / UX Details

### 4.1 Modal shell
- Fullscreen layer above drawers and all other UI
- Focus trap required
- Keyboard traversal order must be predictable
- The modal must not allow interaction with other page areas while open

### 4.2 Header
- Title: localized Media Edit label
- Close button: `✕`
- No backdrop click-to-close requirement

### 4.3 Category field
- Reuse the existing playlist category source
- If the playlist has no categories yet, the first registered category must be entered as text, not chosen from a dropdown
- The empty-category fallback text `New Category` is preserved for the creation flow, but edit mode must not allow empty-category transitions

### 4.4 Preview area
- Media preview is part of the modal body
- Display an inline error panel for preview load failures
- A retry button is optional for the first version

### 4.5 Button behavior
- `Cancel`: discard local draft and close
- `Save`: validate, persist, show toast, and close on success

### 4.6 Toasts
Use a fixed message set:
- Save success
- Save failure
- Validation error
- Upload failure
- Thumbnail delete success
- Thumbnail delete failure

## 5. Data Contracts

### 5.1 Editable payload
The edit modal should operate on a normalized media item object with the current fields preserved.

Must preserve:
- media source type
- playlist context
- category context
- thumbnail reference
- playback timing fields

### 5.2 Local save API
New API required.

Expected responsibilities:
- accept the edited playlist payload
- validate the file target
- write the updated JSON back to disk
- return success/failure information for toast generation

### 5.3 Validation contract
Validation should run in this order:
1. field-level sanitization
2. required-field checks
3. time relationship checks
4. save attempt
5. post-save refresh

## 6. Implementation Slices

### Slice A: modal shell and edit entry
- enable the Edit option when allowed
- open fullscreen modal from playlist item click
- block background interaction
- implement cancel/close behavior

### Slice B: form binding and draft retention
- populate editable fields
- preserve draft state during the same session
- discard unsaved state on cancel or successful save

### Slice C: validation and preview sync
- reuse existing sanitization rules
- implement integer-only seek synchronization
- add time relation validation
- add preview error display

### Slice D: persistence
- cloud MyPlaylist save path
- new local save API
- thumbnail upload and removal flow

### Slice E: refresh and regression protection
- refresh playlist and player UI after save
- keep cloud JSON playlists read-only
- keep non-edit modes unchanged

## 7. Acceptance Criteria

1. Edit mode opens a fullscreen modal for the selected item.
2. cloud mode only allows MyPlaylist editing; JSON playlists remain read-only.
3. cloud mode disables Edit when MyPlaylist is absent.
4. local mode can edit all playlists.
5. Category, title, artist, description, volume, preview sync, and thumbnail flows work as specified.
6. Time validation rejects invalid sequences.
7. Unsaved edits are preserved within the same session only.
8. Save success updates the playlist state and closes the modal.
9. Save failure keeps the draft intact and leaves the modal open.
10. Focus trap and Escape key behavior work.

## 8. Test Strategy

### 8.1 Unit / logic tests
- mode gating
- draft store keying
- integer time normalization
- time relation validation
- save path branching

### 8.2 Manual / E2E scenarios
- open edit modal from playlist item click
- attempt edit on cloud JSON playlist and verify block
- verify unsaved state survives item re-open in the same session
- verify invalid time combinations are rejected
- verify thumbnail upload and delete flow
- verify save success refreshes the playlist UI

## 9. Risks

1. Player refresh after save may interfere with playback continuity.
2. Draft identity collisions can happen if the key is too weak.
3. Local save API and thumbnail upload need clear rollback behavior.
4. If the edit modal does not fully capture focus, background interaction bugs can leak through.

## 10. Out of Scope

- v2.5.1 multilingual expansion beyond Japanese
- View Transitions API motion work
- playlist reorder/delete redesign
- GitHub Star/Watch UI
