# Codex Memo Inventory

Date: 2026-08-07
Source file: `.codex/memo.md`
Status: inventory report

## 1. Objective

Inventory `.codex/memo.md` and decide what should be promoted into tracked project documentation.

The source memo is a mixed work log containing:

- already released requirements
- current branch notes
- future feature ideas
- undefined requirements
- historical implementation discussion

## 2. Inventory Method

The memo was reviewed by section heading and status marker.

Primary extraction targets:

- `not yet` sections
- the undefined requirements section
- `[partially-done]` entries
- already released entries without clear `[done]`, `[fix]`, or `[reject]` markers
- lines suggesting deferred work, such as future plans or unresolved implementation candidates

Archive by default:

- already released sections with completed/fixed/rejected markers
- requirements expected to be covered by GitHub Release notes
- historical implementation detail that is not needed for current or future planning

## 3. Section Classification

### Archive

Most sections from v2.0.0 through v2.6.4 are treated as historical archive.

Reason:

- They are marked `already released`.
- The user confirmed that released requirements are expected to be represented in GitHub Release notes.
- Keeping all historical text would duplicate release records and add noise to tracked docs.

### Current

`v2.6.5 - not yet`

Promoted to tracked documentation:

- `.codex/` inventory and Git management task
- local media URL resolver pipeline work

Related tracked docs:

- `docs/architecture/design/20260807-v2-6-5-local-media-url-resolver-design.md`
- `docs/operations/handoffs/20260807-v2-6-5-local-media-url-resolver-handoff-requirements.md`

### Future

`v2.7.0 - not yet`

Promoted as future backlog:

- View Transitions API and UI motion work

### Undefined

The undefined requirements section

Promoted as future backlog:

- GitHub Star / Watch UI
- playlist display labels via `options.label`
- custom audio player with thumbnail/card layout

### Carryover Candidates

Released sections still contain a few entries that should be reviewed before full archive:

- inline SVG static asset expansion
- Web Storage / IndexedDB cloud playlist capacity research
- local media metadata autocomplete
- Media Edit Description textarea auto-resize
- YouTube advanced media item schema fields such as `controls` and `disablekb`

These are documented in:

- `docs/features/requests/20260807-requirement-memo-backlog.md`

## 4. Recommended Source Handling

Do not track `.codex/memo.md` as-is.

Reasons:

- It is large and mixed-purpose.
- It combines completed requirements, scratch notes, and future planning.
- Tracking it directly would create long-term documentation noise.

Recommended handling:

1. Keep `.codex/memo.md` ignored.
2. Treat it as a local scratch source until fully drained.
3. Promote only active or future items into `docs/features/requests/`.
4. Promote operational decisions into `docs/operations/handoffs/`.
5. After the user confirms no additional sections are needed, either leave the memo local or replace it with a short pointer note in `.codex/`.

## 5. Result Summary

Promoted content:

- current v2.6.5 notes
- v2.7.0 View Transitions/API motion idea
- undefined future requirements
- carryover candidates from released sections

Not promoted:

- full already released requirement history
- detailed old discussion already covered by releases or existing docs
- rejected items, except where they explain why a backlog item should not proceed

## 6. Changed Files

- `docs/features/requests/20260807-requirement-memo-backlog.md`
- `docs/operations/handoffs/20260807-codex-memo-inventory.md`

## 7. Validation

Validation performed:

- Read `.codex/memo.md` section headings and relevant markers.
- Extracted current/future/carryover candidates.
- Confirmed no direct edits were made to `.codex/memo.md`.

## 8. Open Risks

- Some already released entries without explicit markers may still be completed in implementation. They are listed as carryover candidates pending verification, not accepted requirements.
- GitHub Release notes were not cross-checked item by item during this inventory.
- The current backlog document intentionally summarizes rather than preserving every historical wording detail.
