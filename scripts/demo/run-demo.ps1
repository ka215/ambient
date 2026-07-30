param(
  [ValidateSet('local', 'cloud')]
  [string]$AmpEnv = 'local',

  [int]$Port = 8091,

  [string]$OutputName = 'ambient-demo.webm',

  [string[]]$PlaywrightArgs = @()
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
& (Join-Path $PSScriptRoot 'load-demo-env.ps1') -RepoRoot $repoRoot

if ($env:AMP_DEMO_PORT) {
  $Port = [int]$env:AMP_DEMO_PORT
}
if ($env:AMP_DEMO_OUTPUT_NAME) {
  $OutputName = $env:AMP_DEMO_OUTPUT_NAME
}

$outputRoot = Join-Path $repoRoot 'artifacts/demo/videos'
$previousAmpEnv = $env:AMP_ENV
$previousDebugMode = $env:DEBUG_MODE
$previousBaseUrl = $env:E2E_BASE_URL
$previousDemoFast = $env:AMP_DEMO_FAST
$phpProcess = $null

function Restore-EnvValue([string]$Name, [string]$Value) {
  if ($null -eq $Value) {
    Remove-Item "Env:$Name" -ErrorAction SilentlyContinue
  } else {
    Set-Item "Env:$Name" $Value
  }
}

try {
  New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
  Get-ChildItem -Path $outputRoot -Filter '*.webm' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force

  $env:AMP_ENV = $AmpEnv
  $env:DEBUG_MODE = 'true'
  $env:E2E_BASE_URL = "http://127.0.0.1:$Port/"

  $phpProcess = Start-Process `
    -FilePath 'php' `
    -ArgumentList '-S', "127.0.0.1:$Port", 'router.php' `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -PassThru

  Start-Sleep -Seconds 3

  Push-Location $repoRoot
  try {
    $args = @('test', '-c', 'playwright.demo.config.ts') + $PlaywrightArgs
    if ($env:AMP_DEMO_FAST -eq '1' -and -not ($args -match '^--timeout')) {
      $args += '--timeout=120000'
    }
    & .\node_modules\.bin\playwright.cmd @args
    if ($LASTEXITCODE -ne 0) {
      throw "Playwright demo recording failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  $latestVideo = Get-ChildItem -Path $outputRoot -Filter '*.webm' -Recurse |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latestVideo) {
    throw "No WebM video was produced under $outputRoot."
  }

  $finalPath = Join-Path $outputRoot $OutputName
  if ($latestVideo.FullName -ne $finalPath) {
    Copy-Item -LiteralPath $latestVideo.FullName -Destination $finalPath -Force
  }

  Write-Host "Demo video written to: $finalPath"
} finally {
  if ($phpProcess -and -not $phpProcess.HasExited) {
    Stop-Process -Id $phpProcess.Id -Force
  }

  Restore-EnvValue 'AMP_ENV' $previousAmpEnv
  Restore-EnvValue 'DEBUG_MODE' $previousDebugMode
  Restore-EnvValue 'E2E_BASE_URL' $previousBaseUrl
  Restore-EnvValue 'AMP_DEMO_FAST' $previousDemoFast
}
