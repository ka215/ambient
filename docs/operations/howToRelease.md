# Release Procedure

Date: 2026-08-07
Canonical: yes
Companion: `.codex/tmp/ja-docs/howToRelease-ja.md`

## 1. Purpose

This document defines the standard Ambient release workflow using the currently implemented npm scripts.

The key rule is:

```text
Do not update package.json version during feature or fix implementation.
```

Version changes are performed by the release workflow, primarily through:

```bash
npm run release:start -- X.Y.Z
```

## 2. Pre-Work Check

Always confirm the current branch before starting release-related work:

```bash
git branch --show-current
```

If the branch is not the expected feature, fix, dev, or release branch for the current operation, stop and correct the branch first.

For ordinary feature or fix implementation:

- Do not run `npm version`.
- Do not manually edit `package.json` version.
- Leave version bumping to `npm run release:start -- X.Y.Z`.

## 3. Standard Release Flow

Prerequisites:

1. Feature branch changes have been merged into `dev`.
2. `git status --short` is clean.
3. The target version is known as `X.Y.Z`.

### Step 1: Start Release

```bash
npm run release:start -- X.Y.Z
```

This creates and pushes the release branch and opens the `release/vX.Y.Z -> main` PR by default.

### Step 2: Merge Release PR

Review and merge the GitHub PR from:

```text
release/vX.Y.Z -> main
```

### Step 3: Finish Release

```bash
npm run release:finish -- X.Y.Z
```

This updates local branches, syncs `dev`, and removes the release branch by default.

### Step 4: Optional Public-Like E2E

If production has not yet deployed the target version, verify against the dev public host instead of production.

Current expected dev host:

```text
https://dev-amp.ka2.org/
```

Run:

```bash
npm run release:verify:public
```

Or specify a URL directly:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-verify-public-e2e.ps1 -BaseUrl https://dev-amp.ka2.org/
```

## 4. E2E Command Selection

### Release Gate

`npm run test:e2e` runs the standard split cloud/local release E2E pack.

```bash
npm run test:e2e
```

This is equivalent to:

```bash
npm run release:verify:split-e2e
```

### Broad Smoke Matrix

`npm run test:e2e:matrix` runs a broad browser/device matrix against a single `baseURL`.

```bash
npm run test:e2e:matrix
```

Use this for development investigation and broad smoke checks. Do not treat it as the release gate.

## 5. `release:start`

Command:

```bash
npm run release:start -- X.Y.Z
```

Main actions:

- Verify clean worktree.
- Check out `dev`.
- Pull `origin/dev` with ff-only behavior.
- Run `npm run check:i18n`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Check that `dist` has no unexpected generated diff.
- Create `release/vX.Y.Z`.
- Update `package.json` version to `X.Y.Z`.
- Commit the release version bump.
- Push the release branch.
- Create a GitHub PR to `main` by default.

Useful options:

```bash
npm run release:start -- X.Y.Z -- -SkipPr
npm run release:start -- X.Y.Z -- -SkipPull
```

## 6. `release:finish`

Command:

```bash
npm run release:finish -- X.Y.Z
```

Main actions:

- Verify clean worktree.
- Update `main`.
- Merge or fast-forward `main` into `dev`.
- Push `dev`.
- Delete the release branch by default.

Useful options:

```bash
npm run release:finish -- X.Y.Z -- -AllowMergeCommit
npm run release:finish -- X.Y.Z -- -KeepReleaseBranch
npm run release:finish -- X.Y.Z -- -RunPublicE2E
npm run release:finish -- X.Y.Z -- -RunPublicE2E -PublicE2EBaseUrl https://example.com/
```

## 7. `release:prepare`

`release:prepare` is a pre-release helper.

Command:

```bash
npm run release:prepare -- X.Y.Z
```

Main actions:

1. Check out `feature/vX.Y.Z`, creating it from remote if needed.
2. Run `npm run check:i18n`.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Commit generated `dist` changes to the feature branch if needed.
6. Fast-forward pull `dev`.
7. Merge `feature/vX.Y.Z` into `dev`.
8. Push `dev` by default.

After this command, run:

```bash
npm run release:start -- X.Y.Z
```

## 8. Troubleshooting

| Symptom | Action |
|---|---|
| Dirty worktree stops a release command | Commit or stash the changes, then rerun. |
| ff-only update fails | Decide whether `-AllowMergeCommit` is acceptable. |
| Public E2E fails | Rerun `npm run release:verify:public` alone and inspect the failing scenario. |
| Public E2E points at an old production version | Verify the target version on `https://dev-amp.ka2.org/` first. |
| Release PR target is invalid | Confirm the release branch exists and was pushed. |
| Version changed during feature work | Revert the feature-time version edit and let `release:start` perform the bump. |

## 9. Release Notes Skill

Use the project `release-notes` skill when generating GitHub Release notes for Ambient.

The release note body should follow `.github/release-notes-template.md` and summarize user-relevant changes only.
