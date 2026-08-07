---
name: ambient-doc-workflow
description: Promote Ambient project requirement memos into canonical English docs and Japanese companion docs. Use when Codex is asked to process `.codex/memo.md`, update requirements, designs, handoffs, backlog, or documentation inventory for Ambient releases.
---

# Ambient Doc Workflow

Use this workflow to turn the user's Japanese working memo into project-managed documentation.

Core rules:

- Treat `docs/` English documents as canonical.
- Treat `.codex/memo.md` as input scratch, not a source of truth.
- Put Japanese reader-friendly companion documents under `.codex/tmp/ja-docs/`.
- Keep Japanese companion documents untracked.
- If English canonical docs and Japanese companion docs conflict, the English canonical docs win.
- Do not reset or delete `.codex/memo.md` unless the user explicitly asks or has approved that step.

## Workflow

1. Read `.codex/memo.md` and identify the target version or scope.
2. Classify each item as `current`, `backlog`, `archive`, or `needs-clarification`.
3. Read `references/doc-routing.md` before creating or updating files.
4. Read `references/templates.md` before drafting new documents.
5. Create or update canonical English docs under `docs/`.
6. Create matching Japanese companion docs under `.codex/tmp/ja-docs/` when requested or useful.
7. Update the live backlog when memo items should survive beyond the current task.
8. Create a dated inventory/handoff log for the memo processing run.
9. Report changed files, validation, and open risks.

## Classification

- `current`: target-version work that should become requirements, design, implementation plan, or handoff docs.
- `backlog`: future-version or undefined work that should be tracked for later planning.
- `archive`: already released, rejected, or historical content with no active planning value.
- `needs-clarification`: ambiguous content that would be risky to promote without user confirmation.

## Validation

Before finishing:

- Run `git status --short --ignored .codex docs .gitignore` when Git visibility changed.
- Confirm `.codex/memo.md` remains ignored unless the user explicitly changed that policy.
- Confirm Japanese companion docs are ignored.
- Confirm canonical English docs are visible to Git.
