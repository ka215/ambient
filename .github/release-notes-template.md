# GitHub Release Notes Template (Ambient)

Use this exact structure for every release note body.

## Summary
- {1-3 bullets of user-visible outcomes in plain English}

## What's Changed
- Added: {new features, if any}
- Improved: {UX/UI/behavior improvements, if any}
- Fixed: {bug fixes and regressions, if any}
- Localization: {language/wording/i18n updates, if any}
- Reliability: {runtime hardening, rendering stability, validation hardening, if any}

## Validation
- Build: `{command and result}`
- Runtime checks: `{manual checks or scenario coverage}`

## Commits
- `{short-sha} {commit subject}`
- `{short-sha} {commit subject}`
- `{short-sha} {commit subject}`

## Notes
- {optional: deprecation/revert/warning/migration note}

---

## Style Rules
- Language: English only.
- Tone: concise, release-note style, no marketing wording.
- Keep headings and order unchanged.
- Do not add empty sections: if no content, write `- None`.
- Prefer behavior-focused wording over implementation detail.
- Keep `Summary` to max 3 bullets.
- Keep total length around 12-25 lines for patch releases.