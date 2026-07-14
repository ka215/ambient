param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('local', 'cloud')]
  [string]$AmpEnv,

  [Parameter(Mandatory = $true)]
  [int]$Port,

  [string[]]$PlaywrightArgs = @()
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$previousAmpEnv = $env:AMP_ENV
$previousDebugMode = $env:DEBUG_MODE
$previousBaseUrl = $env:E2E_BASE_URL

try {
  $env:AMP_ENV = $AmpEnv
  $env:DEBUG_MODE = 'true'
  $env:E2E_BASE_URL = "http://127.0.0.1:$Port/"

  $phpProcess = Start-Process `
    -FilePath 'php' `
    -ArgumentList '-S', "127.0.0.1:$Port", 'router.php' `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -PassThru

  try {
    Start-Sleep -Seconds 3
    Push-Location $repoRoot
    try {
      & .\node_modules\.bin\playwright.cmd test @PlaywrightArgs
      if ($LASTEXITCODE -ne 0) {
        throw "Playwright failed with exit code $LASTEXITCODE (AMP_ENV=$AmpEnv, PORT=$Port)."
      }
    } finally {
      Pop-Location
    }
  } finally {
    if ($phpProcess -and -not $phpProcess.HasExited) {
      Stop-Process -Id $phpProcess.Id -Force
    }
  }
} finally {
  if ($null -eq $previousAmpEnv) {
    Remove-Item Env:AMP_ENV -ErrorAction SilentlyContinue
  } else {
    $env:AMP_ENV = $previousAmpEnv
  }

  if ($null -eq $previousDebugMode) {
    Remove-Item Env:DEBUG_MODE -ErrorAction SilentlyContinue
  } else {
    $env:DEBUG_MODE = $previousDebugMode
  }

  if ($null -eq $previousBaseUrl) {
    Remove-Item Env:E2E_BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:E2E_BASE_URL = $previousBaseUrl
  }
}
