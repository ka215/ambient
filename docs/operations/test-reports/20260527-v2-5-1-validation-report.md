# v2.5.1 Validation Report (2026-05-27)

## Result Summary
- v2.5.1 validation was executed for the requested requirement set.
- Overall result: FAIL.
- Blocking failure: the application returns HTTP 500 before the UI boots in both local-mode and cloud-mode verification environments.
- Verified by static/file checks:
  - Requirement 1 `de/es/fr/it/ko/pt` translation files exist under `assets/langs/` and have zero missing keys relative to `assets/langs/lang-ja.json`.
  - Requirement 2 legacy translation files under `assets/` remain present and byte-identical to the new `assets/langs/` copies.
  - Requirement 3 loader replacement is implemented in markup/CSS: `ambient-loading-type1.svg` is referenced by the boot splash, and the splash is centered with full-viewport fixed layout.
- Not executable due to the boot blocker:
  - Requirement 4 local media add with immediate JSON persistence.
  - Cloud read-only regression verification for non-MyPlaylist JSON playlists.
  - Runtime confirmation that the loader SVG is visible on first paint.

## Requirement Status
| Requirement | Status | Basis |
|---|---|---|
| 1) de/es/fr/it/ko/pt 翻訳追加 | Partial Pass | Files exist and have no missing keys vs JA baseline; app boot blocker prevented runtime language switching validation |
| 2) assets/langs への移設 + 後方互換 | Partial Pass | `assets/langs/` files exist and legacy `assets/lang*.json` files remain byte-identical; app boot blocker prevented runtime load-path verification |
| 3) ローディング表示を ambient-loading-type1.svg 中央表示へ差し替え | Partial Pass | DOM/CSS implementation confirmed in source; runtime first-paint confirmation blocked by HTTP 500 |
| 4) local 環境でメディア追加可能 + 追加時即時JSON保存 | Fail (Blocked) | Could not execute because the app crashes during translation loading before UI boot |

## Validation Executed
1. `node -e 'const fs=require("fs");const base=JSON.parse(fs.readFileSync("assets/langs/lang-ja.json","utf8"));const targets=["de","es","fr","it","ko","pt"];for(const t of targets){const p=`assets/langs/lang-${t}.json`;const data=JSON.parse(fs.readFileSync(p,"utf8"));const missing=Object.keys(base).filter(k=>!Object.prototype.hasOwnProperty.call(data,k));const extra=Object.keys(data).filter(k=>!Object.prototype.hasOwnProperty.call(base,k));console.log(`${t} missing=${missing.length} extra=${extra.length}`);if(missing.length){console.log(missing.join(","));}}'`
- Result: PASS
- Evidence:
  - `de missing=0 extra=4`
  - `es missing=0 extra=4`
  - `fr missing=0 extra=4`
  - `it missing=0 extra=4`
  - `ko missing=0 extra=4`
  - `pt missing=0 extra=4`

2. `node -e 'const fs=require("fs");const crypto=require("crypto");const langs=["","-de","-es","-fr","-it","-ja","-ko","-pt"];for(const s of langs){const a=`assets/lang${s}.json`;const b=`assets/langs/lang${s}.json`;const ha=crypto.createHash("sha1").update(fs.readFileSync(a)).digest("hex");const hb=crypto.createHash("sha1").update(fs.readFileSync(b)).digest("hex");console.log(`${a} ${ha===hb?"SAME":"DIFF"}`);}'`
- Result: PASS
- Evidence:
  - `assets/lang.json SAME`
  - `assets/lang-de.json SAME`
  - `assets/lang-es.json SAME`
  - `assets/lang-fr.json SAME`
  - `assets/lang-it.json SAME`
  - `assets/lang-ja.json SAME`
  - `assets/lang-ko.json SAME`
  - `assets/lang-pt.json SAME`

3. `AMP_ENV=local php -S 127.0.0.1:8087 router.php`
- Result: FAIL
- Evidence: request to `http://127.0.0.1:8087/` returned HTTP 500.

4. `AMP_ENV=cloud php -S 127.0.0.1:8088 router.php`
- Result: FAIL
- Evidence: request to `http://127.0.0.1:8088/` returned HTTP 500.

5. Server log inspection for both PHP built-in servers
- Result: FAIL
- Evidence:
  - `PHP Fatal error: Uncaught TypeError: array_key_exists(): Argument #2 ($array) must be of type array, null given in C:\xampp\htdocs\dev2.ka2.org\amp\src\utils.php:57`
  - Common stack head:
    - `Magicmethods\Ambient->{closure:Magicmethods\utils::load_translation_data():47}()`
    - `Magicmethods\Ambient->load_translation_data()`
    - `Magicmethods\Ambient->setup()`

## Scenarios Executed
1. Translation file completeness check for `assets/langs/lang-{de,es,fr,it,ko,pt}.json` against `assets/langs/lang-ja.json`.
2. Backward-compatibility parity check between legacy `assets/lang*.json` and migrated `assets/langs/lang*.json`.
3. Local-mode app boot smoke check with `AMP_ENV=local`.
4. Cloud-mode app boot smoke check with `AMP_ENV=cloud`.
5. Source-level verification of loader DOM and CSS implementation.

## Failures and Reproduction Steps
### F-1. Application boot fails in both local and cloud modes
- Observation:
  - Both local and cloud verification servers returned HTTP 500 on the first request.
  - The fatal error occurred before page render, so no Playwright UI scenario could start.
- Reproduction steps:
  1. In the repository root, run `AMP_ENV=local php -S 127.0.0.1:8087 router.php`.
  2. Open `http://127.0.0.1:8087/`.
  3. Observe HTTP 500 and the fatal error in the server log.
  4. Repeat with `AMP_ENV=cloud php -S 127.0.0.1:8088 router.php` and `http://127.0.0.1:8088/`.
- Expected:
  - App boots and renders the loading splash, allowing UI validation to proceed.
- Actual:
  - Boot stops in `load_translation_data()` before the initial HTML response completes.

## Root Cause Notes
- Observed fact:
  - `load_translation_data()` calls `array_key_exists( $_key, $this->languages )` while `$this->languages` is still `null`.
  - The failure is triggered as soon as translation files under `assets/langs/` or `assets/` are enumerated.
- Hypothesis:
  - The v2.5.1 translation migration introduced a code path that assumes `$this->languages` is already initialized to an array, but `Ambient::$languages` is only declared and not assigned a default array value.
  - Because this happens during early bootstrap, every runtime validation target downstream of boot is blocked.

## Source Evidence
- Loader markup uses the requested SVG in [views/layout.php](views/layout.php#L10).
- Boot splash centering/full-screen CSS is defined in [functions.php](functions.php#L235).
- Translation loading priority and the failing `array_key_exists` call are in [src/utils.php](src/utils.php#L32).
- `languages` is declared but not initialized in [src/Ambient.php](src/Ambient.php#L14).

## Suggested Fix Direction
1. Initialize `Ambient::$languages` to an empty array before `load_translation_data()` iterates translation files.
2. Add a boot smoke test covering both `AMP_ENV=local` and `AMP_ENV=cloud` so translation-loading regressions fail before UI validation.
3. After the boot blocker is fixed, rerun focused validation for:
   - local media add -> `playlist-save` request -> target JSON file content updated immediately.
   - cloud non-MyPlaylist read-only behavior.
   - first-paint loader visibility and centered SVG rendering.

## Known Risks
- Current v2.5.1 state is not runtime-usable in either local or cloud mode because bootstrap fails before the app renders.
- Translation completeness does not prove runtime i18n correctness while boot is broken.
- Loader implementation is only statically verified in this run; actual first-paint visibility remains unconfirmed.
- Requirement 4 remains unverified end-to-end until the boot blocker is resolved.

## Next Recommended Action
1. Fix the translation bootstrap null-array regression in `load_translation_data()`.
2. Rerun a focused validation bundle immediately after the fix:
   - local boot smoke
   - cloud boot smoke
   - local add-media immediate JSON persistence
   - cloud read-only regression
   - loader first-paint check