# ============================================================================
#  Machinist Toolbox - restore Android-only files (games + AI assistant)
#  ---------------------------------------------------------------------------
#  Why: `npx cap sync android` (npm run sync) overwrites
#       android/app/src/main/assets/public with the contents of www/.
#       Only the latest mobile.js / mobile.css (with the AI clear-chat key
#       under the search magnifier) are kept as master in www/, so they are
#       copied back from android/game-backup/ after every sync.
#       The Android-only files are mobile-game.js / mobile-game.css (games)
#       and mobile-ai.js / mobile-ai.css (AI assistant); their four lines
#       inside assets/public/index.html are lost by that sync.
#
#  What: copies the master files from android/game-backup/ into
#       android/app/src/main/assets/public/ and makes sure index.html
#       references them again. Safe to run many times (idempotent).
#
#  Usage: powershell -ExecutionPolicy Bypass -File android\restore-game-after-sync.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$android = Split-Path -Parent $MyInvocation.MyCommand.Path
$backup  = Join-Path $android 'game-backup'
$assets  = Join-Path $android 'app\src\main\assets\public'
$index   = Join-Path $assets 'index.html'

Write-Host '== restore Android-only files: games + AI assistant =='
if (-not (Test-Path -LiteralPath $assets)) { throw "assets folder not found: $assets" }
if (-not (Test-Path -LiteralPath $backup)) { throw "game-backup folder not found: $backup" }

foreach ($f in @('mobile.js', 'mobile.css', 'mobile-game.js', 'mobile-game.css', 'mobile-ai.js', 'mobile-ai.css')) {
  $src = Join-Path $backup $f
  if (-not (Test-Path -LiteralPath $src)) { throw "missing master file: $src" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $assets $f) -Force
  Write-Host "  copied  $f"
}

# موتور OCR محلی (Tesseract.js) هم باید داخل بستهٔ اندروید باشد تا خواندن
# متن نقشه بدون اینترنت و بدون CDN انجام شود.
$tessBackup = Join-Path $backup 'vendor\tesseract'
$tessAssets = Join-Path $assets 'vendor\tesseract'
if (Test-Path -LiteralPath $tessBackup) {
  if (-not (Test-Path -LiteralPath $tessAssets)) { New-Item -ItemType Directory -Path $tessAssets -Force | Out-Null }
  Copy-Item -Path (Join-Path $tessBackup '*') -Destination $tessAssets -Recurse -Force
  Write-Host "  copied  vendor/tesseract/"
}


if (-not (Test-Path -LiteralPath $index)) { throw "index.html not found: $index" }
$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8
$changed = $false

if ($html -notmatch 'mobile-game\.css') {
  $add = "`r`n  " + '<link rel="stylesheet" href="mobile-game.css" />'
  $html = $html -replace '(<link rel="stylesheet" href="mobile\.css"([^"]*)?" />)', ('$1' + $add)
  $changed = $true
}
if ($html -notmatch 'mobile-game\.js') {
  $add = "`r`n  " + '<script src="mobile-game.js" defer></script>'
  $html = $html -replace '(<script src="mobile\.js"([^"]*)?" defer></script>)', ('$1' + $add)
  $changed = $true
}

if ($html -notmatch 'mobile-ai\.css') {
  $add = "`r`n  " + '<link rel="stylesheet" href="mobile-ai.css" />'
  $html = $html -replace '(<link rel="stylesheet" href="mobile-game\.css" />)', ('$1' + $add)
  $changed = $true
}
if ($html -notmatch 'mobile-ai\.js') {
  $add = "`r`n  " + '<script src="mobile-ai.js" defer></script>'
  $html = $html -replace '(<script src="mobile-game\.js" defer></script>)', ('$1' + $add)
  $changed = $true
}

if ($changed) {
  [System.IO.File]::WriteAllText($index, $html, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '  patched assets/public/index.html'
} else {
  Write-Host '  index.html already references the Android-only files'
}

Write-Host '== done: rebuild the APK in Android Studio =='
