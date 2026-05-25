# v2.5.0 Media Edit Handoff

Date: 2026-05-24  
Target branch: `feature/v2.5.0`  
Target agent: `implementation-agent`

## Objective

Implement the playlist media item edit feature for Ambient v2.5.0 using the confirmed requirements and the companion design spec.

## Context

The edit entry point already exists in the playlist mode dropdown as a disabled placeholder. The task is to turn that path into a working edit flow without breaking the current normal / reorder / delete flows.

The approved design is documented in:
- [docs/architecture/design/20260524-v2-5-0-media-edit-design.md](../../architecture/design/20260524-v2-5-0-media-edit-design.md)

## Scope

### In scope
- fullscreen media edit modal
- edit mode activation from the playlist drawer
- cloud MyPlaylist-only editing
- local playlist editing
- field binding, validation, and draft retention
- local thumbnail upload and removal
- preview time synchronization
- save persistence, including a new local save API
- immediate UI refresh after save where safe

### Out of scope
- v2.5.1 language expansion beyond Japanese
- playlist reorder/delete redesign
- View Transitions API motion work
- GitHub Star/Watch UI

## Constraints

1. cloud mode existing JSON playlists must remain read-only.
2. cloud `Edit` must be disabled if `MyPlaylist` does not exist.
3. The edit modal must block interaction with the rest of the UI.
4. Unsaved edits must persist only within the same session.
5. Local save must use a new API, not the import path.
6. Media timing is integer seconds only.
7. Invalid timing relationships must be rejected.
8. Local thumbnail file names keep the original name and overwrite on collision.
9. Existing behavior in normal mode must not change.

## Acceptance Criteria

1. Clicking a playlist item in edit mode opens the fullscreen edit modal.
2. cloud MyPlaylist can be edited; cloud JSON playlists cannot.
3. The edit option is unavailable when cloud MyPlaylist is missing.
4. local mode edits all playlists.
5. Save success updates the playlist state and closes the modal.
6. Save failure keeps the modal open and preserves the draft.
7. Escape and Cancel close the modal.
8. Focus trap works while the modal is open.
9. Preview time sync works for both YouTube and local playback.
10. Thumbnail upload and deletion work with confirmation.

## Deliverables

- source code changes in `src/` and `views/`
- any new PHP endpoint for local playlist save
- updated or new unit/E2E tests where applicable
- validation notes in the eventual implementation report

## Suggested Implementation Order

1. Add edit-mode state and modal shell.
2. Bind the selected item into a draft model.
3. Implement validation and time sync.
4. Add cloud save path and new local save API.
5. Add thumbnail upload/removal support.
6. Refresh UI after save and cover regressions with tests.

## Notes for Return

Return the following fields:
- Result Summary
- Changed Files
- Validation Executed
- Known Risks
- Next Recommended Action