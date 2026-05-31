param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidatePattern('^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$')]
  [string]$Version,

  [string]$Remote = 'origin',
  [string]$BaseBranch = 'dev',
  [string]$TargetBranch = 'main',
  [switch]$SkipPull,
  [switch]$SkipPr
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Assert-CleanWorktree {
  $status = & git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw 'git status failed'
  }
  if ($status) {
    throw "Working tree is not clean. Commit or stash changes before starting a release.`n$status"
  }
}

function Invoke-NpmScript {
  param([Parameter(Mandatory = $true)][string]$ScriptName)
  & cmd /c "npm run $ScriptName"
  if ($LASTEXITCODE -ne 0) {
    throw "npm run $ScriptName failed with exit code $LASTEXITCODE"
  }
}

function Assert-NoDistDiff {
  $distStatus = & git status --porcelain -- dist
  if ($LASTEXITCODE -ne 0) {
    throw 'git status for dist failed'
  }
  if ($distStatus) {
    throw "Build produced dist differences. Resolve and commit before starting release.`n$distStatus"
  }
}

function Update-PackageVersion {
  param([string]$NextVersion)
  $packagePath = Join-Path (Get-Location) 'package.json'
  if (!(Test-Path -LiteralPath $packagePath)) {
    throw 'package.json was not found in the current directory.'
  }

  $script = @'
const fs = require('fs');
const path = 'package.json';
const version = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = version;
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
'@
  & node -e $script $NextVersion
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to update package.json version.'
  }
}

$releaseBranch = "release/v$Version"

Assert-CleanWorktree

Invoke-Git @('checkout', $BaseBranch)
if (!$SkipPull) {
  Invoke-Git @('pull', '--ff-only', $Remote, $BaseBranch)
}

Write-Host 'Running release gates: typecheck, build, and dist drift check.'
Invoke-NpmScript 'typecheck'
Invoke-NpmScript 'build'
Assert-NoDistDiff
Write-Host 'Release gates passed.'

$existingBranch = & git branch --list $releaseBranch
if ($existingBranch) {
  throw "Local branch '$releaseBranch' already exists."
}

Invoke-Git @('checkout', '-b', $releaseBranch)
Update-PackageVersion $Version

$changed = & git status --porcelain -- package.json
if (!$changed) {
  throw "package.json version is already $Version; no release commit was created."
}

Invoke-Git @('add', 'package.json')
Invoke-Git @('commit', '-m', "chore(release): bump version to $Version")
Invoke-Git @('push', '-u', $Remote, $releaseBranch)

if (!$SkipPr) {
  & gh pr create `
    --base $TargetBranch `
    --head $releaseBranch `
    --title "Release v$Version" `
    --body "Release v$Version. Bumps package.json version to $Version."
  if ($LASTEXITCODE -ne 0) {
    throw 'gh pr create failed.'
  }
}

Write-Host "Release branch is ready: $releaseBranch"
