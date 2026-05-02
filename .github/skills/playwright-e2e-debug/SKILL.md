---
name: playwright-e2e-debug
description: "Create and execute Playwright E2E scenarios, reproduce UI bugs, and produce test/debug reports for Ambient v2-dev. Use when validating frontend behavior or debugging regressions."
argument-hint: "Target feature, scenario scope, and expected behavior"
user-invocable: true
---

# Playwright E2E and Debug Workflow

## When to Use
- UI behavior verification is required.
- Regression checks are needed after implementation.
- A bug requires reproducible browser steps.

## Procedure
1. Confirm scenario target and acceptance criteria.
2. Write or update E2E spec from [spec skeleton](./assets/spec-skeleton.ts).
3. Execute the scenario and capture pass/fail evidence.
4. If failed, document reproduction in [bug report template](./assets/bug-report-template.md).
5. Produce execution summary using [test report template](./assets/e2e-test-report-template.md).

## Deliverables
- E2E spec file under tests/e2e/
- Test execution report under docs/operations/test-reports/
- Bug report artifact under docs/operations/testing/ when failures exist

## Validation Notes
- Include environment assumptions (browser, data, feature flags).
- Distinguish observed behavior from suspected root cause.
