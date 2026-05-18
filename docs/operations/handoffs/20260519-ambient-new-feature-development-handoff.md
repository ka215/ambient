# Ambient New Feature Development Handoff

Date: 2026-05-19  
Current baseline: `v2.3.4` / `dev` synced with `main`  
Purpose: summarize release history, current architecture notes, future work, known concerns, validation commands, and efficient working procedures for the next development session.

## 1. Current Repository State

- Latest released version: `v2.3.4`
- Latest tag: `v2.3.4`
- `dev`, `main`, `origin/dev`, and `origin/main` were aligned at the v2.3.4 merge commit when this handoff was prepared.
- Recent release flow has been:
  - feature branch from `dev`
  - merge feature into `dev`
  - `npm run release:start -- X.Y.Z`
  - release branch PR to `main`
  - merge PR
  - `npm run release:finish -- X.Y.Z`
  - create GitHub Release using concise English notes

## 2. Release History Summary

### v2.0.0 - v2.1.x

- Migrated major frontend work toward the current TypeScript-based application.
- Added cloud/local environment split via `AMP_ENV=cloud/local`.
- Introduced cloud-mode MyPlaylist behavior backed by `localStorage`.
- Added direct media registration from the playlist drawer.
- Improved option modal media registration flow.
- Added initial iPhone/iPad bottom menu viewport mitigation.

### v2.2.0

- Added MyPlaylist delete mode and reorder mode for cloud localStorage playlists.
- Introduced playlist mode dropdown behavior.
- Added SortableJS-based reorder handling.
- Stabilized modal/backdrop behavior and toast visibility.
- Added focused E2E coverage for playlist mode behavior.

### v2.2.1

- Patch-up after review.
- Improved playlist/category handling, range UI, mobile viewport handling, and release automation.
- Added `scripts/release-start.ps1` and `scripts/release-finish.ps1`.

### v2.2.2

- Fixed local media playback path resolution.
- Added media playback issue reporting via logs/toasts.
- Fixed `options.playlist` custom template issues for MyPlaylist.
- Hardened timers around seek/fader behavior.
- Improved full-window video sizing and bottom band behavior.

### v2.2.3 - v2.2.4

- Expanded localization support.
- Added custom asset/content hooks.
- Hardened `AmbientData` output and `.env`/direct PHP access handling.
- Added `error.html`, `.htaccess`, and nginx sample error handling.

### v2.3.0

- Introduced Vite as the development/build asset pipeline.
- Consolidated TypeScript, SCSS, TailwindCSS, and Flowbite handling into the Vite build.
- Production assets now resolve through `dist/manifest.json` and `dist/assets/*`.
- Removed legacy `views/css/ambient.css` dependency later in the v2.3 line.
- Important docs:
  - `docs/architecture/design/20260510-v2-3-0-vite-asset-pipeline-design-spec.md`
  - `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md`
  - `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook-ja.md`

### v2.3.1

- Added default playlist item UI for title, artist, and description icon.
- Added description modal for media item `desc`.
- Hardened media metadata length/sanitization:
  - title: 100
  - artist: 100
  - desc: 500
- Disabled unsafe `options.playlist` usage for localStorage MyPlaylist.
- Started broader inline SVG cleanup.

### v2.3.2

- Extended `AmbientUserData.playlistContext` to resume current playlist and category.
- Added GitHub Issue template and changed the report link to GitHub issue creation.
- Continued inline SVG externalization and UI icon cleanup.
- Important docs:
  - `docs/architecture/design/20260515-v2-3-2-player-context-and-ui-maintenance-design.md`

### v2.3.3

- Removed `views/css/ambient.css` fallback.
- Completed broad inline SVG externalization into mask/icon assets.
- Updated carousel caption marquee to title + artist.
- Refined full-window bottom band:
  - YouTube icon-only button on the left
  - menu restore button on the right
  - centered marquee under drawers when minimized
- Added `custom.php` hook for About Ambient custom content.
- Added dark-mode placeholder SVG variants.

### v2.3.4

- Extended resume behavior to current media item:
  - `AmbientUserData.playlistContext.media`
  - no autoplay on resume
  - fallback to playlist/category, then current-view first media
- Added toast slide/fade animation with `prefers-reduced-motion` support.
- Added future View Transitions API / UI motion design docs:
  - `docs/architecture/design/20260517-v2-3-4-current-media-resume-and-motion-design.md`
  - `docs/architecture/design/20260517-v2-3-4-current-media-resume-and-motion-design-ja.md`
- Fixed cloud JSON playlist read-only handling:
  - media/category creation fields are disabled for non-MyPlaylist JSON playlists in cloud mode
  - validation watchers and click handlers also guard against mutation
- Localized playback error notices:
  - added `Playlist not found. Please create a new playlist.`
  - added `Media could not be loaded: `
  - fixed `set_localize_script()` Unicode handling by using `JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES`

## 3. Architecture Notes

### Asset Pipeline

- Source assets:
  - `src/scripts/ambient.ts`
  - `src/scripts/types/*.ts`
  - `src/styles/app.css`
  - `src/styles/ambient.scss`
  - `src/styles/tailwindcss.css`
- Production assets:
  - `dist/assets/ambient.js`
  - `dist/assets/ambient.css`
  - `dist/manifest.json`
- `views/css/ambient.css` has been removed as a legacy fallback.
- Use `npm run build` after changing TS/SCSS/CSS that affects production output.

### Vite Development

- Local Vite dev server commonly runs on `127.0.0.1:5174`.
- Apache reverse proxy is used under local HTTPS:
  - app URL: `https://dev-amp.ka2.org/`
  - Vite proxy paths include `/vite/`, `/@vite/`, and `/src/`
- Known issue: Apache WebSocket proxy for Vite HMR can be unstable. This is not currently high priority if normal page reload and asset serving work.
- When E2E seems to run old code, check whether Vite dev server is stale:
  - `netstat -ano | Select-String ':5174'`
  - restart Vite if `/vite/src/scripts/ambient.ts` does not contain current changes.

### Playlist Storage

- Cloud mode:
  - MyPlaylist is stored in localStorage under `AmbientMyPlaylist`.
  - User/player state is stored under `AmbientUserData`.
  - Existing JSON playlists are read-only in cloud mode.
- Local mode:
  - JSON playlists live under `assets/`.
  - Write-back/import behavior is planned but not fully implemented.

### Resume State

- `AmbientUserData.playlistContext` currently stores:
  - `playlist`
  - `category`
  - optional `media`
- Media resume matching uses:
  - `amId` as fast path
  - `videoid`
  - `file`
  - `title + artist`
- Resume selects the item but does not auto-play.

### Localization

- Base key file: `assets/lang.json`
- Language files:
  - `assets/lang-ja.json`
  - `assets/lang-de.json`
  - `assets/lang-es.json`
  - `assets/lang-fr.json`
  - `assets/lang-it.json`
  - `assets/lang-ko.json`
  - `assets/lang-pt.json`
- For PHP-rendered text, use `__( 'message key' )`.
- For frontend-only messages, prefer passing translated strings through `AmbientData.messages`.
- Avoid `stripslashes(json_encode(...))`; it breaks Unicode escape sequences.

## 4. Known Concerns And Traps

- Do not reintroduce `views/css/ambient.css`.
- `custom.php` is runtime-local and remains Git-ignored. Track `custom.example.php` only.
- MyPlaylist must not persist unsafe/custom `options.playlist`.
- Cloud JSON playlists must remain read-only.
- When editing management forms, remember that validation watchers can re-enable buttons unless guarded.
- Do not assume `amId` is stable across playlist reorder/import; use source/title matching where persistence matters.
- E2E with Vite dev server can accidentally test stale code if the server was started from an old state.
- Some Playwright runs may need normal/elevated environment because of Windows file locks, video cleanup, or fnm symlink permission issues.
- iPhone/iPad viewport behavior has been improved but should remain a regression watch area.
- The Apache Vite HMR WebSocket instability is intentionally deferred.

## 5. Future Roadmap

### v2.4.0 Candidate

Playlist import feature.

Planned behavior:

- Cloud mode:
  - import a playlist JSON file
  - validate against the playlist schema
  - sanitize/normalize data
  - overwrite or create localStorage `AmbientMyPlaylist`
  - consider browser/device storage size limits
- Local mode:
  - import playlist JSON into `assets/`
  - validate and sanitize before placement
- Error handling:
  - use toast errors for invalid schema, unsafe data, size limit, or write failure

Related research:

- Whether cloud MyPlaylist should eventually move from localStorage to IndexedDB or another Web Storage API.

### v2.5.0 Candidate

Media item edit feature for cloud MyPlaylist.

Notes:

- Playlist mode menu already has a disabled/preserved edit entry.
- Likely UI: dedicated full-screen modal without backdrop.
- Should reuse media metadata validation/sanitization rules from v2.3.1.
- Must avoid mutating cloud JSON playlists.

### v2.6.0 Or Later Candidate

UI motion / View Transitions API implementation.

Current design only exists in v2.3.4 docs.

Candidate targets:

- reload/language-switch crossfade
- modal open/close motion
- option modal accordion choreography
- carousel transition animation
- shared CSS motion tokens

Constraints:

- progressive enhancement only
- preserve `prefers-reduced-motion`
- avoid unstable Playwright waits
- avoid breaking Flowbite behavior unintentionally

### Undefined / Backlog

- GitHub REST API Star/Watch UI from About Ambient.
  - Requires PAT with `public_repo` or `repo` scope.
  - This is likely not suitable for a patch release.
- Analytics/event data exploration for cloud demo.
- More robust Vite HMR WebSocket proxy configuration for Apache.

## 6. Common Commands

### Development

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

When starting in the background on Windows, prefer hidden window/process.

### Build And Typecheck

```powershell
npm run ts-build
npm run build
```

### PHP Syntax Checks

```powershell
php -l src/Ambient.php
php -l src/render.php
php -l views/notice.php
```

### JSON Translation Check

```powershell
node -e "for (const f of require('fs').readdirSync('assets').filter(f=>/^lang(?:-[a-z]+)?\\.json$/.test(f))) JSON.parse(require('fs').readFileSync('assets/'+f,'utf8')); console.log('lang json ok')"
```

### E2E

Focused cloud MyPlaylist regression:

```powershell
.\node_modules\.bin\playwright.cmd test tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts --project=chrome --reporter=line
```

Playlist mode regression:

```powershell
.\node_modules\.bin\playwright.cmd test tests/e2e/scenarios/sc-011-playlist-mode-slice-ab.spec.ts --project=chrome --reporter=line
```

All configured E2E projects:

```powershell
npm run test:e2e
```

### Git Hygiene

```powershell
git status --short --branch
git diff --stat
git diff --check
git log --oneline --decorate -n 25
```

## 7. Release Workflow

Current scripted release flow:

```powershell
npm run release:start -- 2.3.4
```

After PR is merged into `main`:

```powershell
npm run release:finish -- 2.3.4
```

Important options:

- `scripts/release-start.ps1 2.3.4 -SkipPr`
- `scripts/release-finish.ps1 2.3.4 -KeepReleaseBranch`
- `scripts/release-finish.ps1 2.3.4 -AllowMergeCommit`

Public deployment guidance:

```bash
git pull --ff-only origin main
```

Avoid creating accidental merge commits on the public server. If `git pull origin main` opens an editor or says it cannot start Vim, the public worktree has diverged and needs explicit handling rather than routine merge commits.

## 8. Efficient Working Procedure

1. Start from clean `dev`.
2. Create feature branch:

```powershell
git checkout dev
git pull --ff-only origin dev
git checkout -b feature/vX.Y.Z-topic
```

3. Read relevant docs before editing:
   - `.codex/memo.md`
   - `docs/architecture/design/*`
   - `docs/operations/*runbook*`
   - relevant prior review/handoff docs
4. Make narrow code changes.
5. If TS/SCSS changes affect runtime, run:

```powershell
npm run ts-build
npm run build
```

6. Add/adjust E2E near the touched behavior.
7. Run targeted E2E before broader E2E.
8. Check `git diff --check`.
9. Commit logically:
   - docs-only commit if introducing design/review docs first
   - feature/fix commit after implementation and validation
10. For GitHub Release text, keep English release notes concise and user-facing.

## 9. Agent Orchestration Notes

Repository agent model is defined in `AGENTS.md`.

Practical roles:

- Orchestrator:
  - user-facing coordination
  - branch/release decisions
  - final integration
- Design Agent:
  - docs under `docs/architecture/design/`
- Implementation Agent:
  - source/tests/docs changes
- Test/Debug Agent:
  - E2E, reproduction, root cause notes
- Review Agent:
  - Must Fix / Should Fix / Nice to Have review reports under `docs/operations/reviews/`

In this Codex environment, only spawn subagents when the user explicitly asks for delegation/agent handoff. Otherwise perform the work directly while following the same role discipline.

## 10. Suggested First Task For Next Session

If the next development target is v2.4.0, start with:

1. Create `feature/v2.4.0-playlist-import` from `dev`.
2. Draft design doc under `docs/architecture/design/`.
3. Define playlist import data contract and validation/sanitization rules.
4. Decide cloud size limits and local write behavior before implementation.
5. Add E2E test cases for:
   - valid cloud import
   - invalid schema rejection
   - unsafe field sanitization
   - import overwrite of MyPlaylist
   - read-only JSON playlist remains protected
