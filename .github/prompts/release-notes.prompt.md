---
name: release-notes
description: "Generate standardized GitHub Release notes for Ambient using the fixed repository template."
argument-hint: "Provide target version/tag, e.g. v2.4.1"
agent: orchestrator
---
Generate GitHub Release notes for the specified version using:
- `.github/release-notes-template.md`

Required workflow:
1. Detect release range from previous tag to target tag.
2. Read commit subjects in range.
3. Read changed files in range.
4. Summarize only user-relevant changes.
5. Output with the exact section order from the template.

Output constraints:
- English only.
- Keep `Summary` to max 3 bullets.
- For patch releases, keep total output around 12-25 lines.
- If a section has no content, output `- None`.

Prioritize consistency with previous Ambient releases while avoiding heading/style drift.