---
name: release-notes
description: "Generate standardized GitHub Release notes for Ambient using the fixed repository template."
argument-hint: "Provide target version/tag, e.g. v2.4.1"
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

Ambient release creation case study (v2.6.4):
- If the target tag does not exist yet, first identify the release commit from `git log --oneline v<previous>..HEAD`.
- For Ambient releases, existing version tags are annotated tags pointing at the release version-bump commit.
- If a release branch PR has already been merged and the remote release branch is gone, do not use the branch name as `gh release create --target`; GitHub will reject it as `Release.target_commitish is invalid`.
- Avoid short SHA values with `gh release create --target` in this workflow; v2.6.4 failed with HTTP 422 (`tag_name is not a valid tag`, `target_commitish is invalid`) when using a short SHA.
- Preferred recovery flow when no tag exists:
  1. Confirm no local/remote target tag exists: `git tag --list vX.Y.Z` and `git ls-remote --tags origin vX.Y.Z`.
  2. Create an annotated tag at the full release commit SHA: `git tag -a vX.Y.Z <full-sha> -m "vX.Y.Z"`.
  3. Push the tag: `git push origin vX.Y.Z`.
  4. Create the GitHub Release from the verified tag: `gh release create vX.Y.Z --verify-tag --title "vX.Y.Z" --notes-file <notes-file>`.
  5. Verify: `gh release view vX.Y.Z --json tagName,name,url,isDraft,isPrerelease,targetCommitish`.
- If `gh release create` succeeds, report the release URL and whether it is draft/prerelease.
- Temporary release-note bodies may be stored under `.codex/`, but remember this workspace currently ignores `.codex/`.
