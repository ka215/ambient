# 20260527 v2.5.1 Test-Debug Handoff

## Handoff Input
- Context: implemented v2.5.1 changes for translation migration, loader replacement, and local/cloud playlist behavior needed requirement validation.
- Task: validate the following requirements against current repository state.
  - de/es/fr/it/ko/pt translation addition
  - migration to `assets/langs` with backward compatibility
  - loading indicator replacement with centered `ambient-loading-type1.svg`
  - local media add with immediate JSON persistence
- Constraints:
  - prefer existing E2E where possible
  - separate facts from hypotheses
  - include pass/fail per requirement
- Acceptance Criteria:
  - provide requirement-level pass/fail
  - include executed commands and results
  - include reproduction and fix direction for failures

## Specialist Output (test-debug-agent)
### Result Summary
- Validation completed for the requested scope.
- Overall result is FAIL due to a runtime boot blocker.
- Static checks passed for translation-file presence/completeness, backward-compatible file parity, and loader implementation in source.
- Runtime UI checks for local add/save, cloud read-only behavior, and first-paint loader visibility could not execute because the app crashes during translation loading.

### Validation Executed
1. Translation completeness check for `assets/langs/lang-{de,es,fr,it,ko,pt}.json` against `assets/langs/lang-ja.json` -> pass (`missing=0` for all targets)
2. Legacy/new translation parity check for `assets/lang*.json` vs `assets/langs/lang*.json` -> pass (`SAME` for all eight files)
3. Local boot smoke with `AMP_ENV=local php -S 127.0.0.1:8087 router.php` -> fail (HTTP 500)
4. Cloud boot smoke with `AMP_ENV=cloud php -S 127.0.0.1:8088 router.php` -> fail (HTTP 500)
5. Source verification for loader DOM/CSS -> pass in code review scope

### Failures and Reproduction Steps
- Boot fails in both local and cloud mode.
- Reproduction:
  1. Start PHP built-in server with `AMP_ENV=local` or `AMP_ENV=cloud`.
  2. Request `/`.
  3. Observe HTTP 500.
  4. Inspect log for `array_key_exists(): Argument #2 ($array) must be of type array, null given` in `src/utils.php:57`.

### Root Cause Notes
- Fact: `load_translation_data()` uses `array_key_exists()` against `$this->languages` before it has been initialized to an array.
- Hypothesis: v2.5.1 translation migration added a priority-preserving branch that assumes the property is already initialized.

### Suggested Fix Direction
1. Initialize the translation container before iteration.
2. Add a bootstrap smoke test for both `AMP_ENV=local` and `AMP_ENV=cloud`.
3. Rerun focused runtime validation after the fix.

### Changed Files
- `docs/operations/test-reports/20260527-v2-5-1-validation-report.md`
- `docs/operations/testing/20260527-v2-5-1-boot-failure-bug-report.md`
- `docs/operations/handoffs/20260527-v2-5-1-test-debug-handoff.md`

### Known Risks
- Current build cannot be validated end-to-end because runtime bootstrap fails before the UI renders.
- Requirement 4 remains unverified until the bootstrap failure is fixed.

## Next Recommended Action
- Hand off the bootstrap failure as a Must Fix implementation issue, then rerun the v2.5.1 focused validation bundle.