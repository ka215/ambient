# 20260527 v2.5.1 Boot Failure Bug Report

## Summary
- Severity: Must Fix
- Scope: all runtime environments checked in this validation cycle
- Symptom: the application returns HTTP 500 before the first page render in both local and cloud mode.

## Environment
- Repository: `c:/xampp/htdocs/dev2.ka2.org/amp`
- PHP: `8.4.2` (built-in server)
- Modes reproduced: `AMP_ENV=local`, `AMP_ENV=cloud`

## Reproduction Steps
1. Start the app with `AMP_ENV=local php -S 127.0.0.1:8087 router.php`.
2. Request `http://127.0.0.1:8087/`.
3. Observe HTTP 500 and inspect the server log.
4. Start the app with `AMP_ENV=cloud php -S 127.0.0.1:8088 router.php`.
5. Request `http://127.0.0.1:8088/`.
6. Observe the same HTTP 500 and the same fatal error.

## Observed Result
- Fatal error:
  - `Uncaught TypeError: array_key_exists(): Argument #2 ($array) must be of type array, null given in C:\xampp\htdocs\dev2.ka2.org\amp\src\utils.php:57`
- Stack head:
  - `Magicmethods\Ambient->{closure:Magicmethods\utils::load_translation_data():47}()`
  - `Magicmethods\Ambient->load_translation_data()`
  - `Magicmethods\Ambient->setup()`

## Expected Result
- The app should complete bootstrap, render the loading splash, and expose the normal UI for subsequent validation.

## Root Cause Notes
- Observation:
  - `Ambient::$languages` is declared but not initialized before `load_translation_data()` checks it with `array_key_exists`.
- Hypothesis:
  - The translation migration to `assets/langs/` added a priority check that assumes `$this->languages` is already an array.

## Suggested Fix Direction
1. Initialize `$this->languages` to `[]` before translation enumeration begins.
2. Add a narrow bootstrap smoke check that requests `/` in both `AMP_ENV=local` and `AMP_ENV=cloud`.

## Evidence References
- Failing translation load path: [src/utils.php](src/utils.php#L32)
- Uninitialized property declaration: [src/Ambient.php](src/Ambient.php#L14)
- Loader markup that should appear after successful boot: [views/layout.php](views/layout.php#L10)