# Ambient Latest UI/UX Summary

Date: 2026-08-07
Canonical: yes
Companion: `.codex/tmp/ja-docs/latest-uiux-summary-ja.md`
Supersedes: `docs/features/uiux/v1-uiux-summary.md`

## 1. Purpose

This document is the canonical UI/UX summary for the current Ambient v2 line. It keeps the component-oriented structure of the earlier v1 UI/UX summary while updating the content to match the modularized v2 runtime and the current feature set.

Use this document as a UI reference before changing PHP views, TypeScript UI bindings, player surfaces, drawers, modals, or management forms.

## 2. UI Composition

Ambient is a single-page media player assembled from PHP views and controlled by TypeScript modules.

```text
views/layout.php
├── notice
├── player
│   ├── carousel
│   ├── caption
│   └── player mount surface
├── menu
├── drawer-left
├── drawer-right
└── modal
    └── collapse / accordion content
```

Primary runtime modules:

| Area | Modules |
|---|---|
| App controls | `ui/app-controls.ts`, `ui/app-event-handlers.ts`, `ui/player-control-bindings.ts` |
| Drawers | `ui/drawers.ts`, `ui/viewport.ts`, `ui/viewport-runtime.ts` |
| Playlist UI | `ui/playlist-view.ts`, `ui/playlist-*-bindings.ts`, `ui/playlist-mode-*` |
| Settings UI | `ui/settings-view.ts`, `ui/settings-controls.ts`, `ui/settings-bindings.ts` |
| Options modal | `ui/modals.ts`, `ui/options-modal-bindings.ts` |
| Forms | `ui/forms/*` |
| Media Edit | `ui/media-edit/*` |
| Player views | `ui/player/*` |
| Notifications | `ui/notifications.ts` |

## 3. Main UI Surfaces

### 3.1 Player Surface

`views/player.php` provides the central playback area. TypeScript modules mount YouTube or HTML media players into this surface and update media caption, thumbnail, optional origin links, and visual state.

Key UX expectations:

- Keep playback state visible and predictable.
- Preserve player layout across YouTube, video, and audio sources.
- Avoid layout shifts when changing media kind.
- Use runtime-only resolved media URLs for playback while preserving stored origin URLs when applicable.

### 3.2 Carousel

`views/carousel.php` provides visual previous/current/next navigation.

Current behavior:

- Displays media thumbnails or placeholders.
- Updates when the selected playlist item changes.
- Supports playlist drawer and carousel synchronization.
- Needs cache-busting when thumbnail images are regenerated.

### 3.3 Bottom Menu

`views/menu.php` is the main command bar.

Primary actions:

- Open playlist drawer.
- Refresh/restart.
- Play and pause.
- Open settings drawer.
- Open options modal.

The menu should remain reachable on mobile viewports and should not be hidden behind browser UI chrome on supported mobile devices.

### 3.4 Playlist Drawer

`views/drawer-left.php` displays playlist items and playlist-mode controls.

Supported workflows:

- Select media for playback.
- Add media from direct playlist entry points.
- Switch between normal, delete, reorder, and edit-oriented workflows where supported.
- Keep the active item visible where practical.

### 3.5 Settings Drawer

`views/drawer-right.php` exposes playlist and playback settings.

Common controls:

- Current playlist.
- Target category.
- Loop, random, shuffle, seek playback, fader, dark mode.
- Default volume.
- Language selection.

Settings are connected to playlist context, playlist options, and user runtime storage.

### 3.6 Options Modal

`views/modal.php` and `views/collapse.php` provide operational tools.

Main sections:

- Media Management.
- Playlist Management.
- About Ambient and extension content.

The modal uses accordion-style sections. Future UI motion work may improve accordion transitions and modal appearance.

### 3.7 Media Management

Media Management supports:

- YouTube media registration.
- Local media file upload in local mode.
- Local Media URL registration in supported modes.
- Metadata autocomplete when configured.
- Validation and playability checks before commit.

Cloud mode restricts host-computer file upload but can support URL-backed Local Media registration.

### 3.8 Playlist Management

Playlist Management supports:

- Playlist import.
- Playlist/category operations according to environment capabilities.
- Local JSON playlist persistence in local mode.
- MyPlaylist persistence in cloud mode.

### 3.9 Media Edit

Media Edit is a full-screen editing workflow for existing media items.

Capabilities include:

- Category, title, artist, description, volume, timing, and thumbnail edits.
- YouTube and local media preview.
- Timing controls for start, end, fade-in, and fade-out points.
- Validation feedback close to the relevant fields.
- Thumbnail upload and generated thumbnail workflows where configured.
- YouTube advanced playback options where supported.

The stored media identity should remain stable unless an explicit requirement allows editing it.

## 4. Interaction Model

Ambient uses a state-and-binding model rather than direct inline behavior.

Key interaction patterns:

- State modules hold playlist context, playlist mode, drafts, and watchers.
- Bootstrap modules wire state, domain logic, and UI bindings.
- UI modules update DOM surfaces and dispatch user intent to the runtime.
- Domain modules decide playlist, playback, edit, and persistence behavior.

The preferred implementation path is:

```text
user event
  -> ui binding
  -> bootstrap/runtime facade
  -> domain/platform/state action
  -> UI refresh
```

## 5. Responsive Behavior

Ambient supports mobile, tablet, and desktop viewports.

Current expectations:

- Drawers can overlay the main player on smaller screens.
- Wide desktop layouts can keep more surfaces visible.
- Bottom controls must remain accessible on mobile.
- Text should fit within buttons, labels, and form controls.
- Modal and media edit workflows must remain scrollable and usable on small screens.

The historical `minFullUIWidth` idea remains useful as a layout threshold, but current implementation work should verify actual behavior through Playwright screenshots or targeted manual checks when changing layout.

## 6. Accessibility Expectations

Required practices:

- Preserve semantic buttons and labels.
- Keep form labels connected to inputs.
- Maintain keyboard reachability for modal, drawer, and media edit workflows.
- Avoid invisible but focusable stale controls.
- Ensure validation feedback is close to the field that needs correction.
- Preserve useful `aria-*` state for active playlist items, toggles, and modal states.

Known sensitive areas:

- Play/pause control switching.
- Drawer focus behavior.
- Full-screen Media Edit focus management.
- Custom player controls, if native audio/video controls are replaced.

## 7. Styling Model

Ambient uses Tailwind CSS and Flowbite, with project-specific SCSS and image assets.

Current styling principles:

- Keep operational tools compact and scannable.
- Use existing Flowbite/Tailwind patterns where they already exist.
- Keep dark mode parity for player, drawer, modal, form, and notification surfaces.
- Prefer existing UI binding modules over hardcoded view-specific behavior.
- Keep image placeholders and thumbnails visually consistent across playlist, carousel, and media edit.

## 8. Localization

Static UI text should use translation keys and language assets.

Current expectations:

- English is the base UI language.
- Supported locale files live under language assets.
- Hardcoded UI text should be avoided in TypeScript and PHP views.
- Dynamic playlist item content remains playlist data, not translation data.
- Validation and helper text must be included in i18n coverage.

Run `npm run check:i18n` when changing user-facing text.

## 9. UX Backlog Candidates

The following are active or future UX candidates:

- View Transitions API motion work for v2.7.0.
- Richer accordion and modal transitions.
- Carousel transition improvements.
- Optional custom audio player with thumbnail/card layout.
- Further inline SVG and static asset cleanup if source debt remains.
- Better handling of large playlist and cloud storage capacity limits.

## 10. Validation

For UI changes, choose validation based on risk:

- `npm run typecheck`
- `npm run build`
- `npm run check:i18n`
- targeted Playwright scenario
- `npm run test:e2e` for release-sensitive changes

Layout, text fit, modal behavior, and player rendering changes should be checked in both desktop and mobile-sized viewports.
