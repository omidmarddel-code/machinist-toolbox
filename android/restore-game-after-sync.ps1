# ============================================================================
#  Machinist Toolbox - restore the Android game "Tolerance Master"
#  ---------------------------------------------------------------------------
#  Why: `npx cap sync android` (npm run sync) overwrites
#       android/app/src/main/assets/public with the contents of www/.
#       The game files (mobile-game.js / mobile-game.css) and the two lines
#       inside assets/public/index.html are Android-only, so they are lost.
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

Write-Host '== restore game: Tolerance Master =='
if (-not (Test-Path -LiteralPath $assets)) { throw "assets folder not found: $assets" }
if (-not (Test-Path -LiteralPath $backup)) { throw "game-backup folder not found: $backup" }

foreach ($f in @('mobile-game.js', 'mobile-game.css')) {
  $src = Join-Path $backup $f
  if (-not (Test-Path -LiteralPath $src)) { throw "missing master file: $src" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $assets $f) -Force
  Write-Host "  copied  $f"
}

if (-not (Test-Path -LiteralPath $index)) { throw "index.html not found: $index" }
$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8
$changed = $false

if ($html -notmatch 'mobile-game\.css') {
  $add = "`r`n  " + '<link rel="stylesheet" href="mobile-game.css" />'
  $html = $html -replace '(<link rel="stylesheet" href="mobile\.css" />)', ('$1' + $add)
  $changed = $true
}
if ($html -notmatch 'mobile-game\.js') {
  $add = "`r`n  " + '<script src="mobile-game.js" defer></script>'
  $html = $html -replace '(<script src="mobile\.js" defer></script>)', ('$1' + $add)
  $changed = $true
}

if ($changed) {
  [System.IO.File]::WriteAllText($index, $html, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '  patched assets/public/index.html'
} else {
  Write-Host '  index.html already references the game'
}

Write-Host '== done: rebuild the APK in Android Studio =='
