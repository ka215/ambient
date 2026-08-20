# Ambient Documentation Routing

Use these routing rules when promoting `.codex/memo.md` content.

## Canonical Documents

All canonical project documentation lives under `docs/` and must be written in English.

Recommended paths:

- Requirements and future feature requests: `docs/features/requests/`
- Technical design: `docs/architecture/design/`
- UI/UX specifications: `docs/features/uiux/`
- Handoffs and implementation plans: `docs/operations/handoffs/`
- Test plans and scenarios: `docs/operations/testing/`
- Test reports: `docs/operations/test-reports/`
- Reviews: `docs/operations/reviews/`

## Japanese Companion Documents

Japanese reader-friendly companion documents live under:

```text
.codex/tmp/ja-docs/
```

Rules:

- Do not track these files in Git.
- Add `-ja` before `.md`.
- Include a canonical source pointer at the top.
- State that English canonical docs win on conflict.
- Do not load these files for ordinary implementation work unless the user explicitly asks for Japanese companion content.

Example:

```text
.codex/tmp/ja-docs/20260807-v2-6-5-local-media-url-resolver-design-ja.md
```

## Backlog And Inventory

Use the backlog as a living document:

```text
docs/features/requests/20260807-requirement-memo-backlog.md
```

Use inventory files as dated logs:

```text
docs/operations/handoffs/YYYYMMDD-codex-memo-inventory.md
```

Do not append every historical release note into backlog. Promote only active, future, partially done, or unresolved items.

## Memo Handling

`.codex/memo.md` is scratch input.

Allowed actions:

- Read and classify it.
- Extract current/future/carryover content into canonical docs.
- Reset it to the memo template only when the user approves.

Avoid:

- Tracking `.codex/memo.md`.
- Treating it as canonical after promotion.
- Copying already released sections wholesale into docs.
