# v2.6.3 YouTube Autoplay Investigation

Date: 2026-07-31
Target: v2.6.3
Scope: experimental verification plan for YouTube IFrame Player autoplay behavior

## Summary

The v2.6.3 implementation now always passes `playsinline=1` to YouTube IFrame Player configuration.

The requested `autoplay=1&mute=1` then unmute/set-volume behavior is not enabled as a production default in this slice. Browser autoplay behavior, especially in inactive tabs, is governed by browser policy and cannot be guaranteed safely without real browser and device confirmation.

## Current Implementation State

- `playsinline=1` is included for normal YouTube playback.
- `playsinline=1` is included for media edit YouTube preview playback.
- Existing configured volume behavior remains unchanged.
- No automatic mute-then-unmute workaround is enabled by default.

## Manual Verification Matrix

Run these checks before deciding whether to introduce any mute-first autoplay behavior:

| Browser | State | Scenario | Expected observation |
|---|---|---|---|
| Chrome desktop | active tab | YouTube media starts with existing autoplay settings | Record whether playback starts and whether sound is allowed |
| Chrome desktop | inactive/background tab | Open Ambient, switch tab before playback starts | Record whether autoplay is blocked or delayed |
| Safari iOS | active tab | YouTube media starts after page interaction | Confirm inline playback and whether autoplay starts |
| Safari iOS | inactive/background app/tab | Start page then background/return | Record whether playback is blocked or paused |

## Experimental Variant

If a dedicated test branch or temporary local patch is used, test:

```text
autoplay=1
mute=1
playsinline=1
```

Then after `onReady` or first `PLAYING` event:

```text
unMute()
setVolume(mediaItem.volume or playlist default volume)
```

Also observe `onAutoplayBlocked` where the IFrame API/browser supports it.

## Acceptance Decision

Do not change production autoplay defaults until manual results show:

1. muted start materially improves successful start rate;
2. unmute does not fail silently in target browsers;
3. existing user volume settings are restored predictably;
4. no regression occurs for already working YouTube playback.

## Validation Executed

Automated code validation for `playsinline=1` was covered by the v2.6.3 build/typecheck runs in the implementation slices.

Manual autoplay policy validation was not executed in this environment because it requires real browser tab focus/background behavior.

## Open Risks

- Inactive tab autoplay may remain blocked even with `mute=1`.
- Programmatic unmute may require a user gesture depending on browser policy.
- iOS Safari behavior must be confirmed on an actual device or a reliable device lab.
