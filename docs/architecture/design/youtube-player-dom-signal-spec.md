# YouTube Player DOM Signal Specification

**Version**: 1.0  
**Date**: 2026-05-03  
**Scope**: Ambient v2-dev — YouTube IFrame API lifecycle signalling via DOM attributes

---

## 1. Overview

To enable reliable E2E test synchronisation without fixed sleeps, Ambient emits YouTube API lifecycle phase transitions as DOM attributes on `document.body`. These attributes are written synchronously within each lifecycle callback, making them observable from Playwright's `page.locator` / `waitForFunction` APIs.

---

## 2. Attribute Specification

| Attribute | Type | Description |
|---|---|---|
| `data-yt-phase` | string | Current phase name (see §3). Empty string = not yet initialised. |
| `data-yt-seq` | number (as string) | Monotonically-incrementing counter. Incremented on every phase transition. Starts at `0`; first transition sets it to `1`. |
| `data-yt-error` | string | YT error code string when phase is `api_error` or `player_error`. Empty string otherwise. |

All three attributes are set atomically inside `syncYouTubeSignalAttrs()` which is called by `emitYouTubeSignal()`.

---

## 3. Phase States

| Phase | Meaning | Previous phase(s) |
|---|---|---|
| `idle` | Initial state (set by `initStatus()`) | — |
| `api_loading` | `<script>` tag for YouTube IFrame API inserted | `idle` |
| `api_loaded` | `window.YT.Player` available (`onYouTubeIframeAPIReady` fired) | `api_loading` |
| `api_error` | API `<script>` tag `onerror` fired | `api_loading` |
| `player_creating` | `new YT.Player(...)` called | `api_loaded` |
| `player_created` | YT.Player constructor returned (object exists) | `player_creating` |
| `player_ready` | `onPlayerReady` callback fired | `player_created` |
| `playing` | `onPlayerStateChange` → `YT.PlayerState.PLAYING` | `player_ready`, `paused` |
| `paused` | `onPlayerStateChange` → `YT.PlayerState.PAUSED` | `playing` |
| `ended` | `onPlayerStateChange` → `YT.PlayerState.ENDED` | `playing` |
| `player_error` | `onPlayerError` callback fired | any post-`player_created` phase |

---

## 4. Phase Transition Diagram

```
[idle]
  │
  ▼ emitYouTubeSignal('api_loading')   ← script tag inserted
[api_loading]
  ├──(load)──► [api_loaded]            ← onYouTubeIframeAPIReady
  └──(error)─► [api_error]

[api_loaded]
  │
  ▼ emitYouTubeSignal('player_creating')
[player_creating]
  │
  ▼ emitYouTubeSignal('player_created')
[player_created]
  │
  ▼ emitYouTubeSignal('player_ready')  ← onPlayerReady
[player_ready]
  │
  ├──(play)──► [playing]   ◄──► [paused]
  │                │
  │                └──(end)──► [ended]
  │
  └──(error)─► [player_error]          ← onPlayerError
```

---

## 5. Implementation Reference

### 5.1 Signal emission (`ambient.js` / `ambient.ts`)

```js
function syncYouTubeSignalAttrs() {
  document.body.setAttribute('data-yt-phase', AMP_STATUS.yt_phase ?? '');
  document.body.setAttribute('data-yt-seq',   String(AMP_STATUS.yt_seq ?? 0));
  document.body.setAttribute('data-yt-error', AMP_STATUS.yt_error ?? '');
}

function emitYouTubeSignal(phase, error = '') {
  AMP_STATUS.yt_seq   = (AMP_STATUS.yt_seq ?? 0) + 1;
  AMP_STATUS.yt_phase = phase;
  AMP_STATUS.yt_error = error;
  syncYouTubeSignalAttrs();
}
```

### 5.2 Initial state (`initStatus`)

```js
yt_phase: 'idle',
yt_seq:   0,
yt_error: '',
```

### 5.3 Script insert order (load race fix)

The `load` / `error` event listeners **must** be attached before `insertBefore()` to guarantee the events are not missed on fast cached loads.

```js
tag.addEventListener('load', () => emitYouTubeSignal('api_loaded'));
tag.addEventListener('error', () => emitYouTubeSignal('api_error', 'script_load_failed'));
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); // attach AFTER listeners
```

---

## 6. E2E Usage Patterns (Playwright)

### 6.1 Wait for API ready

```ts
await ambientPage.waitForYouTubeApi();
// Internally: waits for window.YT.Player to exist AND data-yt-seq >= 1
```

### 6.2 Wait for player ready (after page load)

```ts
await ambientPage.waitForYouTubePlayerReady();
// Internally: waitForYouTubePhase(['player_ready','playing','paused'])
```

### 6.3 Seq-based transition wait (prevents stale signals)

```ts
const seqBefore = await ambientPage.getYouTubeSignalSeq();
await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
await ambientPage.waitForYouTubePhase('playing', seqBefore + 1);
```

### 6.4 Pause and confirm

```ts
const seqBeforePause = await ambientPage.getYouTubeSignalSeq();
await page.evaluate(() => {
  document.getElementById('btn-pause')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
});
await ambientPage.waitForYouTubePhase('paused', seqBeforePause + 1);
```

### 6.5 Fixture method signatures

| Method | Signature | Description |
|---|---|---|
| `getYouTubeSignalSeq` | `() => Promise<number>` | Read current `data-yt-seq` |
| `waitForYouTubeApi` | `() => Promise<void>` | Wait for API script + seq ≥ 1 |
| `waitForYouTubePhase` | `(phases: string \| string[], minSeq?: number) => Promise<void>` | Poll until phase matches and seq ≥ minSeq |
| `waitForYouTubePlayerReady` | `(minSeq?: number) => Promise<void>` | Shortcut: player_ready / playing / paused |

---

## 7. Design Rationale

| Concern | Decision |
|---|---|
| Why body attributes? | Observable from Playwright without injecting JS globals; survives iframe sandboxing. |
| Why a sequence counter? | Prevents tests from matching a stale phase value left from a previous interaction. |
| Why not CustomEvents? | Playwright `waitForEvent` has timing windows; polling a stable DOM attribute is more deterministic. |
| Why `data-yt-*` (no `e2e` prefix)? | Phase state is app-observable runtime metadata, not test-only. Can be used by CSS/logging too. |

---

## 8. Related Artefacts

- Implementation: [src/scripts/ambient.ts](../../../src/scripts/ambient.ts)
- Type definition: [src/scripts/types/index.ts](../../../src/scripts/types/index.ts)
- E2E fixture: [tests/e2e/fixtures/ambient-page.fixture.ts](../../../tests/e2e/fixtures/ambient-page.fixture.ts)
- M2 test report: [docs/operations/test-reports/20260503-phase1-m2-e2e-baseline.md](../../operations/test-reports/20260503-phase1-m2-e2e-baseline.md)
