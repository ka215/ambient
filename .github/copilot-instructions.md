# Ambient v2-dev Common Instructions

This project adopts AI-driven development with multi-agent orchestration.
These instructions apply to all coding tasks in this workspace.

## Priority

1. Follow user requirements and docs under docs/ first.
2. Preserve behavior of v1 unless a requirement explicitly changes it.
3. Keep changes minimal, traceable, and testable.

## Collaboration Rules

- Treat the orchestrator as the single conversation gateway with users.
- Always record handoff inputs and outputs in the paths defined in AGENTS.md.
- If requirements are ambiguous, produce assumptions explicitly before coding.
- Do not skip design notes for medium or large changes.

## Code Change Rules

- Read related files before editing.
- Avoid broad refactors unless requested.
- Keep naming and style aligned with existing code.
- Update docs when behavior, command, or operational flow changes.

## Testing and Validation

- Run relevant checks for changed scope.
- For UI-impacting changes, include manual verification points.
- For bug fixes, document reproduction steps and expected results.

## Safety and Scope

- Never commit secrets, private tokens, or machine-specific credentials.
- Do not modify unrelated files.
- Keep generated outputs in designated docs/ folders for auditability.

## Terminal & Process Management
- Use `jq` for parsing or manipulating JSON data, and `yq` for YAML data, rather than using generic text processing tools like `grep` or `awk`.
- Use `rg` (ripgrep) as the primary tool for search operations. Prefer `rg --files` for listing files.
- After completing any task in a terminal, always run the `exit` command to close the session.
- Do not leave background processes running after your work is done.
- On Windows, when using Git Bash (bash.exe), be aware that orphaned child processes may remain; always include a cleanup step for lingering processes at the end of a work sequence.

## Cleanup Rules
- After running multiple Git operations or build tasks in succession, consider cleaning up idle Git processes by running:
  `powershell.exe -Command "Get-Process | Where-Object { $_.Name -match 'git-remote-https|ssh-agent' } | Stop-Process -Force"`

## References

- Team workflow and role definitions: ../AGENTS.md
- Orchestration architecture: ../docs/architecture/agent-workflow-v2-dev.md
