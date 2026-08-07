# Ambient Latest System Summary

Date: 2026-08-07
Canonical: yes
Companion: `.codex/tmp/ja-docs/latest-system-summary-ja.md`
Supersedes:

- `docs/architecture/v2-system-summary.md`
- `docs/architecture/v2_6_0-system-summary.md`

## 1. Purpose

This document is the canonical system architecture summary for the current Ambient v2 line. It consolidates the early v2 baseline summary and the v2.6.0 modularization summary into one current reference for feature design, implementation, review, and handoff work.

Use this document as the first architecture index before opening lower-level design documents or source files.

## 2. Application Overview

Ambient is a self-hostable web media player for local and cloud-like deployments. It loads JSON playlists and plays YouTube media, local audio/video files, and URL-backed HTML media sources.

Core capabilities include:

- Playlist loading, import, selection, category filtering, and playlist mode changes.
- MyPlaylist persistence in browser storage for cloud mode.
- Local JSON playlist editing and persistence in local mode.
- YouTube, HTML audio, and HTML video playback.
- Seek playback, pseudo fader support, loop, random, and shuffle playback options.
- Media registration, playlist management, media edit, and thumbnail handling.
- YouTube Data API metadata autocomplete when configured.
- Local media metadata extraction and thumbnail generation support when configured.
- External Local Media URL registration and resolver hook support.
- Multilingual UI with language assets.
- Playwright E2E coverage for release and targeted regression checks.

## 3. Technology Stack

| Area | Technology |
|---|---|
| Server runtime | PHP |
| Frontend language | TypeScript |
| CSS/UI | Tailwind CSS + Flowbite |
| Build | Vite |
| E2E | Playwright |
| Data format | JSON playlists and JSON language files |
| Persistence | localStorage, sessionStorage, JSON APIs, PHP file writes |
| Runtime assets | `dist/assets/ambient.js`, `dist/assets/ambient.css`, `dist/manifest.json` |

Current package baseline:

- `package.json` version: `2.6.4`
- Vite manifest entry: `src/scripts/ambient.ts`

## 4. Runtime Entry Points

| Layer | Entry Point |
|---|---|
| PHP application | `index.php` |
| PHP core class | `src/Ambient.php` |
| PHP helpers | `functions.php` |
| Frontend source entry | `src/scripts/ambient.ts` |
| Frontend built runtime | `dist/assets/ambient.js` via Vite manifest |
| Main layout | `views/layout.php` |

PHP injects `AmbientData` into the page. The TypeScript runtime reads that data, initializes application state, loads playlists, wires UI surfaces, and starts the player runtime.

## 5. Frontend Layer Model

The current frontend is modularized under `src/scripts/`.

```text
src/scripts/
├── ambient.ts
├── bootstrap/
├── domain/
├── platform/
├── shared/
├── state/
├── types/
└── ui/
    ├── forms/
    ├── media-edit/
    └── player/
```

Layer responsibilities:

| Layer | Responsibility |
|---|---|
| `ambient.ts` | Composition root and runtime entry. |
| `bootstrap/` | Wiring, initialization, facades, and runtime orchestration. |
| `domain/` | Playlist, playback, import, media management, and media edit business logic. |
| `platform/` | AmbientData, storage, fetch/API access, metadata APIs, and persistence I/O. |
| `shared/` | Pure utilities, validation, sanitization, hooks, cache helpers, and formatting. |
| `state/` | Runtime state, playlist context, mode state, drafts, and watchers. |
| `types/` | Shared TypeScript type contracts. |
| `ui/` | DOM binding, UI state updates, forms, player views, drawers, modals, and notifications. |

Dependency direction:

- `bootstrap` may compose all layers.
- `domain` should stay independent from concrete DOM view implementation.
- `ui/*view.ts` modules should focus on rendering, binding, and event notification.
- `platform` owns external boundaries such as storage, fetch, and environment data.
- `shared` should remain reusable and side-effect-light.

## 6. Server-Side Structure

| File | Responsibility |
|---|---|
| `index.php` | Application entry and bootstrapping. |
| `autoload.php` | Namespace autoloading. |
| `src/Ambient.php` | Main Ambient class. |
| `src/api.php` | API endpoint behavior. |
| `src/render.php` | View rendering and frontend data injection. |
| `src/utils.php` | Utility, translation, playlist, and environment helpers. |
| `custom.php` | User-specific customization entry point, ignored by Git. |

## 7. Data And Persistence

Ambient uses different persistence paths depending on environment and feature area.

| Area | Storage |
|---|---|
| JSON playlists | `assets/*.json`, excluding language files. |
| Language files | `assets/langs/lang*.json`. |
| Cloud MyPlaylist | Browser localStorage. |
| User runtime context | Browser localStorage and sessionStorage. |
| Local playlist edits | PHP JSON save APIs. |
| Media edit persistence | `platform/media-edit-persistence.ts` and PHP APIs. |
| Generated or uploaded media assets | `assets/images/` and `assets/media/` depending on feature. |

Playlist schema compatibility is important. Feature work should avoid schema migrations unless a requirement explicitly calls for one.

## 8. Feature Entry Map

Use this table to find the likely source entry points for implementation work.

| Feature Area | Primary Modules |
|---|---|
| App boot / ready state | `bootstrap/app-init.ts`, `bootstrap/app-runtime-bootstrap.ts`, `bootstrap/app-boot.ts`, `state/status-watchers.ts` |
| Playlist startup / loading | `bootstrap/playlist-startup*.ts`, `bootstrap/playlist-load-*.ts`, `domain/playlist-loader.ts` |
| Playlist context / resume | `state/playlist-context.ts`, `state/playlist-resume-bindings.ts`, `bootstrap/playlist-resume-*` |
| Playlist display | `ui/playlist-view.ts`, `ui/playlist-display-bindings.ts`, `bootstrap/playlist-ui-*` |
| Playlist modes | `state/playlist-mode-state.ts`, `ui/playlist-mode-*`, `ui/playlist-reorder-runtime.ts`, `bootstrap/playlist-mode-*` |
| Settings drawer | `ui/settings-*`, `ui/settings-bindings.ts`, `bootstrap/app-settings-*` |
| Options modal | `ui/modals.ts`, `ui/options-modal-bindings.ts`, `bootstrap/options-*` |
| Media registration | `ui/forms/media-management.ts`, `domain/media-management-data.ts`, `bootstrap/management-media-*` |
| Local Media URL handling | `platform/external-media-url.ts`, `shared/ambient-hooks.ts`, `ui/forms/media-management.ts`, `ui/player/html-player-source.ts` |
| Playlist management | `ui/forms/playlist-management.ts`, `domain/playlist-management-*.ts`, `bootstrap/management-playlist-*` |
| Playlist import | `domain/playlist-import.ts`, `bootstrap/management-import-*`, `platform/fetch-data.ts` |
| Playback orchestration | `domain/media-playback.ts`, `ui/player/player-shell.ts`, `ui/player/player-runtime.ts`, `bootstrap/player-*` |
| YouTube player | `ui/player/youtube-player-view.ts`, `ui/player/youtube-player-events.ts`, `types/youtube.ts` |
| HTML audio/video player | `ui/player/html-player-view.ts`, `ui/player/html-player-source.ts`, `ui/player/html-player-events.ts` |
| Media Edit | `domain/media-edit/*`, `ui/media-edit/*`, `ui/player/media-edit-preview.ts`, `bootstrap/media-edit-*` |
| Metadata APIs | `platform/youtube-metadata-api.ts`, `platform/local-media-metadata.ts`, `platform/thumbnail-generation-api.ts` |
| Notifications | `ui/notifications.ts`, `bootstrap/notice-support.ts` |
| Shared hooks | `shared/ambient-hooks.ts` |
| Validation | `shared/validation.ts`, `shared/media-edit-timing-input.ts`, `domain/media-edit-timing.ts` |

## 9. UI Runtime Surfaces

The main UI is rendered from PHP views and wired by TypeScript.

| View | Runtime Role |
|---|---|
| `views/player.php` | Main media display shell. |
| `views/carousel.php` | Current/previous/next media visual navigation. |
| `views/menu.php` | Bottom command bar. |
| `views/drawer-left.php` | Playlist drawer. |
| `views/drawer-right.php` | Settings drawer. |
| `views/modal.php` | Options modal container. |
| `views/collapse.php` | Options modal accordion content. |
| `views/notice.php` | Server-rendered notice surface. |

The frontend runtime treats these as stable DOM surfaces. Feature work should prefer existing binding modules instead of adding unrelated inline scripts in PHP views.

## 10. Testing And Release Validation

Important commands:

| Command | Purpose |
|---|---|
| `npm run check:i18n` | Validate translation coverage. |
| `npm run typecheck` | Run TypeScript type checking. |
| `npm run build` | Build Vite assets. |
| `npm run test:e2e` | Run the split cloud/local release E2E pack. |
| `npm run test:e2e:matrix` | Run broad browser/device smoke matrix; not the release gate. |
| `npm run release:prepare -- X.Y.Z` | Prepare a release from a feature branch. |
| `npm run release:start -- X.Y.Z` | Start release branch and PR flow. |
| `npm run release:finish -- X.Y.Z` | Finish release synchronization and branch cleanup. |

## 11. Current Architecture Notes

- `src/scripts/ambient.ts` should remain a composition root, not a place for new feature logic.
- PHP should resolve frontend assets through the Vite manifest instead of referencing legacy script paths directly.
- `custom.php` remains user-local and ignored.
- `.codex/memo.md` is a scratch input memo. Canonical documentation belongs under `docs/`.
- Local Japanese companion documents belong under `.codex/tmp/ja-docs/` and are not authoritative.

## 12. References

- `docs/architecture/design/20260531-v2-6-0-modularization-detailed-design.md`
- `docs/architecture/design/20260807-v2-6-5-local-media-url-resolver-design.md`
- `docs/operations/handoffs/20260715-v2-6-0-modularization-completion-handoff.md`
- `docs/operations/handoffs/20260807-v2-6-5-local-media-url-resolver-handoff-requirements.md`
- `docs/operations/howToRelease.md`
