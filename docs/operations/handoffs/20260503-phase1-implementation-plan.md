# Phase 1 Implementation Plan - TypeScript Migration & Playwright Setup

**Date:** 2026-05-03  
**Status:** Ready for Implementation  
**Duration:** 2-3 weeks (May 3 - May 17)

---

## Overview

Phase 1 executes the TypeScript migration of `ambient.js` and Playwright E2E setup as defined in `20260503-v2-architecture-comparison-design-spec.md` (Case A - Recommended).

### Goals
1. Port vanilla `ambient.js` → `ambient.ts` with full type safety
2. Establish Playwright test infrastructure with high-priority scenarios (SC-001 ~ SC-006)
3. Validate backward compatibility with existing views
4. Create reusable test patterns for Phase 2

---

## Milestone Breakdown

### M1: TypeScript Setup & Type Definitions (Week 1, Days 1-2)

#### Task 1.1: TypeScript Environment
- **What:** Create `tsconfig.json`, add dependencies, configure build
- **Input:** `package.json`
- **Output:**
  - `tsconfig.json` (target: ES2020, module: ESM, strict: true)
  - Updated `package.json` (typescript, @types/*, build-tools)
  - npm scripts: `ts-dev` (watch), `ts-build` (production)

#### Task 1.2: Type Definitions
- **What:** Define TypeScript interfaces for data and API contracts
- **Input:** 
  - `docs/architecture/v1-system-summary.md` (data structures)
  - `docs/features/uiux/v1-uiux-summary.md` (AMP_STATUS properties)
- **Output:**
  - `src/scripts/types/ambient.ts` (AmbientData, AMP_STATUS, PlaylistItem, Options interfaces)
  - `src/scripts/types/youtube.ts` (YT IFrame API types)

#### Task 1.3: Migrate ambient.js → ambient.ts
- **What:** Port all functions with full type coverage
- **Input:** `src/scripts/ambient.js`
- **Output:**
  - `src/scripts/ambient.ts` (fully typed, no `any`)
  - Preserve all functions: `initStatus()`, `watchState()`, `setupPlayer()`, etc.
  - Preserve event handlers and watcher behavior
- **Build:** `npm run ts-build` → `dist/ambient.js` (ES2020)

#### Acceptance Criteria (M1)
- ✅ `tsc --noEmit` exits 0 (zero errors)
- ✅ `dist/ambient.js` produced and valid
- ✅ All AMP_STATUS watcher tests pass (manual or unit)
- ✅ No breaking changes to function signatures

---

### M2: Playwright Setup & Test Infrastructure (Week 1-2, Days 2-7)

#### Task 2.1: Playwright Installation & Config
- **What:** Install Playwright, create playwright.config.ts
- **Output:**
  - `playwright.config.ts` (baseURL, testDir: tests/e2e, browser pool, timeout settings)
  - `tests/e2e/` directory structure
  - npm script: `npm run test:e2e` (run all), `npm run test:e2e:debug` (headed mode)
- **Dependency:** XAMPP Apache running on http://localhost/dev2.ka2.org/amp/

#### Task 2.2: Test Utilities & Fixtures
- **What:** Build common test helpers and Playwright fixtures
- **Output:**
  - `tests/e2e/fixtures/ambient-page.fixture.ts` (page + AMP_STATUS access)
  - `tests/e2e/utils/assertions.ts` (custom matchers for player state)
  - `tests/e2e/utils/data-helpers.ts` (fixture data loaders)

#### Task 2.3: Implement High-Priority E2E Scenarios (SC-001 ~ SC-006)
- **What:** Write 6 high-priority scenarios as Playwright tests
- **Output:** `tests/e2e/scenarios/`
  - SC-001: Player initialization on page load
  - SC-002: Play/pause state toggle
  - SC-003: Playlist navigation (next/prev)
  - SC-004: Volume control (fader)
  - SC-005: Shuffle toggle
  - SC-006: YouTube IFrame embed on track selection
- **Pattern:** AAA (Arrange-Act-Assert) per SKILL.md

#### Acceptance Criteria (M2)
- ✅ `npm run test:e2e` runs all 6 scenarios
- ✅ All 6 scenarios pass consistently (3 runs with 0 flakes)
- ✅ Test report generated: `docs/operations/test-reports/20260503-phase1-m2-e2e-baseline.md`

---

### M3: Verification & Integration (Week 2-3, Days 8-10)

#### Task 3.1: Cross-Browser Verification
- **What:** Run tests on Chrome + Firefox + Safari
- **Output:** Browser compatibility matrix report

#### Task 3.2: Views Integration Test
- **What:** Verify TypeScript-compiled ambient.js works in existing views/layout.php
- **Output:** Manual test report with screenshot evidence

#### Task 3.3: Performance Baseline
- **What:** Record JS bundle size before/after TS migration
- **Output:** docs/operations/test-reports/20260503-phase1-bundle-analysis.md

#### Task 3.4: Phase 1 Completion Report
- **What:** Aggregate all test results, known issues, next steps
- **Output:** docs/operations/test-reports/20260503-phase1-completion-report.md

---

## Technical Architecture

### Build Pipeline (Phase 1)
```
src/scripts/ambient.js
    ↓ (RETIRED after migration)
src/scripts/ambient.ts
    ↓ tsc (tsconfig.json)
dist/ambient.js (ES2020, bundled)
    ↓
views/layout.php
    ↓ <script src="/dist/ambient.js"></script>
Browser (loads AMP_STATUS watchers)
```

### Directory Structure (New)
```
src/
  scripts/
    ambient.ts          ← Main app logic (ported from .js)
    types/
      ambient.ts        ← AmbientData, AMP_STATUS interfaces
      youtube.ts        ← YT IFrame API types
tests/
  e2e/
    scenarios/
      sc-001-init.spec.ts
      sc-002-play-pause.spec.ts
      sc-003-navigation.spec.ts
      sc-004-fader.spec.ts
      sc-005-shuffle.spec.ts
      sc-006-youtube-embed.spec.ts
    fixtures/
      ambient-page.fixture.ts
    utils/
      assertions.ts
      data-helpers.ts
playwright.config.ts
tsconfig.json
```

### Dependencies to Add
```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/youtube": "^2.x",
    "ts-node": "^10.x",
    "@playwright/test": "^1.x",
    "playwright": "^1.x"
  }
}
```

---

## Handoff Template (M1 → Implementation Agent)

**Objective:** Migrate `ambient.js` to TypeScript with strict typing and build integration.

**Constraints:**
- Preserve all existing function behavior (no refactoring)
- No changes to `views/layout.php` or PHP code
- Output must load as `<script src="/dist/ambient.js"></script>`

**Acceptance Criteria:**
1. `tsc --noEmit` passes with 0 errors
2. `dist/ambient.js` is valid ES2020 and executable
3. All AMP_STATUS watchers work as before
4. `npm run ts-build` and `npm run ts-dev` scripts exist and work

**Deliverables:**
- `tsconfig.json`
- `src/scripts/ambient.ts` (100% typed, no `any`)
- `src/scripts/types/` (interface definitions)
- Updated `package.json`
- Verification report: build log + manual test results

---

## Handoff Template (M2 → Test/Debug Agent)

**Objective:** Establish Playwright infrastructure and implement 6 high-priority E2E scenarios.

**Constraints:**
- Use Playwright (@playwright/test), not other frameworks
- Tests run against http://localhost/dev2.ka2.org/amp/ (local XAMPP)
- Use `tests/e2e/` directory structure
- Follow AAA pattern (see playwright-e2e-debug SKILL.md)

**Acceptance Criteria:**
1. `npm run test:e2e` executes all 6 scenarios
2. All 6 scenarios pass consistently (3 consecutive runs, 0 flakes)
3. Test report generated: `docs/operations/test-reports/20260503-phase1-m2-e2e-baseline.md`

**Deliverables:**
- `playwright.config.ts`
- `tests/e2e/scenarios/*.spec.ts` (SC-001 ~ SC-006)
- `tests/e2e/fixtures/` and `tests/e2e/utils/`
- E2E baseline test report with evidence

---

## Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript strict mode blocks port | Medium | High | Allocate extra time to types; use `// @ts-ignore` sparingly with comments |
| Watcher behavior changes after TS port | Medium | High | Unit test each watcher before E2E; compare console output |
| Playwright flakiness (YouTube API timing) | High | Medium | Add explicit waits for YT frame load; use retry config |
| Build output size increases | Low | Low | Monitor with webpack-bundle-analyzer |

---

## Success Metrics

- [ ] Phase 1 timebox: 2-3 weeks (end by 2026-05-17)
- [ ] Zero "Must Fix" issues in review
- [ ] E2E test pass rate: ≥95% (5 of 6 scenarios stable)
- [ ] Code coverage: ≥70% (TypeScript files)
- [ ] Bundle size delta: <10% increase

---

## Next Steps

**After Phase 1 completion:**
1. Code review (Review Agent) → resolve Must Fix items
2. Decide Phase 2 start (Nuxt3 frontend OR PHP API standardization)
3. Plan Phase 2 work

---

## References

- Design Spec: docs/architecture/design/20260503-v2-architecture-comparison-design-spec.md
- v1 System Summary: docs/architecture/v1-system-summary.md
- v1 UX Summary: docs/features/uiux/v1-uiux-summary.md
- Playwright Skill: .github/skills/playwright-e2e-debug/SKILL.md
- Implementation Instructions: .github/instructions/implementation.instructions.md
