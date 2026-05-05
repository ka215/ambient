# Handoff: Phase 1 M1 Task 1.3 - ambient.js → TypeScript Full Migration

**Date:** 2026-05-03  
**Assignee:** Implementation Agent  
**Status:** Ready for Execution  
**Duration:** 4-6 hours

---

## Objective

Complete the TypeScript migration of `src/scripts/ambient.js` (3099 lines) to `src/scripts/ambient.ts` with 100% type safety, preserving all existing behavior and function signatures.

---

## Context & Constraints

### Current State
- **Source:** `src/scripts/ambient.js` - Vanilla JavaScript, 3099 lines, no type safety
- **Target:** `src/scripts/ambient.ts` - Full TypeScript, strict mode, type-complete
- **Type Definitions:** Already created in `src/scripts/types/ambient.ts` and `src/scripts/types/youtube.ts`
- **tsconfig.json:** Already configured with strict: true, target: ES2020

### Architecture
- **Build:** TypeScript → dist/ambient.js (ES2020) via tsc
- **Integration:** Output loads in `views/layout.php` as `<script src="/dist/ambient.js"></script>`
- **No Changes Allowed:**
  - PHP backend (src/Ambient.php, API endpoints)
  - HTML views (views/*.php)
  - Build configuration (tsconfig.json, package.json scripts)

### Key Behavioral Requirements
1. **AMP_STATUS Watchers:** Object.defineProperty callbacks must fire identically to original
   - Watched properties: prev, current, next, ctg, order, loop, media, category, shuffle, volume, notice, options
   - Each property change triggers specific UI updates (saveStge, changePlaylistFocus, etc.)

2. **Event Handlers:** All DOM event listeners must maintain exact behavior
   - Form submissions, button clicks, input changes
   - Carousel navigation, player controls, playlist selection
   - Settings panel toggles (loop, random, shuffle, fader, darkmode, language)

3. **Player Management:** YouTube, Audio, and Video player creation/destruction logic
   - Player state tracking and event callbacks
   - Fade-in/fade-out interval management
   - Seek operation cancellation

4. **Storage Management:** localStorage/sessionStorage integration via useStge/saveStge/loadStge

5. **Global Objects:**
   - `window.APP_KEY` - Storage key string
   - `window.$ambient` - Storage container object
   - `window.AmbientData` - PHP-injected initialization data
   - `window.YT` - YouTube IFrame API (global)

---

## Deliverables

### 1. src/scripts/ambient.ts
**Requirements:**
- ✅ 100% type-complete (no `any` or `// @ts-ignore`)
- ✅ Import from `./types/ambient.ts` and `./types/youtube.ts`
- ✅ All 100+ functions ported with exact behavior preservation
- ✅ Event listeners for all DOM elements preserved
- ✅ Form handling (media management, playlist management) intact
- ✅ Utility functions (DOM manipulation, storage, validation) complete

**Function Groups to Implement:**

**A. Initialization & State (Lines 1-120)**
- `init()` - Main entry point
- `initStatus()` - AMP_STATUS factory
- `watchState()` - Property watchers setup
- Window size tracking, YouTube API loader

**B. Data Fetching & Playlist Management (Lines 140-450)**
- `getPlaylistData(playlist)` - Fetch playlist JSON
- `updatePlaylist()` - Render playlist items
- `clearPlaylist()` - Clear playlist display
- `updateCarousel()` - Carousel item management
- `updateMediaCaption(mediaData)` - Caption rendering with marquee

**C. Category & Options (Lines 450-650)**
- `clearCategory()` - Clear category selector
- `updateCategory()` - Populate categories
- `getOption(key)` - Extract option from AMP_STATUS.options
- `applyOptions()` - Apply background, random, shuffle, fader, volume, darkmode

**D. Player Setup & Events (Lines 700-1500)**
- `setupPlayer(type, src, mediaData)` - Route to YouTube/Audio/Video setup
- `createYTPlayer(mediaData)` - YouTube IFrame player
- `createPlayerTag(tagname, mediaData)` - Audio/Video tag creation
- `onPlayerReady(event)` - YouTube ready callback
- `onPlayerStateChange(event)` - YouTube state callback (PLAYING, PAUSED, ENDED, etc.)
- `onPlayerError(event)` - YouTube error handler

**E. Fade Effects (Lines 1500-1700)**
- `fadeIn(media, period, start)` - Volume fade-in animation
- `fadeOut(media, period, end)` - Volume fade-out animation
- `abortFader(type)` - Cancel fade operation

**F. Seek & Playback (Lines 1700-1900)**
- `abortSeeking()` - Cancel seek operation
- `updatePlayStatus(currentAmId)` - Update prev/current/next
- `playItem(object, id)` - Initiate playback of media item
- `togglePlayerControllButtons()` - Enable/disable play/pause buttons

**G. UI Toggle Functions (Lines 1900-2200)**
- `changePlaylistFocus()` - Highlight current item in playlist
- `scrollToFocusItem()` - Auto-scroll to active item
- `changeToggleRandomly()` - Update random mode toggle
- `changeToggleShuffle()` - Update shuffle toggle
- `changeToggleSeekplay()` - Update seek toggle
- `changeToggleFader()` - Update fader toggle
- `changeToggleDarkmode()` - Update darkmode toggle
- `changeRangeVolume()` - Update volume slider display
- `toggleMarqueeCaption()` - Marquee animation for long titles
- `toggleAlert(state, auto_close)` - Alert notification control

**H. Form Handlers (Lines 2200-2800)**
- Media Management Form:
  - `resetMediaManageForm()` - Reset form state
  - `addMediaData(payload)` - Add media to playlist
  - Event handlers for media_type, youtube_url, local_media_file, etc.
- Playlist Management Form:
  - `resetPlaylistManageForm()` - Reset form state
  - `generatePlaylistJson(seekFormat)` - Export playlist as JSON
  - Event handlers for symlink, category creation, download

**I. Validation & Notifications (Lines 2800-2900)**
- `setValidated(element, result)` - Update form field validation display
- `updateNotice(notification)` - Show alert/notification
- `getRelativeFilepath(basefile)` - Validate file path via API

**J. Observer & Event Setup (Lines 2900-3000)**
- `watcher(targets, callback, config)` - MutationObserver wrapper
- Multiple drawer/modal observers
- Window resize listener with throttling

**K. Utility Functions (Lines 3000-3099)**
- Type checks: `isObject()`, `isElement()`, `isNumberString()`, `isBooleanString()`
- String manipulation: `basename()`, `getExt()`, `filterText()`, `mb_strimwidth()`
- Array operations: `inArray()`, `inRange()`, `snakeToCapital()`
- DOM manipulation: `toggleClass()`, `getAtts()`, `setAtts()`, `setStyles()`, `toggleClass()`, `hide()`, `show()`, `getRect()`
- Storage: `useStge()`, `saveStge()`, `loadStge()`, `removeStge()`
- Cookie handling: `getCookie()`, `updateCookie()`
- Network: `fetchData(url, method, data, datatype, timeout)`
- Logging: `logger(...args)`

---

## Acceptance Criteria

### A. Code Quality
- [ ] `tsc --noEmit` executes with zero errors and zero warnings
- [ ] All functions have proper type annotations (params, return types)
- [ ] No `any` type used (except minimal necessary global window augmentations)
- [ ] Imports from type definitions correctly resolve

### B. Behavioral Equivalence
- [ ] AMP_STATUS watchers fire callbacks identically to original
- [ ] All event listeners attach and fire with same behavior
- [ ] Player creation/destruction matches original flow
- [ ] Form validation and submission works identically
- [ ] Storage operations (save/load/remove) maintain same data format

### C. Build & Output
- [ ] `npm run ts-build` produces dist/ambient.js
- [ ] Output ambient.js is valid ES2020 and executable
- [ ] Output can be loaded in browser as `<script src="/dist/ambient.js"></script>`
- [ ] Window object globals created (AMP_STATUS, init, etc.)

### D. Integration Test
- [ ] Manual verification: Open views/layout.php in XAMPP Apache
- [ ] Verify AMP_STATUS object exists and watchers respond to property changes
- [ ] Verify at least one watcher callback executes (e.g., set current property → changePlaylistFocus triggers)
- [ ] No console errors related to missing functions or type issues

### E. Verification Report
- [ ] Build log (tsc output)
- [ ] Test results (watcher verification, function availability)
- [ ] Any breaking changes documented
- [ ] Known limitations noted

---

## Input Files & References

| File | Purpose |
|------|---------|
| `src/scripts/ambient.js` | Source to port (3099 lines) |
| `src/scripts/types/ambient.ts` | Type definitions (AmpStatus, MediaItem, PlaylistOptions, etc.) |
| `src/scripts/types/youtube.ts` | YouTube Player types |
| `docs/architecture/v1-system-summary.md` | v1 architecture and data structures |
| `docs/features/uiux/v1-uiux-summary.md` | v1 behavior and state flow |
| `tsconfig.json` | TypeScript configuration (strict, ES2020) |
| `package.json` | Scripts: ts-dev, ts-build |

---

## Key Implementation Notes

### 1. AMP_STATUS Watcher Pattern
```typescript
// Original pattern to preserve:
function watchState() {
  const callback = (prop, oldValue, newValue) => {
    switch(true) {
      case /^(prev|current|next)$/.test(prop):
        saveStge(prop, newValue)
        if (prop === 'current') changePlaylistFocus()
        break
      // ... other cases
    }
  }
  
  Object.keys(AMP_STATUS).forEach(propName => {
    let value = AMP_STATUS[propName]
    Object.defineProperty(AMP_STATUS, propName, {
      get: () => value,
      set: (newValue) => {
        const oldValue = value
        value = newValue
        if (oldValue !== newValue) callback(propName, oldValue, newValue)
      }
    })
  })
}
```

### 2. Dynamic Property Assignment
Some properties (fader, shuffle) are not in initStatus() but added dynamically:
```typescript
// fader is added in createYTPlayer() and createPlayerTag()
AMP_STATUS.fader = Boolean(optFader)

// shuffle is added in applyOptions() and updatePlaylist()
AMP_STATUS.shuffle = [...shuffled array...]
```
These should work with the watcher but may not trigger initially. Document this if it's an issue.

### 3. Scope Management
All functions should be scoped within `init()` closure or exported as module functions. The closure approach (original) is recommended for state encapsulation, but TypeScript module exports are also acceptable if carefully done.

### 4. Global State
- `let player: YTPlayer | null = null` - Shared YouTube player instance
- `let seekId: ReturnType<typeof setInterval> | null = null`
- `let fadeinId: ReturnType<typeof setInterval> | null = null`
- `let fadeoutId: ReturnType<typeof setInterval> | null = null`
These must be declared at appropriate scope to persist across function calls.

### 5. Event Handler Storage
Original code attaches event listeners directly to DOM elements. Preserve this pattern. Consider storing references if cleanup is needed.

---

## Error Handling Strategy

- Log errors with `logger()` (debug mode aware)
- Catch promises from `fetchData()` and `getRelativeFilepath()`
- Handle player API errors in `onPlayerError()`
- Validate form inputs with try-catch where needed

---

## Testing & Verification Commands

After implementation:

```bash
# Compile without emitting (check for errors)
npm run ts-build

# Watch mode for development
npm run ts-dev

# Manual test in browser:
# 1. Open http://localhost/dev2.ka2.org/amp/index.php
# 2. Check browser console: window.AMP_STATUS should be defined
# 3. Verify watchers:
#    window.AMP_STATUS.current = 0
#    → Should trigger changePlaylistFocus() (check element classes update)
# 4. Test a playlist load and media playback
```

---

## Estimated Effort

- **Function Porting:** 3-4 hours
- **Event Handler Setup:** 1 hour
- **Type Refinement:** 1 hour
- **Testing & Verification:** 1 hour
- **Total:** 4-6 hours

---

## Success Criteria Summary

✅ **Definition of Done:**
1. tsc --noEmit passes with zero errors
2. ambient.ts contains all 100+ functions from ambient.js
3. dist/ambient.js builds successfully and is executable
4. Manual browser test shows AMP_STATUS watchers work
5. No console errors on views/layout.php
6. Verification report submitted with test results

---

## Deliverable Structure

```
src/scripts/
  ├── ambient.ts (OUTPUT - complete implementation)
  ├── ambient.js (KEEP - original for reference)
  ├── types/
  │   ├── ambient.ts (type defs - ready)
  │   ├── youtube.ts (type defs - ready)
  │   └── index.ts (re-exports)
dist/
  └── ambient.js (BUILD OUTPUT - generated by tsc)
```

---

## Next Steps After Completion

1. Verify build output
2. Test in browser with views/layout.php
3. Move to M2 (Playwright setup) if all checks pass
4. Review phase for Must Fix issues if any

---

**Ready for assignment. Contact if clarifications needed.**
