# v2.5.4 GTM Prototype Orchestrator Handoff

Date: 2026-06-04
Topic: Phase B GTM / Analytics minimum prototype for cloud demo site

## Context

- Source requirement memo: .codex/tmp/20260601-v2-5-4-localization-and-gtm-idea.md
- Related references reviewed:
  - AGENTS.md
  - .codex/memo.md
  - docs/operations/handoffs/20260519-ambient-new-feature-development-handoff.md
  - .github/instructions/implementation.instructions.md
  - .github/instructions/test-debug.instructions.md
  - .github/instructions/orchestrator.instructions.md
- Existing extension points confirmed:
  - custom.php can inject head/footer assets via amp_add_head_content and amp_add_footer_script
  - functions.php exposes is_cloud()
  - window.AmbientData and window.$ambient provide enough runtime context for a custom.php-only prototype

## Objective

Implement the Phase B GTM sending minimum prototype for the cloud demo site with dataLayer.push and keep the change centered on custom.php.

## Constraints

- Demo site only
- Prefer custom.php only
- Avoid Ambient core modifications unless required
- Enable only in cloud mode
- Use anonymous minimal metadata only
- Keep existing custom.php QR/about/CSS behavior intact

## Acceptance Criteria

- GTM loader is injected only for cloud mode
- custom.php footer initializes dataLayer safely
- Minimum prototype emits page_view and useful interaction events without core TS edits if possible
- No PHP syntax errors in changed files
- Validation evidence is collected

## Deliverables Requested To Specialists

### Implementation handoff

- Implement a self-contained GTM/dataLayer prototype, preferably only in custom.php
- Include page_view and feasible interaction events for playlist, category, drawer, modal, media, and save/validation outcomes
- Use only anonymous metadata: env, lang, playlist/category context, media kind, screen band, touch flag
- Run php lint on changed files
- Report Result Summary, Changed Files, Validation Executed, Known Risks, implemented events, omissions

### Test/debug handoff

- Validate php lint
- Boot narrow PHP servers for local/cloud if feasible
- Fetch root HTML and verify GTM/custom footer script injection behavior
- Report exact commands, evidence, and gaps
- Leave no processes running

## Specialist Outputs Collected

### Implementation result

Result Summary:
- Implemented in custom.php only
- Cloud-only GTM head injection using GTM-PDSBP5PB
- Cloud-only footer analytics bootstrap using dataLayer.push
- Existing custom.php styling and About content preserved

Changed Files:
- custom.php

Validation Executed:
- php -l custom.php -> pass
- changed-file error check -> no errors

Known Risks:
- YouTube media events use button/app-state fallbacks for part of the prototype
- media_end and media_seek are only direct for HTML media
- validation_error relies on visible invalid UI and toast patterns

Implemented events:
- page_view
- playlist_select
- category_select
- drawer_open
- modal_open
- media_play
- media_pause
- media_end
- media_seek
- media_add_success
- media_edit_save_success
- validation_error

Notable omissions:
- YouTube runtime-native media_end
- YouTube runtime-native media_seek
- current media title in payload

### Test/debug result

Result Summary:
- php lint passed
- local/cloud built-in servers both returned HTTP 200
- cloud HTML contains expected GTM/custom script markers
- local HTML also contained them because this shell environment still resolved AMP_ENV as cloud

Validation Executed:
- php -l custom.php
- AMP_ENV=local php -S 127.0.0.1:8087 router.php
- AMP_ENV=cloud php -S 127.0.0.1:8088 router.php
- curl fetch of both root documents and marker inspection
- PHP environment probe showing amp_env('AMP_ENV') and getenv('AMP_ENV') both returned cloud in this shell session

Observed Evidence:
- custom.php contains cloud-gated injections only
- No fatal or parse error markers found in local/cloud HTML
- Runtime local-vs-cloud diff could not be proven in this shell because AMP_ENV=local was not honored at execution time

Known Gaps:
- Local-mode non-injection was not runtime-proven in this shell environment
- A follow-up validation from PowerShell or another clean shell is needed if strict local/cloud proof is required

## Orchestrator Assessment

The requested prototype is implemented and syntax-validated. The remaining issue is not the implementation itself but environment-specific validation drift: the provided Git Bash session resolves AMP_ENV to cloud even when local is prefixed on the command line, so runtime proof for the local-mode exclusion remains incomplete in this shell only.

## Next Recommended Action

1. If you want strict runtime proof of cloud-only gating, rerun the same local/cloud smoke in PowerShell or another clean shell where AMP_ENV=local is honored.
2. If you want the prototype extended, the next useful slice is to add native YouTube state tracking for media_end and media_seek without widening beyond custom.php if possible.
