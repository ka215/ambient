# Phase 1 Bundle Analysis (M3 Task 3.3)

**Date:** 2026-05-04  
**Scope:** TypeScript migration output size comparison for Ambient player script

---

## 1. Measurement Method

Measured file size after TypeScript build (`npm run ts-build`) using:

- `wc -c src/scripts/ambient.js dist/scripts/ambient.js`
- `ls -lh src/scripts/ambient.js dist/scripts/ambient.js`

---

## 2. Size Comparison

| Target | Bytes | Approx |
|---|---:|---:|
| `src/scripts/ambient.js` (legacy JS source) | 124,289 | 122K |
| `dist/scripts/ambient.js` (TS compiled output) | 91,090 | 89K |
| Delta | -33,199 | -33K |
| Reduction Rate | -26.71% | — |

Calculation:

- Reduction rate = $(124289 - 91090) / 124289 \times 100 \approx 26.71\%$

---

## 3. Technical Notes

- `dist/scripts/ambient.js` is now emitted without ES module `export` syntax, so it can be loaded by a normal script tag in PHP output.
- Type declarations and maps are generated under `dist/scripts/` and `dist/scripts/types/` for development support; runtime script path remains `dist/scripts/ambient.js`.

---

## 4. Validation Snapshot

- Type check: `npx tsc --noEmit` => exit 0
- Build: `npm run ts-build` => success
- Runtime integration verification: see [docs/operations/test-reports/20260503-phase1-completion-report.md](20260503-phase1-completion-report.md)
