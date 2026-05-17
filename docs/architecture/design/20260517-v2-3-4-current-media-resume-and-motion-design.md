# v2.3.4 Current Media Resume and Motion Design

Date: 2026-05-17  
Scope: `feature/v2.3.4`

## 1. Goals

v2.3.4 contains two small implementation items and one forward-looking design task.

1. Extend `AmbientUserData.playlistContext` resume behavior to include the current media item.
2. Improve toast show/hide motion with CSS transitions.
3. Document the future View Transitions API / UI motion system direction without implementing it in v2.3.4.

## 2. Current Media Resume

### 2-1. Stored Context

`AmbientUserData.playlistContext` already stores:

- playlist
- category

v2.3.4 extends it with an optional `media` object:

- `amId`
- `category`
- `title`
- `artist`
- `file`
- `videoid`

`amId` is used as the fastest match, but it is not treated as the only stable identifier. Playlist order may change, so the stored media identity also includes title/artist and media source fields.

### 2-2. Restore Behavior

Restore order:

1. Validate the saved playlist still exists.
2. Load the playlist.
3. Restore the saved category if it still exists.
4. Restore the saved media item if it can be matched.
5. If the media item cannot be matched, fall back to the existing playlist/category resume behavior.

Media restore selects the item and updates carousel/focus state, but does not auto-play. This avoids browser autoplay restrictions and keeps resume behavior predictable.

### 2-3. Fallback Rules

- Missing playlist: ignore saved context.
- Missing category: resume playlist with all categories.
- Missing media: resume playlist/category only.
- Saved media category mismatch: ignore the media item.
- Reordered playlist: find equivalent media by `videoid`, `file`, or `title + artist`.

## 3. Toast Motion

The existing toast is kept as a single DOM element: `#alert-notification`.

v2.3.4 adds CSS classes:

- `notice-toast`
- `notice-toast--visible`
- `notice-toast--hidden`

Behavior:

- show: starts above the viewport and fades/slides into the top-right position
- hide: fades/slides back above the viewport, then receives `hidden`
- reduced motion: transition is disabled with `prefers-reduced-motion: reduce`

This remains CSS-transition based. View Transitions API is intentionally not used for toast in v2.3.4.

## 4. Future View Transitions API / UI Motion System

The following items are not part of v2.3.4 implementation. They should be designed and implemented in a later minor release after playlist import and media editing work settle.

Candidate target: v2.6.0 or later.

### 4-1. Candidate Areas

- full-page reload/language-change crossfade
- modal open/close shared motion rules
- accordion open/close choreography in the options modal
- carousel item transition animation
- consistent motion tokens for duration/easing

### 4-2. Constraints

- Keep Flowbite interactions stable unless replacing them intentionally.
- Do not introduce motion that breaks Playwright visibility waits.
- Respect `prefers-reduced-motion`.
- Keep iOS viewport and bottom-menu behavior stable.
- Treat View Transitions API as progressive enhancement because browser support differs.

### 4-3. Recommended Approach

1. Define motion tokens in CSS first.
2. Move existing modal/toast/accordion transitions to named classes.
3. Add Playwright coverage for state and visibility, not visual timing.
4. Introduce View Transitions API only where it adds clear value over CSS transitions.
5. Keep unsupported browsers on CSS-transition fallback paths.
