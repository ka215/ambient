param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidatePattern('^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$')]
  [string]$Version,

  [string]$Remote = 'origin',
  [string]$MainBranch = 'main',
  [string]$DevBranch = 'dev',
  [switch]$AllowMergeCommit,
  [switch]$KeepReleaseBranch,
  [switch]$RunPublicE2E,
  [string]$PublicE2EBaseUrl = 'https://amp.ka2.org/'
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
    throw "Working tree is not clean. Commit or stash changes before finishing a release.`n$status"
  }
}

$releaseBranch = "release/v$Version"

Assert-CleanWorktree

Invoke-Git @('checkout', $MainBranch)
Invoke-Git @('pull', '--ff-only', $Remote, $MainBranch)

Invoke-Git @('checkout', $DevBranch)
if ($AllowMergeCommit) {
  Invoke-Git @('merge', $MainBranch)
} else {
  Invoke-Git @('merge', '--ff-only', $MainBranch)
}
Invoke-Git @('push', $Remote, $DevBranch)

if ($RunPublicE2E) {
  Write-Host "Running public E2E verification against: $PublicE2EBaseUrl"
  & npm run release:verify:public -- -BaseUrl $PublicE2EBaseUrl
  if ($LASTEXITCODE -ne 0) {
    throw "Public E2E verification failed with exit code $LASTEXITCODE"
  }
}

if (!$KeepReleaseBranch) {
  & git show-ref --verify --quiet "refs/heads/$releaseBranch"
  if ($LASTEXITCODE -eq 0) {
    Invoke-Git @('branch', '-d', $releaseBranch)
  } elseif ($LASTEXITCODE -eq 1) {
    Write-Host "Local branch '$releaseBranch' was already absent."
  } else {
    throw "Failed to check local branch '$releaseBranch'."
  }

  & git ls-remote --exit-code --heads $Remote $releaseBranch *> $null
  if ($LASTEXITCODE -eq 0) {
    Invoke-Git @('push', $Remote, '--delete', $releaseBranch)
  } elseif ($LASTEXITCODE -eq 2) {
    Write-Host "Remote branch '$releaseBranch' was already absent."
  } else {
    throw "Failed to check remote branch '$releaseBranch'."
  }
}

Write-Host "Release v$Version finish flow completed."
