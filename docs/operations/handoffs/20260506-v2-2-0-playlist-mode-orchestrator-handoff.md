# Handoff: v2.2.0 Playlist Mode Implementation

## Context
- Branch baseline: `dev`.
- Design source:
  - `docs/architecture/design/20260506-v2-2-0-playlist-mode-design-spec.md`
- Product direction:
  - v2.2.0 delivers delete + reorder mode.
  - edit mode is placeholder only (disabled).

## Task
Implement playlist operation modes in the left drawer header:
- Add mode button + dropdown + active mode badge.
- Implement `Delete` mode with multi-select checkboxes and confirm/apply flow.
- Implement `Reorder` mode with SortableJS DnD and confirm/apply flow.
- Keep `Edit` visible but disabled in v2.2.0.

## Constraints
- Preserve existing behavior in `Normal` mode.
- Non-normal mode must lock playback click interaction.
- Non-normal mode must hide quick-add item.
- Mutable operations are for cloud `MyPlaylist` only.
- Avoid broad refactor; additive changes only.

## Acceptance Criteria
- Dropdown includes Normal/Edit/Reorder/Delete.
- Edit is disabled and non-selectable in v2.2.0.
- Delete mode:
  - checkboxes visible,
  - multiple select possible,
  - mode exit prompts confirm,
  - OK applies deletion,
  - Cancel reverts with no data change.
- Reorder mode:
  - drag and drop available,
  - mode exit prompts confirm,
  - OK applies new order,
  - Cancel restores original order.
- Apply operations persist to localStorage for MyPlaylist.
- Normal mode playback and existing quick-add behavior remain unchanged.

## Deliverables
- Source code changes for mode UX + state handling.
- Dependency update for SortableJS and typings.
- E2E scenarios for delete/reorder commit and cancel flows.
- Test report including known limitations/risks.

## Validation Required
- Run relevant build/test commands.
- Include command output summary.
- Include manual verification checklist for mobile touch behavior.

## Known Risks to Monitor
- Event leakage causing unintended playback in non-normal modes.
- Drag gesture conflict with drawer scrolling on touch devices.
- State desync during mode transitions.
