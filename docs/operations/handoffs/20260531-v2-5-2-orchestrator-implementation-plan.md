# 20260531 v2.5.2 Implementation Plan (A-D)

## Context
- Branch: feature/v2.5.2
- Goal: deliver v2.5.2 as a patch release with limited regression risk.
- Workflow: implement and commit per ticket (A -> B -> C -> D).

## Task
Implement the following scope as four tickets.

- Ticket A: seek-point validation rules in media edit.
- Ticket B: seek timeline indicator MVP between preview and seek inputs.
- Ticket C: HTML player appearance adjustment for light/dark compatibility.
- Ticket D: focused validation and E2E coverage update.

## Constraints
- Keep v2.5.2 patch-sized. Avoid broad refactors.
- Preserve existing behavior unless requirement explicitly changes it.
- Use existing UI patterns (Flowbite/Tailwind) and existing i18n keys style.
- Commit per ticket. If cross-cutting edits are unavoidable, keep them in the earliest relevant ticket.

## Acceptance Criteria
- A: invalid seek relationships are rejected with clear validation errors.
- B: timeline MVP shows base line and seek markers with consistent mapping to seek fields.
- C: preview player area is readable in both light and dark mode.
- D: focused checks and E2E evidence are recorded; no known blocker remains.

## Deliverables
- Code changes in src/views/styles/assets files as listed per ticket.
- Test evidence in docs/operations/test-reports and docs/operations/testing as needed.
- Four commits (A-D), or fewer only if D is docs-only and merged into C by agreement.

## Ticket Breakdown

### Ticket A: Seek Validation
Objective:
- Enforce relation: 0 <= start <= fadeInEnd <= fadeOutStart < end <= duration.

Implementation scope:
- Update media edit validation logic in src/scripts/ambient.ts.
- Add/adjust validation messages in assets/langs/lang.json and assets/langs/lang-ja.json.
- Propagate to de/es/fr/it/ko/pt files with temporary fallback text if full translation is not in scope for this patch.

Design notes:
- Treat empty seek fields as unset if current behavior allows optional seek values.
- Run relation checks only when compared fields are present.
- Add duration upper-bound check only when preview duration is known.

Done definition:
- Save is blocked on invalid relation.
- Error message is attached to corresponding field group and toast/error summary as existing behavior dictates.

Commit message candidate:
- fix(media-edit): enforce seek relation validation and duration bounds

---

### Ticket B: Seek Timeline Indicator MVP
Objective:
- Add a horizontal timeline visualization between preview and seek inputs.

Implementation scope:
- Add timeline container markup in views/drawer-left.php near media preview/seek sections.
- Add minimal styles in styles/app.css or styles/ambient.scss (follow existing ownership).
- Add rendering/update logic in src/scripts/ambient.ts.

MVP behavior:
- Base line always visible (start/end anchors).
- Markers for start, fade-in end, fade-out start, end when values exist.
- Marker color mapping is fixed and reused in seek field labels.
- Display HH:MM:SS near marker with simple persistent label layout.

Out of scope for v2.5.2:
- Complex alternating tooltip choreography and heavy animation.
- Large component abstraction or new dependency introduction.

Done definition:
- Marker positions update on input and sync-button actions.
- Timeline remains readable on desktop and mobile widths.

Commit message candidate:
- feat(media-edit): add seek timeline MVP with mapped markers and timestamps

---

### Ticket C: HTML Player Theme Compatibility
Objective:
- Improve preview player visual compatibility in dark mode while preserving light mode.

Implementation scope:
- Adjust media preview wrapper/player surrounding styles in styles/ambient.scss (or app.css per current ownership).
- If necessary, add lightweight class hooks in views/drawer-left.php for themed preview container.

Scope decision:
- Include: contrast, background, border, helper text, control-area harmony.
- Exclude: full custom audio card player redesign.

Done definition:
- Local video/audio preview area has acceptable contrast in dark mode.
- No regression to light mode readability.

Commit message candidate:
- fix(media-preview): align HTML player preview styles for light and dark themes

---

### Ticket D: Validation and Evidence
Objective:
- Execute focused verification and capture evidence for v2.5.2 patch.

Validation scope:
- Manual/focused checks:
	- invalid seek relation blocks save.
	- valid relation passes save.
	- timeline markers update on typed values and sync actions.
	- dark mode preview readability.
- E2E updates:
	- add or extend one scenario for seek validation failure/success path.
	- add or extend one scenario for timeline marker visibility/update.

Deliverables:
- docs/operations/test-reports/202605xx-v2-5-2-validation-report.md
- docs/operations/testing/202605xx-v2-5-2-test-plan.md (if needed)

Commit message candidate:
- test(v2.5.2): add focused media-edit seek validation and timeline coverage

## Recommended Execution Order
1. Ticket A implementation and commit.
2. Ticket B implementation and commit.
3. Ticket C implementation and commit.
4. Ticket D validation, docs update, and commit.

## Risk Notes
- Highest risk is Ticket B layout/interaction side effects in media edit modal.
- To reduce risk, keep timeline MVP simple in v2.5.2 and defer rich animation to v2.6.0.
