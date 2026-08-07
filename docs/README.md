# Ambient Documentation

Date: 2026-08-07
Canonical: yes
Companion: `.codex/tmp/ja-docs/README-ja.md`

## Overview

Ambient is a self-hostable hybrid media player that can handle the following in one UI:

- YouTube playback through the YouTube IFrame Player API
- Local audio/video playback through HTML5 media elements
- JSON playlist management
- Cloud-mode MyPlaylist persistence in browser storage
- Local-mode playlist and media editing through PHP-backed file persistence

The current v2 line uses a TypeScript runtime built by Vite, modular frontend architecture, Tailwind CSS + Flowbite UI surfaces, and Playwright E2E coverage.

## Directory Overview

| Path | Purpose |
|---|---|
| `index.php` | Application entry point. |
| `src/` | PHP core and TypeScript source. |
| `src/scripts/` | Modular TypeScript frontend runtime. |
| `views/` | PHP UI component templates. |
| `assets/` | Playlists, language files, media, and images. |
| `dist/` | Built frontend assets and Vite manifest. |
| `tests/e2e/` | Playwright scenarios, fixtures, and utilities. |
| `docs/` | Canonical English project documentation. |

## Runtime Requirements

- PHP 8.x recommended.
- Apache or Nginx with URL rewrite support.
- Node.js and npm for build, typecheck, and E2E workflows.
- Windows + XAMPP is the primary local development environment.

## Local Startup

1. Clone the project under a web root.
2. Expose the project directory through the local web server.
3. Open the application in a browser.

Example local URL:

```text
http://dev2.ka2.org/amp/
```

## Development Commands

```bash
npm run build         # Build dist assets
npm run typecheck     # Run TypeScript type checking
npm run check:i18n    # Validate translation coverage
npm run test:e2e      # Run release-gate split cloud/local E2E
```

## Key Documents

| Document | Purpose |
|---|---|
| `docs/architecture/latest-system-summary.md` | Current canonical system architecture summary. |
| `docs/features/uiux/latest-uiux-summary.md` | Current canonical UI/UX summary. |
| `docs/operations/howToRelease.md` | Current canonical release procedure. |
| `docs/architecture/design/20260807-v2-6-5-local-media-url-resolver-design.md` | v2.6.5 Local Media URL resolver design. |
| `docs/operations/handoffs/20260807-v2-6-5-local-media-url-resolver-handoff-requirements.md` | v2.6.5 handoff requirements. |
| `docs/features/requests/20260807-requirement-memo-backlog.md` | Current backlog promoted from requirement memo inventory. |

## Documentation Policy

- `docs/` is the canonical documentation tree and should be written in English.
- Japanese reader-friendly companion documents belong under `.codex/tmp/ja-docs/` and are not tracked.
- If a Japanese companion conflicts with an English canonical document, the English canonical document wins.
- `.codex/memo.md` is scratch input for requirement capture, not a source of truth.

## License

See the project license and repository metadata for licensing details.
