param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidatePattern('^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$')]
  [string]$Version,

  [string]$Remote = 'origin',
  [string]$DevBranch = 'dev',
  [string]$FeatureBranchPrefix = 'feature/v',
  [switch]$SkipDevPush
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Invoke-NpmScript {
  param([Parameter(Mandatory = $true)][string]$ScriptName)
  & cmd /c "npm run $ScriptName"
  if ($LASTEXITCODE -ne 0) {
    throw "npm run $ScriptName failed with exit code $LASTEXITCODE"
  }
}

function Assert-CleanWorktree {
  $status = & git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw 'git status failed'
  }
  if ($status) {
    throw "Working tree is not clean. Commit or stash changes before preparing a release.`n$status"
  }
}

function Test-LocalBranchExists {
  param([Parameter(Mandatory = $true)][string]$Branch)
  & git show-ref --verify --quiet "refs/heads/$Branch"
  if ($LASTEXITCODE -eq 0) {
    return $true
  }
  if ($LASTEXITCODE -eq 1) {
    return $false
  }
  throw "Failed to check local branch '$Branch'."
}

function Test-RemoteBranchExists {
  param([Parameter(Mandatory = $true)][string]$Branch)
  & git ls-remote --exit-code --heads $Remote $Branch *> $null
  if ($LASTEXITCODE -eq 0) {
    return $true
  }
  if ($LASTEXITCODE -eq 2) {
    return $false
  }
  throw "Failed to check remote branch '$Branch'."
}

$featureBranch = "$FeatureBranchPrefix$Version"

Assert-CleanWorktree

if (Test-LocalBranchExists -Branch $featureBranch) {
  Invoke-Git @('checkout', $featureBranch)
} elseif (Test-RemoteBranchExists -Branch $featureBranch) {
  Invoke-Git @('checkout', '-b', $featureBranch, '--track', "$Remote/$featureBranch")
} else {
  throw "Feature branch '$featureBranch' was not found locally or on remote '$Remote'."
}

Write-Host "Running release checks on $featureBranch"
Invoke-NpmScript 'check:i18n'
Invoke-NpmScript 'typecheck'
Write-Host "Running production build on $featureBranch"
Invoke-NpmScript 'build'

$distStatus = & git status --porcelain -- dist
if ($LASTEXITCODE -ne 0) {
  throw 'git status for dist failed'
}

if ($distStatus) {
  Invoke-Git @('add', 'dist')
  Invoke-Git @('commit', '-m', "build: refresh dist assets for release v$Version")
  Write-Host "Committed refreshed dist assets on $featureBranch"
} else {
  Write-Host "No dist changes detected after build on $featureBranch"
}

Invoke-Git @('checkout', $DevBranch)
Invoke-Git @('pull', '--ff-only', $Remote, $DevBranch)
Invoke-Git @('merge', '--no-edit', $featureBranch)

if (!$SkipDevPush) {
  Invoke-Git @('push', $Remote, $DevBranch)
}

Write-Host "Release preparation completed: $featureBranch merged into $DevBranch"