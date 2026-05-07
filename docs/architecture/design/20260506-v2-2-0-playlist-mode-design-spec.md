# v2.2.0 / v2.3.0 Playlist Mode Design Spec

## 1. Context
- Scope: Cloud mode `MyPlaylist` operation enhancements.
- Current pain points:
  - No batch delete flow.
  - No robust reorder workflow with explicit commit/cancel.
  - Edit flow planned but not finalized for v2.2.0.
- Goal: Introduce explicit playlist operation modes in left drawer while preventing accidental playback/edits.

## 2. Requirement Summary
- Add a mode switch button in the left drawer playlist header (cog icon assumed).
- Tapping mode switch opens a dropdown with:
  - `Normal`
  - `Edit`
  - `Reorder`
  - `Delete`
- Default mode is `Normal`.
- When mode is not `Normal`:
  - Lock normal item click-to-play behavior.
  - Hide quick add list item (`[+] add media`).
  - Switch the mode button icon and label to the active mode.
- Mode behaviors:
  - `Edit`: item click opens edit modal (v2.3.0 target).
  - `Reorder`: drag and drop reorder.
  - `Delete`: show checkbox on each item; checked items are delete targets.
- Commit timing for `Reorder` and `Delete`:
  - User taps mode button again.
  - Confirmation modal appears.
  - OK: apply changes.
  - Cancel: revert (`Reorder`) or keep unchanged (`Delete`).
- v2.2.0 constraint:
  - `Edit` is visible but not selectable (disabled placeholder).
- v2.2.0 implementation order:
  - Delete first, then Reorder.

## 3. Assumptions
- Target playlist for mutable operations remains cloud `MyPlaylist` only.
- JSON file based playlists remain read-only.
- Existing drawer, playlist render pipeline, and localStorage persistence stay as baseline behavior.
- Existing direct-add flow remains available only in `Normal` mode.

## 4. Compatibility Constraints
- Preserve existing playback behavior in `Normal` mode.
- Preserve existing localStorage schema keys unless explicitly versioned.
- Keep keyboard and pointer interaction compatible with current list structure.
- Avoid broad refactor; changes should be additive around mode control and list interaction gates.

## 5. State Model
Define a single playlist operation state:

- `normal`
- `delete_selecting`
- `reorder_editing`
- `edit_disabled` (v2.2.0 placeholder only)
- `confirm_pending` (transient when confirming apply)

Derived UI flags:
- `isInteractionLocked = mode !== normal`
- `showQuickAddItem = mode === normal`
- `showDeleteCheckbox = mode === delete_selecting`
- `enableDnD = mode === reorder_editing`

## 6. UI/UX Design
### 6.1 Header Controls
- Add cog icon button at left drawer playlist header.
- Add dropdown menu anchored to button.
- Reflect the active mode by changing the mode button icon and label when mode != `normal`.

### 6.2 Mode Dropdown
- Items:
  - Normal (enabled)
  - Edit (disabled in v2.2.0)
  - Reorder (conditionally enabled)
  - Delete (enabled)
- Selection transitions state and updates list rendering.
- Reorder is disabled when:
  - the current target category is `All categories`, or
  - the current playlist view contains 1 item or fewer.
- Cross-category reorder is not supported in v2.2.0.

### 6.3 Confirmation Modal
- Triggered when user exits `delete_selecting` or `reorder_editing` via mode button.
- Reorder modal copy: apply or discard reordered sequence.
- Delete modal copy: apply or discard checked deletions.

## 7. Data Contracts
### 7.1 Reorder Working Copy
- Keep in-memory snapshot of initial item order on entering reorder mode.
- Maintain mutable working order while DnD active.
- On cancel: restore initial snapshot.
- On apply: write working order into playlist state + localStorage.

### 7.2 Delete Working Set
- Maintain selected item ids in a Set while delete mode active.
- On cancel: clear set, no persistence.
- On apply: remove selected ids from playlist state + localStorage.

## 8. Library Decision (DnD)
Decision: **Use SortableJS + @types/sortablejs**.

Rationale:
- Better iOS touch handling than ad-hoc HTML5 DnD.
- Lower implementation and regression risk.
- Clear event hooks for commit/cancel workflow.

Non-goal:
- No custom raw pointer/drag engine in v2.2.0.

## 9. Implementation Slices
### Slice A (v2.2.0): Mode Shell
- Header button, dropdown, mode button label/icon switching.
- Interaction lock gate and quick-add visibility gate.
- Edit mode shown but disabled.

### Slice B (v2.2.0): Delete Mode
- Checkbox UI per item.
- Selection state management.
- Confirm modal + apply/cancel flow.
- Persistence update on apply.

### Slice C (v2.2.0): Reorder Mode
- SortableJS integration.
- Working order snapshot and rollback.
- Confirm modal + apply/cancel flow.
- Persistence update on apply.
- Reorder entry is blocked when target category is `All categories`.
- Reorder entry is blocked when visible item count is 1 or fewer.

### Slice D (v2.3.0): Edit Mode
- Enable mode selection.
- Item click opens edit modal.
- Apply edits to item + persistence sync.

## 10. Acceptance Criteria
### v2.2.0
- `Normal/Delete/Reorder` modes selectable; `Edit` visible but disabled.
- In non-normal mode, playback click and quick-add item are blocked.
- Delete mode supports multi-select and confirm apply/cancel behavior.
- Reorder mode supports DnD and confirm apply/cancel behavior.
- Reorder is disabled when `All categories` is selected.
- Reorder is disabled when the current filtered playlist view has 1 item or fewer.
- Apply operations persist to localStorage for MyPlaylist.

### v2.3.0
- Edit mode selectable and opens edit modal.
- Save edits updates list UI and localStorage consistently.

## 11. Test Strategy
- Unit/integration:
  - Mode transitions.
  - Lock gates and quick-add visibility.
  - Delete apply/cancel logic.
  - Reorder apply/cancel rollback.
- E2E:
  - Delete multiple items then apply.
  - Reorder disabled in `All categories`.
  - Reorder disabled when filtered item count is 1 or fewer.
  - Reorder then cancel (restore original).
  - Reorder then apply (persisted order).
  - Ensure normal mode playback works unchanged.
- Manual iOS checks for DnD interaction quality.

## 12. Risks
- Event leakage causing accidental play in non-normal mode.
- DnD gesture conflict with drawer scrolling on mobile.
- Inconsistent state when playlist changes externally during mode operation.

## 13. Out of Scope
- Bulk edit.
- Cross-playlist mutable operations on JSON playlists.
- Schema redesign for playlist storage.
