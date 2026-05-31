param(
  [string]$BaseUrl = 'https://amp.ka2.org/'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  throw 'BaseUrl must not be empty.'
}

$previousBaseUrl = $env:E2E_BASE_URL

try {
  $env:E2E_BASE_URL = $BaseUrl
  & cmd /c "npm run test:e2e:public"
  if ($LASTEXITCODE -ne 0) {
    throw "npm run test:e2e:public failed with exit code $LASTEXITCODE"
  }
} finally {
  if ($null -eq $previousBaseUrl) {
    Remove-Item Env:E2E_BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:E2E_BASE_URL = $previousBaseUrl
  }
}