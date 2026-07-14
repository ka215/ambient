param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot 'run-e2e-env.ps1'

Push-Location $repoRoot
try {
  & $runner `
    -AmpEnv cloud `
    -Port 8088 `
    -PlaywrightArgs @(
      'tests/e2e/scenarios/sc-010-cloud-myplaylist-regression.spec.ts',
      'tests/e2e/scenarios/sc-013-playlist-import-cloud.spec.ts',
      '--project=chrome'
    )
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud E2E verification failed with exit code $LASTEXITCODE"
  }

  & $runner `
    -AmpEnv local `
    -Port 8087 `
    -PlaywrightArgs @(
      'tests/e2e/scenarios/sc-014-playlist-import-local.spec.ts',
      'tests/e2e/scenarios/sc-020-v2-5-7-playlist-boot.spec.ts',
      '--project=chrome'
    )
  if ($LASTEXITCODE -ne 0) {
    throw "Local E2E verification failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}
