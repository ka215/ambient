# 20260527 v2.5.1 Start Handoff

Date: 2026-05-27  
Target branch: `dev` / next `v2.5.1` iteration  
Target agent: `orchestrator`

## Objective

Capture the current v2.5.0 implementation status and list the next unstarted candidates so the next chat can begin v2.5.1 without re-triaging the whole history.

## Context

- v2.5.0 media-edit work has been implemented and released.
- Localization cleanup for the media-edit UI has been completed.
- The current repo state should be treated as a fresh starting point for v2.5.1 follow-up work.

## Unstarted Candidates

- View Transitions API / UI motion system for v2.6.0-style motion polish.
- GitHub REST API UI for Star / Watch toggles from the About Ambient section.
- Playlist `options.label` support so playlist names can be displayed with friendly labels instead of raw JSON file names.
- Any further media-edit polish should be treated as a separate follow-up only if a new issue is confirmed.

## Notes for the Next Chat

- Start from the confirmed release state rather than redoing v2.5.0 implementation work.
- Check `.codex/memo.md` and `docs/operations/handoffs/20260519-ambient-new-feature-development-handoff.md` first if a new task needs broader context.
- Avoid accidentally including `views/images/ambient-loading-*.svg` unless that file family is explicitly in scope.

## Deliverables

- This handoff note under `docs/operations/handoffs/`.
- A short bullet list of next-step candidates for v2.5.1.
