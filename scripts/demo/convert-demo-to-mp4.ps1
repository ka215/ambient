param(
  [string]$InputWebM,
  [string]$OutputMp4,
  [int]$FrameRate = 60
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
& (Join-Path $PSScriptRoot 'load-demo-env.ps1') -RepoRoot $repoRoot

if ($env:AMP_DEMO_MP4_FRAME_RATE) {
  $FrameRate = [int]$env:AMP_DEMO_MP4_FRAME_RATE
}

$videoRoot = Join-Path $repoRoot 'artifacts/demo/videos'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw 'ffmpeg is required but was not found in PATH.'
}

if ([string]::IsNullOrWhiteSpace($InputWebM)) {
  $latest = Get-ChildItem -Path $videoRoot -Filter '*.webm' -Recurse -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    throw "No WebM file found under $videoRoot."
  }

  $InputWebM = $latest.FullName
}

if (-not (Test-Path -LiteralPath $InputWebM)) {
  throw "Input WebM not found: $InputWebM"
}

if ([string]::IsNullOrWhiteSpace($OutputMp4)) {
  $OutputMp4 = [System.IO.Path]::ChangeExtension($InputWebM, '.mp4')
}

$outputDir = Split-Path -Parent $OutputMp4
if ($outputDir) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

& ffmpeg -y `
  -i $InputWebM `
  -r $FrameRate `
  -filter:v "minterpolate=fps=$($FrameRate):mi_mode=mci" `
  -c:v libx264 `
  -pix_fmt yuv420p `
  -c:a aac `
  -b:a 192k `
  -movflags +faststart `
  $OutputMp4
if ($LASTEXITCODE -ne 0) {
  throw "ffmpeg failed with exit code $LASTEXITCODE."
}

Write-Host "MP4 video written to: $OutputMp4"
Write-Host "Frame rate: $FrameRate fps with minterpolate=mci"
